import { NextRequest, NextResponse } from "next/server";
import { verifyActiveAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const { data: inventory, error } = await adminClient
      .from("inventory")
      .select("*")
      .order("garment_colour")
      .order("size");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inventory });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch inventory";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { garmentColour, size, quantityAvailable, lowStockThreshold } = body;

    if (!garmentColour || !size || quantityAvailable === undefined || quantityAvailable < 0) {
      return NextResponse.json({ error: "Valid colour, size, and non-negative quantity required" }, { status: 400 });
    }

    const { data: updated, error } = await adminClient
      .from("inventory")
      .upsert(
        {
          garment_colour: garmentColour,
          size,
          quantity_available: quantityAvailable,
          low_stock_threshold: lowStockThreshold || 5,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "garment_colour,size" },
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, inventory: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Inventory update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
