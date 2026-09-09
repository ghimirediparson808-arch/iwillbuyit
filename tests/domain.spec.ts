import { test, expect } from "@playwright/test";
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import type { OrderInput } from "@/types";
// Load the actual repository modules against an isolated in-memory browser adapter.
// This exercises business guards without adding a test endpoint to the application.
function domain() {
  const storage = new Map<string, string>();
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  const context = vm.createContext({
    Date,
    console,
    crypto: webcrypto,
    Event,
    window: { dispatchEvent() {} },
    localStorage: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => storage.set(k, v),
    },
  });
  function load(file: string): Record<string, unknown> {
    if (file.endsWith(".json"))
      return JSON.parse(fs.readFileSync(file, "utf8"));
    file += file.endsWith(".ts") ? "" : ".ts";
    const existing = cache.get(file);
    if (existing) return existing.exports;
    const loadedModule = { exports: {} };
    cache.set(file, loadedModule);
    const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const run = vm.runInContext(
      `(function(require,module,exports){${js}\n})`,
      context,
    );
    run(
      (name: string) =>
        load(
          name.startsWith("@/")
            ? path.resolve(name.slice(2))
            : path.resolve(path.dirname(file), name),
        ),
      loadedModule,
      loadedModule.exports,
    );
    return loadedModule.exports;
  }
  const repo = load(
    path.resolve("services/repository"),
  ) as unknown as typeof import("@/services/repository");
  return { ...repo, storage };
}
const input: OrderInput = {
  name: "Real customer",
  phone: "9779800000000",
  designId: "IWBI-006",
  colour: "cream",
  side: "front",
  size: "L",
  quantity: 2,
  total: 2400,
};
test("domain: conversion is idempotent, submission is preserved and linked records cannot be deleted", () => {
  const { repository: r, newRequest } = domain();
  const request = r.createRequest(
    newRequest({ ...input, description: "Original message", colour: "navy" }),
  );
  const order = r.convertRequestToOrder(request.id, input);
  expect(
    r.convertRequestToOrder(request.id, { ...input, total: 9999 }).id,
  ).toBe(order.id);
  expect(r.orders()).toHaveLength(1);
  expect(r.requests()[0].colour).toBe("navy");
  expect(r.requests()[0].status).toBe("Converted to Order");
  expect(() => r.deleteRequest(request.id)).toThrow(/cannot be deleted/);
  expect(() => r.removeUnpaidTestOrder(order.id)).toThrow(/never-paid manual/);
  expect(() => r.updateRequestStatus(request.id, "New")).toThrow(
    /linked order/,
  );
});
test("domain: payment and production guards, cancellation and paid historical snapshots", () => {
  const { repository: r } = domain();
  const order = r.createManualOrder(input);
  expect(() => r.updateProductionStatus(order.id, "Printing")).toThrow();
  expect(() =>
    r.createManualOrder({ ...input, colour: "" as OrderInput["colour"] }),
  ).toThrow();
  expect(() => r.createManualOrder({ ...input, total: 0 })).toThrow();
  expect(() => r.createManualOrder({ ...input, quantity: 1.5 })).toThrow();
  r.updatePaymentStatus(order.id, "Paid");
  r.updateProductionStatus(order.id, "Printing");
  r.removeDesign(input.designId);
  expect(r.designs()).toHaveLength(6);
  expect(r.orders()[0].snapshot).toMatchObject({
    name: "The Climb",
    code: "IWBI-006",
    colour: "cream",
    size: "L",
    total: 2400,
  });
  expect(r.orders()[0].snapshot.artwork).toContain("print-light-shirt");
  r.cancelOrder(order.id);
  expect(r.orders()[0].paymentStatus).toBe("Paid");
  expect(() => r.removeUnpaidTestOrder(order.id)).toThrow();
  r.updatePaymentStatus(order.id, "Refunded");
  expect(r.orders()[0].paymentStatus).toBe("Refunded");
  expect(() => r.removeUnpaidTestOrder(order.id)).toThrow();
  r.undoRemoveDesign(input.designId);
  expect(r.designs()).toHaveLength(7);
});
test("domain: empty storage has no demo data; migration preserves legacy records exactly once", () => {
  const { repository: r, storage } = domain();
  expect(r.requests()).toEqual([]);
  expect(r.orders()).toEqual([]);
  expect(r.stock()).toEqual([]);
  storage.delete("iwbi-v1-commerce");
  storage.set(
    "iwbi-v1-requests",
    JSON.stringify([
      {
        ...input,
        id: "LEGACY",
        description: "Customer order",
        createdAt: new Date().toISOString(),
        status: "Approved",
        orderStatus: "Printing",
        quote: 2400,
        activity: [],
        notes: "keep this",
      },
    ]),
  );
  const first = r.orders()[0];
  expect(first.paymentStatus).toBe("Paid");
  expect(first.productionStatus).toBe("Printing");
  expect(first.notes).toBe("keep this");
  expect(r.orders()[0].id).toBe(first.id);
  expect(r.requests()[0].orderId).toBe(first.id);
  expect(r.requests()[0].designSnapshot?.name).toBe("The Climb");
});
test("domain: accidental request deletion and unpaid manual Undo do not affect other records", () => {
  const { repository: r, newRequest } = domain();
  const request = r.createRequest(
    newRequest({ ...input, description: "Accidental request" }),
  );
  r.closeRequest(request.id);
  expect(r.requests()[0].status).toBe("Closed");
  r.reopenRequest(request.id);
  r.deleteRequest(request.id);
  expect(r.requests()).toHaveLength(0);
  const a = r.createManualOrder(input);
  const b = r.createManualOrder({ ...input, name: "Other customer" });
  r.removeUnpaidTestOrder(a.id);
  expect(r.orders().map((o) => o.id)).toEqual([b.id]);
  r.undoRemoveOrder(a.id);
  expect(r.orders()).toHaveLength(2);
});
