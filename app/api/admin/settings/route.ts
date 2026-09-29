import { NextRequest, NextResponse } from "next/server";
import { verifyActiveAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data: settings, error } = await adminClient
      .from("site_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings";
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
    const { brandName, whatsappLocal, whatsappE164, whatsappUrl } = body;

    const { data: current } = await adminClient.from("site_settings").select("id").limit(1).single();

    const payload = {
      brand_name: brandName || "I WILL BUY IT",
      whatsapp_local: whatsappLocal || "9813115554",
      whatsapp_e164: whatsappE164 || "+9779813115554",
      whatsapp_url: whatsappUrl || "https://wa.me/9779813115554",
      updated_at: new Date().toISOString(),
    };

    let updated;
    let error;

    if (current?.id) {
      const res = await adminClient.from("site_settings").update(payload).eq("id", current.id).select().single();
      updated = res.data;
      error = res.error;
    } else {
      const res = await adminClient.from("site_settings").insert(payload).select().single();
      updated = res.data;
      error = res.error;
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Settings update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
