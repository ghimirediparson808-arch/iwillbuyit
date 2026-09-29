import seed from "@/data/designs.json";
import type { Design, RequestRecord } from "@/types";
import { migrateDesign, publicationErrors } from "./artwork";
import { read, write } from "./storage";
import { commerceActions } from "./commerce";

export const asset = (path: string) =>
  path.startsWith("../") ? "/assets/" + path.slice(3) : path;

const rawLaunchDesigns: Design[] = seed.map((d) => ({
  ...d,
  lightShirtAsset: asset(d.lightShirtAsset),
  darkShirtAsset: asset(d.darkShirtAsset),
  thumbnail: asset(d.thumbnail),
  available: true,
  published: true,
}));

export const launchDesigns = rawLaunchDesigns.map(migrateDesign);

export const repository = {
  ...commerceActions,
  designs(includeDrafts = false): Design[] {
    if (typeof window !== "undefined") repository.finalizeDesignRemovals();
    const all = [...rawLaunchDesigns, ...read<Design[]>("designs", [])];
    const overrides = read<Record<string, Partial<Design>>>(
      "design-updates",
      {},
    );
    return all
      .map((d) => migrateDesign({ ...d, ...overrides[d.id] }))
      .filter((d) => !read<Record<string, number>>("removed-designs", {})[d.id])
      .filter((d) => includeDrafts || d.published !== false);
  },
  saveDesign(design: Design) {
    const entries = read<Design[]>("designs", []);
    if (design.published) {
      const errors = publicationErrors(migrateDesign(design));
      if (errors.length) throw new Error(errors.join(" "));
    }
    if (launchDesigns.some((d) => d.id === design.id)) {
      repository.updateDesign(design.id, design);
      return;
    }
    const index = entries.findIndex((d) => d.id === design.id);
    if (index < 0) entries.push(design);
    else entries[index] = design;
    write("designs", entries);
    const overrides = read<Record<string, Partial<Design>>>(
      "design-updates",
      {},
    );
    if (overrides[design.id]) {
      delete overrides[design.id];
      write("design-updates", overrides);
    }
  },
  updateDesign(id: string, patch: Partial<Design>) {
    if (patch.published) {
      const design = repository.designs(true).find((d) => d.id === id);
      if (!design) throw new Error("Design not found.");
      const errors = publicationErrors(migrateDesign({ ...design, ...patch }));
      if (errors.length) throw new Error(errors.join(" "));
    }
    const values = read<Record<string, Partial<Design>>>("design-updates", {});
    write("design-updates", { ...values, [id]: { ...values[id], ...patch } });
  },

  markDesignUnavailable(id: string) {
    repository.updateDesign(id, { available: false });
  },
  makeDesignAvailable(id: string) {
    repository.updateDesign(id, { available: true });
  },
  removeDesign(id: string) {
    if (!repository.designs(true).some((d) => d.id === id))
      throw new Error("Design not found.");
    repository.orders(); // Materialize historical snapshots before removing their source.
    write("removed-designs", {
      ...read<Record<string, number>>("removed-designs", {}),
      [id]: Date.now() + 10000,
    });
  },
  undoRemoveDesign(id: string) {
    const removed = read<Record<string, number>>("removed-designs", {});
    if (!removed[id] || removed[id] < Date.now())
      throw new Error("The Undo period has ended.");
    delete removed[id];
    write("removed-designs", removed);
  },
  finalizeDesignRemovals() {
    const removed = read<Record<string, number>>("removed-designs", {});
    const expired = Object.keys(removed).filter(
      (id) => removed[id] > 1 && removed[id] < Date.now(),
    );
    if (!expired.length) return;
    const updates = read<Record<string, Partial<Design>>>("design-updates", {});
    expired.forEach((id) => delete updates[id]);
    write("design-updates", updates, false);
    write(
      "designs",
      read<Design[]>("designs", []).filter((d) => !expired.includes(d.id)),
      false,
    );
    expired.forEach((id) => {
      removed[id] = 1;
    });
    write("removed-designs", removed, false);
    // Keep only ID tombstones for bundled designs; original source files are immutable.
  },
  selections(id: string) {
    return read<
      Partial<{
        colour: "navy" | "black" | "cream";
        side: "front" | "back";
        view: "product" | "model";
        size: string;
        quantity: number;
        lastRequestId: string;
      }>
    >("selection-" + id, {});
  },
  saveSelection(id: string, value: unknown) {
    write("selection-" + id, value, false);
  },
  settings() {
    return read("settings", {
      instagram: "",
      whatsapp: "9813115554",
      brand: "I WILL BUY IT",
    });
  },
  saveSettings(value: { instagram: string; whatsapp: string; brand: string }) {
    write("settings", value);
  },
  stock() {
    return read<{ colour: string; size: string; count: number }[]>("stock", []);
  },
  saveStock(value: { colour: string; size: string; count: number }[]) {
    write("stock", value);
  },
};

export function newRequest(
  values: Omit<
    RequestRecord,
    "id" | "createdAt" | "status" | "available" | "notes" | "activity"
  >,
): RequestRecord {
  const at = new Date().toISOString();
  return {
    ...values,
    id: `IWBI-R${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: at,
    status: "New",
    available: false,
    notes: "",
    activity: [{ text: "Request submitted", at }],
  };
}

export function whatsappUrl(message: string, phone?: string) {
  const defaultNumber = "9779813115554";
  let number = defaultNumber;
  if (phone && phone.replace(/\D/g, "").length >= 7) {
    number = phone.replace(/\D/g, "");
  }
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
