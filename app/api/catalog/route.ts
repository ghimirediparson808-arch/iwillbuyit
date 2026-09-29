import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const adminClient = createAdminClient();

    // Query published non-deleted designs
    const { data: designs, error: desError } = await adminClient
      .from("designs")
      .select("id, code, name, category, short_description, full_description, tags, featured, gallery_cover, created_at")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (desError || !designs) {
      return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
    }

    const designIds = designs.map((d) => d.id);

    // Query available variants for published designs
    const { data: variants } = await adminClient
      .from("design_variants")
      .select("id, design_id, garment_colour, print_side, is_available, sort_order")
      .in("design_id", designIds)
      .eq("is_available", true);

    // Query enabled sizes for published designs
    const { data: sizes } = await adminClient
      .from("design_sizes")
      .select("id, design_id, size, is_enabled")
      .in("design_id", designIds)
      .eq("is_enabled", true);

    const result = designs.map((d) => {
      const designVariants = (variants || []).filter((v) => v.design_id === d.id);
      const designSizes = (sizes || []).filter((s) => s.design_id === d.id).map((s) => s.size);

      return {
        ...d,
        variants: designVariants.map((v) => ({
          id: v.id,
          colour: v.garment_colour,
          side: v.print_side,
          artworkUrl: `/api/designs/artwork/${d.id}?colour=${v.garment_colour}&side=${v.print_side}`,
        })),
        sizes: designSizes,
      };
    });

    return NextResponse.json({ catalog: result }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Catalog request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
