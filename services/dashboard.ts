import type { RequestRecord } from "@/types";
const paidStages = ["Paid", "Printing", "Quality Check", "Ready", "Delivered"];
export function dashboardData(requests: RequestRecord[]) {
  const orders = requests.filter((r) => r.orderStatus);
  const categories = [
    { name: "New", colour: "#062E59" },
    { name: "Confirmed", colour: "#377fcc" },
    { name: "Printing", colour: "#84b7f0" },
    { name: "Ready", colour: "#f2eadb" },
    { name: "Delivered", colour: "#7666dd" },
  ];
  const group = (s: string) =>
    s === "Paid" ? "Confirmed" : s === "Quality Check" ? "Printing" : s;
  return {
    orders,
    newRequests: requests.filter(
      (r) => !r.orderStatus && r.status === "New Request",
    ).length,
    confirmed: orders.filter((r) => r.orderStatus !== "New").length,
    production: orders.filter(
      (r) => r.orderStatus === "Printing" || r.orderStatus === "Quality Check",
    ).length,
    sales: orders
      .filter((r) => paidStages.includes(r.orderStatus!))
      .reduce((sum, r) => sum + (r.quote || 0), 0),
    statuses: categories.map((s) => ({
      ...s,
      count: orders.filter((r) => group(r.orderStatus!) === s.name).length,
    })),
  };
}
export function salesSeries(
  requests: RequestRecord[],
  days: number,
  now = new Date(),
) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(end);
    day.setDate(day.getDate() - (days - 1 - i));
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const value = requests
      .filter(
        (r) =>
          r.orderStatus &&
          paidStages.includes(r.orderStatus) &&
          new Date(r.createdAt) >= day &&
          new Date(r.createdAt) < next,
      )
      .reduce((sum, r) => sum + (r.quote || 0), 0);
    return {
      label: day.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      value,
    };
  });
}
