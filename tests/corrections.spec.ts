import { test, expect, Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
const darkFile = path.resolve(
  "public/assets/designs/the-climb/master/print-light-shirt.png",
);
const lightFile = path.resolve(
  "public/assets/designs/the-climb/master/print-dark-shirt.png",
);
async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Admin email").fill("admin@iwillbuyit.com");
  await page.getByLabel("Password", { exact: true }).fill("PrintWithPurpose");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator(".admin-content")).toBeVisible();
}
async function inkLuminance(page: Page, selector: string) {
  return page.locator(selector).evaluate(async (node) => {
    const im = node as HTMLImageElement;
    await im.decode();
    const c = document.createElement("canvas");
    c.width = im.naturalWidth;
    c.height = im.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(im, 0, 0);
    const p = ctx.getImageData(0, 0, c.width, c.height).data;
    let clear = 0,
      count = 0,
      total = 0;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] === 0) clear++;
      if (p[i + 3] > 240) {
        total += (p[i] + p[i + 1] + p[i + 2]) / 3;
        count++;
      }
    }
    return {
      mean: total / count,
      transparent: clear > 0,
      filter: getComputedStyle(im).filter,
      blend: getComputedStyle(im).mixBlendMode,
    };
  });
}

test("paired transparent inks survive publish, every compositor variant and reload; temporary record is removed", async ({
  page,
}) => {
  test.setTimeout(180000);
  const official = fs.readFileSync("data/designs.json", "utf8");
  let id = "";
  await login(page);
  await page.goto("/admin/designs/new");
  await page
    .getByLabel("Design name", { exact: true })
    .fill("Temporary Ink Verification");
  await page
    .getByLabel("Dark artwork (Cream shirts)", { exact: true })
    .setInputFiles(darkFile);
  await expect(page.locator(".variant-warning")).toContainText(
    "One ink variant is missing",
  );
  await page.locator(".dark-art-upload summary").click();
  await page
    .getByLabel("Light artwork (Navy/Black shirts)", { exact: true })
    .setInputFiles(lightFile);
  await expect(page.locator(".mini-mockups .print-art")).toHaveCount(3);
  await page.getByLabel("Back", { exact: true }).check();
  await page
    .getByRole("button", { name: "Publish Design", exact: true })
    .click();
  await expect(page.locator(".success[role=status]")).toContainText(
    "Design published",
  );
  const record = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("iwbi-v1-designs") || "[]").find(
      (d: { name: string }) => d.name === "Temporary Ink Verification",
    ),
  );
  id = record.id;
  expect(record.artworkVariants.dark).not.toBe(record.artworkVariants.light);
  expect(record.artworkVariants.mode).toBe("paired");
  try {
    await page.goto("/designs");
    await page
      .getByRole("textbox", { name: "Search designs", exact: true })
      .fill("Temporary Ink Verification");
    const galleryInk = await inkLuminance(page, ".design-card img");
    expect(galleryInk.transparent).toBe(true);
    expect(galleryInk.mean).toBeLessThan(30);
    await page.screenshot({ path: "qa/variants-gallery.png" });
    await page
      .getByLabel("Inspect Temporary Ink Verification", { exact: true })
      .click();
    for (const view of ["product", "model"])
      for (const side of ["front", "back"])
        for (const colour of ["cream", "black", "navy"]) {
          await page
            .getByRole("button", {
              name: view === "product" ? "T-shirt" : "Try on Model",
              exact: true,
            })
            .click();
          await page
            .getByRole("group", { name: "Print side", exact: true })
            .getByRole("button", {
              name: side === "front" ? "Front" : "Back",
              exact: true,
            })
            .click();
          await page
            .getByRole("button", {
              name: colour[0].toUpperCase() + colour.slice(1),
              exact: true,
            })
            .click();
          await expect(
            page.locator(".large-mockup .blank-shirt"),
          ).toHaveAttribute(
            "src",
            new RegExp(`${view}/${side}/${colour}.webp`),
          );
          if (colour === "cream")
            await expect
              .poll(
                async () =>
                  (await inkLuminance(page, ".large-mockup .print-art")).mean,
              )
              .toBeLessThan(30);
          else
            await expect
              .poll(
                async () =>
                  (await inkLuminance(page, ".large-mockup .print-art")).mean,
              )
              .toBeGreaterThan(220);
          const ink = await inkLuminance(page, ".large-mockup .print-art");
          expect(ink.transparent).toBe(true);
          expect(ink.filter).toBe("none");
          expect(ink.blend).toBe("normal");
          if (colour === "cream") expect(ink.mean).toBeLessThan(30);
          else expect(ink.mean).toBeGreaterThan(220);
          await page.screenshot({
            path: `qa/variants-${view}-${side}-${colour}.png`,
          });
          await page.reload();
          await expect(
            page.locator(".large-mockup .blank-shirt"),
          ).toHaveAttribute(
            "src",
            new RegExp(`${view}/${side}/${colour}.webp`),
          );
          const restored = await inkLuminance(page, ".large-mockup .print-art");
          if (colour === "cream") expect(restored.mean).toBeLessThan(30);
          else expect(restored.mean).toBeGreaterThan(220);
        }
  } finally {
    await page.evaluate(
      async ({ id, uploads }) => {
        const list = JSON.parse(
          localStorage.getItem("iwbi-v1-designs") || "[]",
        );
        localStorage.setItem(
          "iwbi-v1-designs",
          JSON.stringify(list.filter((d: { id: string }) => d.id !== id)),
        );
        const changes = JSON.parse(
          localStorage.getItem("iwbi-v1-design-updates") || "{}",
        );
        delete changes[id];
        localStorage.setItem("iwbi-v1-design-updates", JSON.stringify(changes));
        localStorage.removeItem("iwbi-v1-selection-" + id);
        await new Promise<void>((resolve, reject) => {
          const op = indexedDB.open("iwbi-uploads", 1);
          op.onsuccess = () => {
            const db = op.result;
            const tx = db.transaction("files", "readwrite");
            uploads.forEach((key: string) =>
              tx.objectStore("files").delete(key.slice(7)),
            );
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => reject(tx.error);
          };
        });
      },
      {
        id,
        uploads: [record.artworkVariants.dark, record.artworkVariants.light],
      },
    );
    await page.goto("/designs");
    await expect(page.locator(".design-card")).toHaveCount(7);
    expect(fs.readFileSync("data/designs.json", "utf8")).toBe(official);
  }
});

