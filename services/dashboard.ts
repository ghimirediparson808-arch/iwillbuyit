import type { RequestRecord, OrderRecord } from "@/types";
export function dashboardData(
  requests: RequestRecord[],
  orders: OrderRecord[],
) {
  const active = orders.filter((o) => !o.archived);
  const categories = [
    { name: "Confirmed", colour: "#062E59" },
    { name: "Printing", colour: "#377fcc" },
    { name: "Ready", colour: "#84b7f0" },
    { name: "Delivered", colour: "#f2eadb" },
    { name: "Cancelled", colour: "#7666dd" },
  ];
  return {
    orders: active,
    newRequests: requests.filter((r) => r.status === "New").length,
    confirmed: active.filter(
      (o) => !["Delivered", "Cancelled"].includes(o.productionStatus),
    ).length,
    production: active.filter((o) => o.productionStatus === "Printing").length,
    sales: orders
      .filter((o) => o.paymentStatus === "Paid")
      .reduce((sum, o) => sum + o.total, 0),
    statuses: categories.map((s) => ({
      ...s,
      count: active.filter((o) => o.productionStatus === s.name).length,
    })),
  };
}
export function salesSeries(
  orders: OrderRecord[],
  days: number,
  now = new Date(),
) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(end);
    day.setDate(day.getDate() - (days - 1 - i));
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    return {
      label: day.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      value: orders
        .filter(
          (o) =>
            o.paymentStatus === "Paid" &&
            new Date(o.createdAt) >= day &&
            new Date(o.createdAt) < next,
        )
        .reduce((sum, o) => sum + o.total, 0),
    };
  });
}
