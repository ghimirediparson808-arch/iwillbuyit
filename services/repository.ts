import seed from "@/data/designs.json";
import adminSeed from "@/data/admin-seed.json";
import type { Design, RequestRecord } from "@/types";
const prefix = "iwbi-v1-";
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(prefix + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown, notify = true) {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
    if (notify) window.dispatchEvent(new Event("iwbi-data"));
  } catch {
    throw new Error(
      "Your browser storage is full or unavailable. Free some space and try again.",
    );
  }
}
export const asset = (path: string) =>
  path.startsWith("../") ? "/assets/" + path.slice(3) : path;
export const launchDesigns: Design[] = seed.map((d) => ({
  ...d,
  lightShirtAsset: asset(d.lightShirtAsset),
  darkShirtAsset: asset(d.darkShirtAsset),
  thumbnail: asset(d.thumbnail),
  available: true,
  published: true,
}));
export const repository = {
  designs(includeDrafts = false): Design[] {
    const all = [...launchDesigns, ...read<Design[]>("designs", [])];
    const overrides = read<Record<string, Partial<Design>>>(
      "design-updates",
      {},
    );
    return all
      .map((d) => ({ ...d, ...overrides[d.id] }))
      .filter((d) => includeDrafts || d.published !== false);
  },
  saveDesign(design: Design) {
    const entries = read<Design[]>("designs", []);
    write("designs", [...entries.filter((d) => d.id !== design.id), design]);
  },
  updateDesign(id: string, patch: Partial<Design>) {
    const values = read<Record<string, Partial<Design>>>("design-updates", {});
    write("design-updates", { ...values, [id]: { ...values[id], ...patch } });
  },
  requests(): RequestRecord[] {
    return read<RequestRecord[]>("requests", seedRequests());
  },
  saveRequest(value: RequestRecord) {
    write("requests", [
      value,
      ...repository.requests().filter((r) => r.id !== value.id),
    ]);
  },
  updateRequest(id: string, patch: Partial<RequestRecord>, activity?: string) {
    const values = repository.requests();
    const entry = values.find((r) => r.id === id);
    if (!entry) return;
    write(
      "requests",
      values.map((r) =>
        r.id === id
          ? {
              ...r,
              ...patch,
              activity: activity
                ? [
                    ...r.activity,
                    { text: activity, at: new Date().toISOString() },
                  ]
                : r.activity,
            }
          : r,
      ),
    );
  },
  selections(id: string) {
    return read<
      Partial<{
        colour: "navy" | "black" | "cream";
        side: "front" | "back";
        view: "product" | "model";
        size: string;
        quantity: number;
      }>
    >("selection-" + id, {});
  },
  saveSelection(id: string, value: unknown) {
    write("selection-" + id, value, false);
  },
  settings() {
    return read("settings", {
      instagram: "",
      whatsapp: "",
      brand: "I WILL BUY IT",
    });
  },
  saveSettings(value: { instagram: string; whatsapp: string; brand: string }) {
    write("settings", value);
  },
  stock() {
    return read("stock", [
      { colour: "navy", size: "L", count: 5 },
      { colour: "black", size: "XL", count: 3 },
      { colour: "cream", size: "M", count: 4 },
    ]);
  },
  saveStock(value: { colour: string; size: string; count: number }[]) {
    write("stock", value);
  },
};
function seedRequests(): RequestRecord[] {
  const names = [
    "Suman Karki",
    "Aayush Shrestha",
    "Nisha Rai",
    "Roshan Thapa",
    "Priya Gurung",
    "Karan Basnet",
    "Anjali Lama",
    "Manish Adhikari",
  ];
  const custom: RequestRecord[] = names.map((name, i) => ({
    id: `IWBI-R${108 - i}`,
    name,
    phone: "",
    description:
      i === 0
        ? "Minimal line artwork inspired by reaching higher. Front print on a navy T-shirt."
        : launchDesigns[i % 7].description,
    designId: launchDesigns[i % 7].id,
    colour: "navy",
    side: "front",
    size: "L",
    quantity: 2,
    createdAt: `2026-09-${String(8 - Math.floor(i / 2)).padStart(2, "0")}T09:42:00`,
    neededBy: "2026-09-18",
    status: ["New Request", "Needs Info", "Proposal Ready", "Approved"][i % 4],
    available: i % 4 === 3,
    notes: "",
    activity: [
      { text: "Request submitted", at: "2026-09-08T09:42:00" },
      { text: "Awaiting review", at: "2026-09-08T10:05:00" },
    ],
  }));
  return [
    ...custom,
    ...adminSeed.recentOrders.map((o) => ({
      id: o.id,
      name: o.name,
      phone: "",
      description: o.design,
      colour: "navy" as const,
      side: "front" as const,
      size: "L",
      quantity: 1,
      createdAt: "2026-09-08T10:24:00",
      status: "Approved",
      orderStatus: o.status,
      available: true,
      notes: "",
      quote: o.total,
      activity: [{ text: "Order created", at: "2026-09-08T10:24:00" }],
    })),
  ];
}
export function newRequest(
  values: Omit<
    RequestRecord,
    "id" | "createdAt" | "status" | "available" | "notes" | "activity"
  >,
): RequestRecord {
  const at = new Date().toISOString();
  return {
    ...values,
    id: `IWBI-R${Date.now().toString().slice(-8)}`,
    createdAt: at,
    status: "New Request",
    available: false,
    notes: "",
    activity: [{ text: "Request submitted", at }],
  };
}
export function whatsappUrl(message: string, phone?: string) {
  const number = (phone ?? repository.settings().whatsapp).replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