test("one light ink uses readable previews and safe colour availability; multicolour explicitly preserves the original", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/designs/new");
  await page
    .getByLabel("Design name", { exact: true })
    .fill("Light Ink Fallback");
  await page.locator(".dark-art-upload summary").click();
  await page
    .getByLabel("Light artwork (Navy/Black shirts)", { exact: true })
    .setInputFiles(lightFile);
  await expect(page.locator(".variant-warning")).toBeVisible();
  await expect(page.locator(".create-original-image")).toHaveCSS(
    "background-color",
    "rgb(6, 46, 89)",
  );
  await page
    .getByRole("button", { name: "Publish Design", exact: true })
    .click();
  await expect(page.locator(".success[role=status]")).toContainText(
    "Design published",
  );
  const record = await page.evaluate(
    () => JSON.parse(localStorage.getItem("iwbi-v1-designs") || "[]")[0],
  );
  expect(record.colours).toEqual(["navy", "black"]);
  await page.goto("/designs/" + record.slug);
  await expect(
    page.getByRole("button", { name: "Cream", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".original-image")).toHaveCSS(
    "background-color",
    "rgb(6, 46, 89)",
  );
  await page.goto("/admin/designs/new");
  await page
    .getByLabel("Dark artwork (Cream shirts)", { exact: true })
    .setInputFiles(
      path.resolve(
        "public/assets/designs/street-duck/master/print-light-shirt.png",
      ),
    );
  await page
    .getByLabel("Use original multicolour artwork for every shirt")
    .check();
  await expect(page.locator(".mini-mockups .print-art")).toHaveCount(3);
  const urls = await page
    .locator(".mini-mockups .print-art")
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLImageElement).src));
  expect(new Set(urls).size).toBe(1); // All three garments use the exact original object URL.
  const means = await Promise.all(
    [0, 1, 2].map((i) =>
      inkLuminance(page, `.mini-mockups button:nth-child(${i + 1}) .print-art`),
    ),
  );
  expect(means[0].mean).toBe(means[1].mean);
  expect(means[1].mean).toBe(means[2].mean);
  means.forEach((m) => {
    expect(m.transparent).toBe(true);
    expect(m.blend).toBe("normal");
  });
});

