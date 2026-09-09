import type {
  RequestRecord,
  RequestStatus,
  OrderInput,
  OrderRecord,
  PaymentStatus,
  ProductionStatus,
} from "@/types";
import { read, write } from "./storage";
import { repository } from "./repository";
import { printArtwork } from "./artwork";
type Commerce = {
  version: 2;
  requests: RequestRecord[];
  orders: OrderRecord[];
  removedOrders: { order: OrderRecord; until: number }[];
};
const event = (text: string) => ({ text, at: new Date().toISOString() });
const id = (kind: string) =>
  `IWBI-${kind}${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
function data(): Commerce {
  const saved = read<Commerce | null>("commerce", null);
  if (saved) {
    const removedOrders = (saved.removedOrders || []).filter(
      (r) => r.until > Date.now(),
    );
    if (removedOrders.length !== (saved.removedOrders || []).length)
      write("commerce", { ...saved, removedOrders }, false);
    return { ...saved, removedOrders };
  }
  const legacy = read<RequestRecord[]>("requests", []);
  const requests = legacy.map((r) => {
    const design = repository.designs(true).find((d) => d.id === r.designId);
    return {
      ...r,
      designSnapshot:
        r.designSnapshot ||
        (design
          ? {
              name: design.name,
              code: design.id,
              artwork:
                r.variantArtwork ||
                printArtwork(
                  design,
                  r.colour,
                  r.side === "back" ? "back" : "front",
                ),
            }
          : undefined),
      activity: r.activity || [],
      status: r.orderStatus
        ? "Converted to Order"
        : r.status === "Closed"
          ? "Closed"
          : ["New", "New Request"].includes(r.status)
            ? "New"
            : "Contacted",
    };
  });
  const orders: OrderRecord[] = legacy
    .filter((r) => r.orderStatus)
    .map((r) => {
      const paid = [
        "Paid",
        "Printing",
        "Quality Check",
        "Ready",
        "Delivered",
      ].includes(r.orderStatus!);
      const input: OrderInput = {
        ...r,
        designId: r.designId || "custom",
        total: r.quote || 0,
      };
      const orderId = id("O");
      requests.find((v) => v.id === r.id)!.orderId = orderId;
      return {
        ...input,
        id: orderId,
        requestId: r.id,
        createdAt: r.createdAt,
        snapshot: snapshot(input, r),
        paymentStatus: paid ? "Paid" : "Unpaid",
        productionStatus:
          r.orderStatus === "Quality Check"
            ? "Printing"
            : ["Printing", "Ready", "Delivered", "Cancelled"].includes(
                  r.orderStatus!,
                )
              ? (r.orderStatus as ProductionStatus)
              : "Confirmed",
        everPaid: paid,
        archived: false,
        activity: [
          ...(r.activity || []),
          event("Migrated from the previous order workflow"),
        ],
      };
    });
  const result: Commerce = { version: 2, requests, orders, removedOrders: [] };
  if (typeof window !== "undefined") write("commerce", result, false);
  return result;
}
function snapshot(
  input: OrderInput,
  request?: RequestRecord,
): OrderRecord["snapshot"] {
  const design = repository.designs(true).find((d) => d.id === input.designId);
  const rememberedArtwork =
    request &&
    input.designId === request.designId &&
    input.colour === request.colour &&
    input.side === request.side
      ? request.variantArtwork || request.designSnapshot?.artwork
      : "";
  const artwork =
    rememberedArtwork ||
    (design
      ? printArtwork(
          design,
          input.colour,
          input.side === "both" ? "front" : input.side,
        )
      : request?.designSnapshot?.artwork ||
        request?.variantArtwork ||
        (request?.uploadId ? "upload:" + request.uploadId : ""));
  return {
    name: design?.name || request?.designSnapshot?.name || "Custom design",
    code:
      design?.id || request?.designSnapshot?.code || request?.id || "Custom",
    artwork,
    backArtwork:
      input.side === "both" && design
        ? printArtwork(design, input.colour, "back")
        : undefined,
    colour: input.colour,
    side: input.side,
    size: input.size,
    quantity: input.quantity,
    total: input.total,
    unitPrice: input.unitPrice,
  };
}
function validate(input: OrderInput, request?: RequestRecord) {
  if (!input.name.trim() || input.phone.replace(/\D/g, "").length < 7)
    throw new Error("Enter the customer name and a valid WhatsApp number.");
  if (
    !input.designId ||
    !["navy", "black", "cream"].includes(input.colour) ||
    !["front", "back", "both"].includes(input.side) ||
    !input.size.trim()
  )
    throw new Error("Choose the design, colour, print side and size.");
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    !Number.isFinite(input.total) ||
    input.total <= 0 ||
    (input.unitPrice !== undefined &&
      (!Number.isFinite(input.unitPrice) || input.unitPrice < 0))
  )
    throw new Error("Enter a whole quantity and a positive total price.");
  const design = repository.designs(true).find((d) => d.id === input.designId);
  if (
    !design &&
    (!request || ![request.designId, "custom"].includes(input.designId))
  )
    throw new Error("Choose an existing design.");
  if (
    design &&
    (!(design.sizes || []).includes(input.size) ||
      !(input.side === "both" ? ["front", "back"] : [input.side]).every(
        (side) => design.sides?.includes(side as "front" | "back"),
      ) ||
      !printArtwork(
        design,
        input.colour,
        input.side === "both" ? "front" : input.side,
      ) ||
      (input.side === "both" && !printArtwork(design, input.colour, "back")))
  )
    throw new Error(
      "This design has no artwork or size assigned to that garment selection. Edit the design first or choose an assigned variant.",
    );
}
function makeOrder(input: OrderInput, request?: RequestRecord): OrderRecord {
  validate(input, request);
  return {
    ...input,
    name: input.name.trim(),
    phone: input.phone.trim(),
    id: id("O"),
    requestId: request?.id,
    createdAt: new Date().toISOString(),
    paymentStatus: "Unpaid",
    productionStatus: "Confirmed",
    everPaid: false,
    archived: false,
    snapshot: snapshot(input, request),
    activity: [
      event(
        request ? `Created from request ${request.id}` : "Manual order created",
      ),
    ],
  };
}
function mutateOrder(orderId: string, action: (order: OrderRecord) => void) {
  const state = data();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order not found.");
  action(order);
  write("commerce", state);
  return order;
}
function mutateRequest(
  requestId: string,
  action: (request: RequestRecord) => void,
) {
  const state = data();
  const request = state.requests.find((r) => r.id === requestId);
  if (!request) throw new Error("Request not found.");
  action(request);
  write("commerce", state);
  return request;
}
export const commerceActions = {
  requests: (): RequestRecord[] => data().requests,
  orders: (): OrderRecord[] => data().orders,
  createRequest(value: RequestRecord) {
    if (
      !value.name.trim() ||
      value.phone.replace(/\D/g, "").length < 7 ||
      !value.description.trim()
    )
      throw new Error(
        "Enter a name, valid WhatsApp number and request description.",
      );
    if (
      !Number.isInteger(value.quantity) ||
      value.quantity < 1 ||
      !["navy", "black", "cream"].includes(value.colour) ||
      !["front", "back", "both"].includes(value.side) ||
      !value.size.trim()
    )
      throw new Error("Choose valid garment details and a whole quantity.");
    const state = data();
    if (state.requests.some((r) => r.id === value.id))
      throw new Error("This request has already been saved.");
    const design = repository
      .designs(true)
      .find((d) => d.id === value.designId);
    if (
      value.designId &&
      (!design || design.available === false || !design.published)
    )
      throw new Error("This design is currently unavailable.");
    if (
      design &&
      (!(design.sizes || []).includes(value.size) ||
        !(value.side === "both" ? ["front", "back"] : [value.side]).every(
          (side) => design.sides?.includes(side as "front" | "back"),
        ) ||
        !printArtwork(
          design,
          value.colour,
          value.side === "both" ? "front" : value.side,
        ))
    )
      throw new Error("This garment selection is unavailable.");
    const record: RequestRecord = {
      ...value,
      status: "New",
      orderStatus: undefined,
      orderId: undefined,
      designSnapshot: design
        ? {
            name: design.name,
            code: design.id,
            artwork:
              value.variantArtwork ||
              printArtwork(
                design,
                value.colour,
                value.side === "back" ? "back" : "front",
              ),
          }
        : undefined,
    };
    state.requests.unshift(record);
    write("commerce", state);
    return record;
  },
  updateRequestStatus(requestId: string, status: RequestStatus) {
    if (!["New", "Contacted", "Closed"].includes(status))
      throw new Error("Use Create Order to convert a request.");
    return mutateRequest(requestId, (r) => {
      if (r.orderId)
        throw new Error("Converted requests retain their linked order.");
      if (r.status !== status) {
        r.status = status;
        r.activity.push(event(`Request ${status.toLowerCase()}`));
      }
    });
  },
  closeRequest(requestId: string) {
    return commerceActions.updateRequestStatus(requestId, "Closed");
  },
  reopenRequest(requestId: string) {
    return commerceActions.updateRequestStatus(requestId, "New");
  },
  deleteRequest(requestId: string) {
    const state = data();
    const request = state.requests.find((r) => r.id === requestId);
    if (request?.orderId || state.orders.some((o) => o.requestId === requestId))
      throw new Error("Converted requests cannot be deleted.");
    state.requests = state.requests.filter((r) => r.id !== requestId);
    write("commerce", state);
  },
  saveRequestNote(requestId: string, notes: string) {
    return mutateRequest(requestId, (r) => {
      r.notes = notes;
      r.activity.push(event("Private note updated"));
    });
  },
  convertRequestToOrder(requestId: string, input: OrderInput) {
    const state = data();
    const request = state.requests.find((r) => r.id === requestId);
    if (!request) throw new Error("Request not found.");
    const existing = state.orders.find((o) => o.requestId === requestId);
    if (existing) return existing;
    if (request.status === "Closed")
      throw new Error("Reopen this request before creating an order.");
    const order = makeOrder(input, request);
    state.orders.unshift(order);
    request.orderId = order.id;
    request.status = "Converted to Order";
    request.activity.push(event(`Converted to order ${order.id}`));
    write("commerce", state);
    return order;
  },
  createManualOrder(input: OrderInput) {
    const state = data();
    const order = makeOrder(input);
    state.orders.unshift(order);
    write("commerce", state);
    return order;
  },
  updatePaymentStatus(orderId: string, status: PaymentStatus) {
    return mutateOrder(orderId, (o) => {
      if (o.archived) throw new Error("Restore this order before changing it.");
      if (!(
        (o.paymentStatus === "Unpaid" && status === "Paid") ||
        (o.paymentStatus === "Paid" && status === "Refunded")
      ))
        throw new Error("This payment transition is unavailable.");
      o.paymentStatus = status;
      if (status === "Paid") o.everPaid = true;
      o.activity.push(event(`Payment marked ${status.toLowerCase()}`));
    });
  },
  updateProductionStatus(orderId: string, status: ProductionStatus) {
    return mutateOrder(orderId, (o) => {
      const next: Partial<Record<ProductionStatus, ProductionStatus>> = {
        Confirmed: "Printing",
        Printing: "Ready",
        Ready: "Delivered",
      };
      if (
        o.archived ||
        o.paymentStatus !== "Paid" ||
        next[o.productionStatus] !== status
      )
        throw new Error("Complete the current order stage first.");
      o.productionStatus = status;
      o.activity.push(event(`Production marked ${status.toLowerCase()}`));
    });
  },
  saveOrderNote(orderId: string, notes: string) {
    return mutateOrder(orderId, (o) => {
      o.notes = notes;
      o.activity.push(event("Private note updated"));
    });
  },
  cancelOrder(orderId: string) {
    return mutateOrder(orderId, (o) => {
      if (o.archived || ["Delivered", "Cancelled"].includes(o.productionStatus))
        throw new Error("This order cannot be cancelled.");
      o.productionStatus = "Cancelled";
      o.activity.push(event("Order cancelled. Payment status retained."));
    });
  },
  archiveOrder(orderId: string) {
    return mutateOrder(orderId, (o) => {
      o.archived = true;
      o.activity.push(event("Order archived"));
    });
  },
  restoreOrder(orderId: string) {
    return mutateOrder(orderId, (o) => {
      o.archived = false;
      o.activity.push(event("Order restored"));
    });
  },
  removeUnpaidTestOrder(orderId: string) {
    const state = data();
    const order = state.orders.find((o) => o.id === orderId);
    if (
      !order ||
      order.everPaid ||
      order.paymentStatus !== "Unpaid" ||
      !["Confirmed", "Cancelled"].includes(order.productionStatus) ||
      order.requestId
    )
      throw new Error("Only never-paid manual test orders can be removed.");
    state.removedOrders.push({ order, until: Date.now() + 10000 });
    state.orders = state.orders.filter((o) => o.id !== orderId);
    write("commerce", state);
  },
  undoRemoveOrder(orderId: string) {
    const state = data();
    const removed = state.removedOrders.find((r) => r.order.id === orderId);
    if (!removed) throw new Error("The Undo period has ended.");
    state.orders.unshift(removed.order);
    state.removedOrders = state.removedOrders.filter((r) => r !== removed);
    write("commerce", state);
  },
};
