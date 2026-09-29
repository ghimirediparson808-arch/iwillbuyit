import { NextRequest, NextResponse } from "next/server";
import { verifyActiveAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/orders - List all orders for admin
export async function GET() {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const { data: orders, error } = await adminClient
      .from("orders")
      .select("*, order_items(*), customers(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/orders - Create manual order
export async function POST(request: NextRequest) {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { contactName, contactPhone, designId, garmentColour, printSide, size, quantity, unitPrice, adminNotes } = body;

    if (!contactName || !contactPhone || contactPhone.replace(/\D/g, "").length < 7) {
      return NextResponse.json({ error: "Customer name and valid phone number are required" }, { status: 400 });
    }

    if (!garmentColour || !printSide || !size || quantity < 1 || unitPrice < 0) {
      return NextResponse.json({ error: "Valid garment selections, positive quantity, and non-negative price required" }, { status: 400 });
    }

    const totalNpr = unitPrice * quantity;
    const orderCode = `IWBI-O${Math.floor(100000 + Math.random() * 900000)}`;

    // Normalize customer phone & upsert customer
    const normalizedPhone = contactPhone.replace(/\D/g, "");
    let customerId: string | null = null;

    const { data: custData } = await adminClient
      .from("customers")
      .upsert(
        { name: contactName, phone: contactPhone, normalized_phone: normalizedPhone },
        { onConflict: "normalized_phone" },
      )
      .select("id")
      .single();

    if (custData) customerId = custData.id;

    // Create order
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        order_code: orderCode,
        customer_id: customerId,
        contact_name: contactName,
        contact_phone: contactPhone,
        payment_status: "Unpaid",
        production_status: "Confirmed",
        total_npr: totalNpr,
        admin_notes: adminNotes || "",
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || "Failed to create manual order" }, { status: 500 });
    }

    // Insert order item snapshot
    let designNameSnapshot = "Custom Design";
    let designCodeSnapshot = "Custom";

    if (designId) {
      const { data: des } = await adminClient
        .from("designs")
        .select("name, code")
        .eq("id", designId)
        .single();
      if (des) {
        designNameSnapshot = des.name;
        designCodeSnapshot = des.code;
      }
    }

    await adminClient.from("order_items").insert({
      order_id: order.id,
      design_id: designId || null,
      design_name_snapshot: designNameSnapshot,
      design_code_snapshot: designCodeSnapshot,
      garment_colour: garmentColour,
      print_side: printSide,
      size,
      quantity,
      unit_price_npr: unitPrice,
      line_total_npr: totalNpr,
    });

    // Audit log
    await adminClient.from("activity_history").insert({
      entity_type: "order",
      entity_id: order.id,
      action: "Manual order created",
      admin_id: auth.userId,
    });

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Manual order creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/admin/orders - Payment, production, note, or archive updates
export async function PATCH(request: NextRequest) {
  const auth = await verifyActiveAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { orderId, action, paymentStatus, productionStatus, notes } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Payment transition (Unpaid -> Paid -> Refunded)
    if (action === "update-payment") {
      const allowed = ["Unpaid", "Paid", "Refunded"];
      if (!allowed.includes(paymentStatus)) {
        return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
      }

      const { data: updated, error } = await adminClient
        .from("orders")
        .update({
          payment_status: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await adminClient.from("activity_history").insert({
        entity_type: "order",
        entity_id: orderId,
        action: `Payment status marked ${paymentStatus.toLowerCase()}`,
        admin_id: auth.userId,
      });

      return NextResponse.json({ success: true, order: updated });
    }

    // Production stage transition
    if (action === "update-production") {
      const allowed = ["Confirmed", "Printing", "Quality Check", "Ready", "Delivered", "Cancelled"];
      if (!allowed.includes(productionStatus)) {
        return NextResponse.json({ error: "Invalid production status" }, { status: 400 });
      }

      const { data: updated, error } = await adminClient
        .from("orders")
        .update({
          production_status: productionStatus,
          cancelled_at: productionStatus === "Cancelled" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await adminClient.from("activity_history").insert({
        entity_type: "order",
        entity_id: orderId,
        action: `Production stage marked ${productionStatus.toLowerCase()}`,
        admin_id: auth.userId,
      });

      return NextResponse.json({ success: true, order: updated });
    }

    // Private Admin Notes
    if (action === "save-note") {
      const { data: updated, error } = await adminClient
        .from("orders")
        .update({
          admin_notes: notes || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true, order: updated });
    }

    // Archive / Restore
    if (action === "archive" || action === "restore") {
      const isArchive = action === "archive";
      const { data: updated, error } = await adminClient
        .from("orders")
        .update({
          archived_at: isArchive ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await adminClient.from("activity_history").insert({
        entity_type: "order",
        entity_id: orderId,
        action: isArchive ? "Order archived" : "Order restored",
        admin_id: auth.userId,
      });

      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Order operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