test("public/admin navigation, auth redirect and browser history work in both directions", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Admin Login", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await login(page);
  await page.getByRole("link", { name: "View Website", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page.locator(".admin-content")).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: "Admin Login", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("button", { name: "Log Out", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Admin Login", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("dashboard totals and empty states are derived solely from stored records", async ({
  page,
}) => {
  await login(page);
  await page.evaluate(() => localStorage.setItem("iwbi-v1-requests", "[]"));
  await page.reload();
  for (const i of [0, 1, 2])
    await expect(page.locator(`.metric-${i} strong`)).toHaveText("0");
  await expect(page.locator(".metric-3 strong")).toHaveText("Rs. 0");
  await expect(page.locator(".donut strong")).toHaveText("0");
  await expect(page.locator(".recent-orders")).toContainText("No orders yet");
  await page.evaluate(() => {
    const base = {
      phone: "",
      description: "Stored test",
      colour: "navy",
      side: "front",
      size: "M",
      quantity: 1,
      createdAt: new Date().toISOString(),
      available: true,
      notes: "",
      activity: [],
    };
    localStorage.setItem(
      "iwbi-v1-requests",
      JSON.stringify([
        { ...base, id: "DATA-1", name: "New customer", status: "New Request" },
        {
          ...base,
          id: "DATA-2",
          name: "Printing customer",
          status: "Approved",
          orderStatus: "Printing",
          quote: 1500,
        },
        {
          ...base,
          id: "DATA-3",
          name: "Delivered customer",
          status: "Approved",
          orderStatus: "Delivered",
          quote: 2300,
        },
      ]),
    );
  });
  await page.reload();
  await expect(page.locator(".metric-0 strong")).toHaveText("1");
  await expect(page.locator(".metric-1 strong")).toHaveText("2");
  await expect(page.locator(".metric-2 strong")).toHaveText("1");
  await expect(page.locator(".metric-3 strong")).toHaveText("Rs. 3,800");
  await expect(page.locator(".donut strong")).toHaveText("2");
  await expect(
    page.getByRole("img", { name: /Sales overview/ }),
  ).toHaveAttribute("aria-label", /3,800/);
});

test("all public CTAs and admin sidebar destinations navigate", async ({
  page,
}) => {
  for (const label of ["Home", "Design Gallery", "Customize", "How It Works"]) {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page.locator("#main")).toBeVisible();
  }
  for (const label of ["Explore Designs", "Customize Yours"]) {
    await page.goto("/");
    await page
      .locator(".hero-actions")
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page.locator("#main")).toBeVisible();
  }
  await page.getByRole("link", { name: "I WILL BUY IT home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await login(page);
  for (const label of [
    "Dashboard",
    "Designs",
    "Custom Requests",
    "Orders",
    "Customers",
    "Inventory",
    "Analytics",
    "Settings",
  ]) {
    await page
      .getByRole("navigation", { name: "Admin navigation" })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page.locator(".admin-content h1")).toBeVisible();
  }
});
