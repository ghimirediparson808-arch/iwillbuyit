import { NextRequest, NextResponse } from "next/server";
import { verifyActiveAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/requests - Fetch all requests for admin
export async function GET() {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const { data: requests, error } = await adminClient
      .from("requests")
      .select("*, customers(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch requests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/admin/requests - Handle status, notes, or conversion
export async function PATCH(request: NextRequest) {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { requestId, action, status, notes, unitPrice, quantity, adminNotes } = body;

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    // Action 1: Status Update (New, Contacted, Closed)
    if (action === "update-status") {
      const allowed = ["New", "Contacted", "Closed"];
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: "Invalid request status transition" }, { status: 400 });
      }

      const { data: updated, error } = await adminClient
        .from("requests")
        .update({
          status,
          closed_at: status === "Closed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Audit history
      await adminClient.from("activity_history").insert({
        entity_type: "request",
        entity_id: requestId,
        action: `Request status marked ${status.toLowerCase()}`,
        admin_id: auth.userId,
      });

      return NextResponse.json({ success: true, request: updated });
    }

    // Action 2: Update Private Notes
    if (action === "save-note") {
      const { data: updated, error } = await adminClient
        .from("requests")
        .update({
          admin_notes: notes || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await adminClient.from("activity_history").insert({
        entity_type: "request",
        entity_id: requestId,
        action: "Private admin notes updated",
        admin_id: auth.userId,
      });

      return NextResponse.json({ success: true, request: updated });
    }

    // Action 3: Convert Request to Order via Transactional RPC
    if (action === "convert-to-order") {
      if (unitPrice === undefined || unitPrice < 0) {
        return NextResponse.json({ error: "Positive unit price required" }, { status: 400 });
      }

      const convertQty = quantity && quantity > 0 ? quantity : 1;

      const { data: rpcRes, error: rpcError } = await adminClient.rpc(
        "convert_request_to_order",
        {
          p_request_id: requestId,
          p_unit_price: unitPrice,
          p_quantity: convertQty,
          p_admin_notes: adminNotes || "",
        },
      );

      if (rpcError || !rpcRes) {
        return NextResponse.json({ error: rpcError?.message || "Order conversion failed" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        orderId: rpcRes.order_id,
        orderCode: rpcRes.order_code,
        alreadyConverted: rpcRes.already_converted,
      });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
