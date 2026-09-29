import { NextRequest, NextResponse } from "next/server";
import { verifyActiveAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/designs - List designs for admin (including drafts & deleted)
export async function GET() {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const { data: designs, error } = await adminClient
      .from("designs")
      .select("*, design_variants(*), design_sizes(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ designs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch designs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/designs - Create a new design or upload variant artwork
export async function POST(request: NextRequest) {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  // Upload variant artwork
  if (contentType.includes("multipart/form-data")) {
    let uploadedPath: string | null = null;
    let adminClient;

    try {
      adminClient = createAdminClient();
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const designId = formData.get("designId")?.toString().trim();
      const garmentColour = formData.get("garmentColour")?.toString().trim().toLowerCase();
      const printSide = formData.get("printSide")?.toString().trim().toLowerCase();

      if (!file || file.size === 0) {
        return NextResponse.json({ error: "Image file is required" }, { status: 400 });
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Artwork file must be 10 MB or smaller" }, { status: 400 });
      }

      const allowedMimes = ["image/png", "image/jpeg", "image/webp"];
      if (!allowedMimes.includes(file.type)) {
        return NextResponse.json({ error: "Allowed image formats: PNG, JPEG, WebP" }, { status: 400 });
      }

      // Magic Bytes Inspection
      const buffer = new Uint8Array(await file.arrayBuffer());
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isWebp =
        String.fromCharCode(...buffer.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...buffer.slice(8, 12)) === "WEBP";

      if (!(isPng || isJpg || isWebp)) {
        return NextResponse.json({ error: "Invalid image header or file signature" }, { status: 400 });
      }

      const ext = isPng ? "png" : isJpg ? "jpg" : "webp";
      const filename = `${crypto.randomUUID()}.${ext}`;
      uploadedPath = filename;

      const { error: uploadError } = await adminClient.storage
        .from("design-assets")
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: "Could not upload design asset" }, { status: 500 });
      }

      const fullAssetPath = `design-assets/${filename}`;

      // Update variant record if designId, colour, and side provided
      if (designId && garmentColour && printSide) {
        const { error: variantError } = await adminClient
          .from("design_variants")
          .upsert(
            {
              design_id: designId,
              garment_colour: garmentColour,
              print_side: printSide,
              transparent_artwork_path: fullAssetPath,
              is_available: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "design_id,garment_colour,print_side" },
          );

        if (variantError) {
          // Clean up orphan file if variant DB write fails
          await adminClient.storage.from("design-assets").remove([filename]);
          return NextResponse.json({ error: variantError.message }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        assetPath: fullAssetPath,
      });
    } catch (err: unknown) {
      if (uploadedPath && adminClient) {
        await adminClient.storage.from("design-assets").remove([uploadedPath]);
      }
      const message = err instanceof Error ? err.message : "Artwork upload failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Create design metadata JSON
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { name, category, shortDescription, fullDescription, tags, featured, galleryCover, sizes } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    const code = `IWBI-${Math.floor(100 + Math.random() * 900)}`;

    const { data: design, error: designError } = await adminClient
      .from("designs")
      .insert({
        code,
        name,
        category,
        short_description: shortDescription || "",
        full_description: fullDescription || "",
        tags: tags || [],
        status: "draft",
        featured: !!featured,
        gallery_cover: galleryCover || null,
      })
      .select()
      .single();

    if (designError || !design) {
      return NextResponse.json({ error: designError?.message || "Failed to create design" }, { status: 500 });
    }

    // Insert enabled sizes (default S, M, L, XL, XXL)
    const enabledSizes = sizes && sizes.length > 0 ? sizes : ["S", "M", "L", "XL", "XXL"];
    const sizeRows = enabledSizes.map((sz: string) => ({
      design_id: design.id,
      size: sz,
      is_enabled: true,
    }));

    await adminClient.from("design_sizes").insert(sizeRows);

    return NextResponse.json({ success: true, design });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Design creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/admin/designs - Update status, availability, or metadata
export async function PATCH(request: NextRequest) {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { id, action, ...patch } = body;

    if (!id) {
      return NextResponse.json({ error: "Design ID is required" }, { status: 400 });
    }

    if (action === "soft-delete") {
      const { error } = await adminClient
        .from("designs")
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, action: "soft-delete" });
    }

    if (action === "restore") {
      const { error } = await adminClient
        .from("designs")
        .update({ deleted_at: null, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, action: "restore" });
    }

    // Standard patch update
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.category !== undefined) updateData.category = patch.category;
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.featured !== undefined) updateData.featured = patch.featured;
    if (patch.galleryCover !== undefined) updateData.gallery_cover = patch.galleryCover;

    const { data: updated, error } = await adminClient
      .from("designs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, design: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Design update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
