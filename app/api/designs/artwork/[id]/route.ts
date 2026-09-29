import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyActiveAdmin } from "@/lib/auth-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const adminClient = createAdminClient();

    // Query design status
    const { data: design, error: designError } = await adminClient
      .from("designs")
      .select("id, status, deleted_at")
      .eq("id", id)
      .single();

    if (designError || !design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const isPublished = design.status === "published" && !design.deleted_at;

    if (!isPublished) {
      // Draft / unpublished artwork requires active admin check
      const auth = await verifyActiveAdmin();
      if (!auth.authorized) {
        return NextResponse.json(
          { error: "Forbidden: Draft artwork requires active admin authorization" },
          { status: 403 },
        );
      }
    }

    // Get color and side parameters
    const searchParams = request.nextUrl.searchParams;
    const colour = searchParams.get("colour") || "navy";
    const side = searchParams.get("side") || "front";

    // Query matching variant
    const { data: variant, error: variantError } = await adminClient
      .from("design_variants")
      .select("transparent_artwork_path")
      .eq("design_id", id)
      .eq("garment_colour", colour)
      .eq("print_side", side)
      .single();

    if (variantError || !variant || !variant.transparent_artwork_path) {
      return NextResponse.json({ error: "Artwork variant not found" }, { status: 404 });
    }

    const assetPath = variant.transparent_artwork_path;

    // Static assets stored in /public
    if (assetPath.startsWith("/assets/")) {
      return NextResponse.redirect(new URL(assetPath, request.url));
    }

    // Storage bucket assets stored in design-assets
    const pathInBucket = assetPath.replace(/^design-assets\//, "");
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("design-assets")
      .download(pathInBucket);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: "Could not retrieve artwork file" }, { status: 404 });
    }

    const buffer = await fileData.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": fileData.type || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Artwork request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
