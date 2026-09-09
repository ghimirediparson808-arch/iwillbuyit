import { test, expect } from "@playwright/test";
import {
  startDesign,
  addVariant,
  publish,
  ink,
  darkFile,
  lightFile,
  fileCount,
  login,
} from "./variant-helpers";

test("A: Cream only retains one card and visibly disables Navy/Black", async ({
  page,
}) => {
  await startDesign(page, "Scenario A Cream");
  await addVariant(page, "Cream", darkFile);
  await page.getByLabel("Default display colour: Cream").check();
  const d = await publish(page);
  await page.goto("/designs");
  await expect(page.locator(".design-card")).toHaveCount(8);
  const card = page
    .locator(".design-card")
    .filter({ hasText: "Scenario A Cream" });
  await expect(card.locator(".card-art")).toHaveCSS(
    "background-color",
    "rgb(250, 247, 240)",
  );
  await card.getByLabel("Inspect Scenario A Cream", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cream", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const c of ["Navy", "Black"]) {
    const b = page.getByRole("button", {
      name: `${c} — unavailable for this design`,
      exact: true,
    });
    await expect(b).toBeVisible();
    await expect(b).toBeDisabled();
    expect(
      await b
        .locator(".swatch")
        .evaluate((el) => getComputedStyle(el, "::after").transform),
    ).not.toBe("none");
  }
  await expect.poll(async () => (await ink(page)).mean).toBeLessThan(30);
  await page.screenshot({ path: "qa/scenario-a-cream.png" });
  expect(d.colours).toEqual(["cream"]);
});

test("B: one record switches paired front/back files, backgrounds, product/model and request identity", async ({
  page,
}) => {
  await startDesign(page, "Scenario B Coffee");
  await addVariant(page, "Black", lightFile);
  await addVariant(page, "Cream", darkFile);
  await page.getByLabel("Back", { exact: true }).check();
  await page
    .getByLabel("Black back artwork", { exact: true })
    .setInputFiles(darkFile);
  await page
    .getByLabel("Cream back artwork", { exact: true })
    .setInputFiles(lightFile);
  await page.getByLabel("Default display colour: Black").check();
  const d = await publish(page);
  await page.goto("/designs/" + d.slug);
  for (const view of ["T-shirt", "Try on Model"])
    for (const side of ["Front", "Back"])
      for (const c of ["Black", "Cream"]) {
        await page.getByRole("button", { name: c, exact: true }).click();
        await page
          .getByRole("group", { name: "Print side", exact: true })
          .getByRole("button", { name: side, exact: true })
          .click();
        await page.getByRole("button", { name: view, exact: true }).click();
        const light = (c === "Black") === (side === "Front");
        if (light)
          await expect
            .poll(async () => (await ink(page)).mean)
            .toBeGreaterThan(220);
        else
          await expect
            .poll(async () => (await ink(page)).mean)
            .toBeLessThan(30);
        await expect(page.locator(".original-image")).toHaveCSS(
          "background-color",
          c === "Black" ? "rgb(17, 17, 17)" : "rgb(250, 247, 240)",
        );
        const original = await ink(page, ".original-image img");
        const print = await ink(page);
        expect(original.src).toBe(print.src);
        expect(print.transparent).toBe(true);
        expect(print.filter).toBe("none");
        await expect(
          page.getByRole("button", {
            name: "Navy — unavailable for this design",
          }),
        ).toBeDisabled();
        await page.screenshot({
          path: `qa/scenario-b-${view === "T-shirt" ? "product" : "model"}-${side.toLowerCase()}-${c.toLowerCase()}.png`,
        });
        await page.reload();
        await expect(page.locator(".blank-shirt").first()).toHaveAttribute(
          "src",
          new RegExp(`${side.toLowerCase()}/${c.toLowerCase()}.webp`),
        );
      }
  const url = await page
    .getByRole("link", { name: "Ask on WhatsApp" })
    .getAttribute("href");
  expect(decodeURIComponent(url!)).toContain(`${d.id}/cream/back`);
  await page.getByRole("button", { name: "Request This Design" }).click();
  await page.getByLabel("Your name").fill("Variant Customer");
  await page.getByLabel("WhatsApp number").fill("9800000000");
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  const request = await page.evaluate(
    () => JSON.parse(localStorage.getItem("iwbi-v1-requests")!)[0],
  );
  expect(request.variantId).toBe(`${d.id}/cream/back`);
  expect(request.variantArtwork).toBe(d.variants.cream.back);
  expect(request.previewBackground).toBe("cream");
});

test("C/D: explicit reuse stores one file, overrides stay independent, low contrast publishes", async ({
  page,
}) => {
  await startDesign(page, "Scenario C Reuse");
  await addVariant(page, "Navy", darkFile); // Intentional low contrast is allowed.
  await page.getByLabel("Enable Black").check();
  await page.getByLabel("Default display colour: Navy").check();
  await page
    .getByRole("button", { name: "Publish Design", exact: true })
    .click();
  await expect(page.locator(".variant-summary .error")).toContainText(
    "Black: upload front artwork",
  );
  await page.getByLabel("Black front artwork source").selectOption("navy");
  await page.getByLabel("Navy preview background").selectOption("cream");
  expect(await fileCount(page)).toBe(1);
  const d = await publish(page);
  expect(d.colours).toEqual(["navy", "black"]);
  expect(d.variants.black.reuseFront).toBe("navy");
  expect(await fileCount(page)).toBe(1);
  await page.goto("/designs/" + d.slug);
  await expect(
    page.getByRole("button", { name: "Navy", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await ink(page)).mean).toBeLessThan(30);
  await expect(page.locator(".original-image")).toHaveCSS(
    "background-color",
    "rgb(250, 247, 240)",
  );
  await page.getByRole("button", { name: "Black", exact: true }).click();
  await expect.poll(async () => (await ink(page)).mean).toBeLessThan(30);
  await page.screenshot({ path: "qa/scenario-c-low-contrast.png" });
  await page.goto(`/admin/designs/new?edit=${d.id}`);
  await page.getByLabel("Black front artwork source").selectOption("own");
  await page
    .getByLabel("Black front artwork", { exact: true })
    .setInputFiles(lightFile);
  const changed = await publish(page);
  expect(changed.variants.navy.front).toBe(d.variants.navy.front);
  expect(changed.variants.black.front).not.toBe(d.variants.navy.front);
  expect(await fileCount(page)).toBe(2);
  await page.goto("/designs");
  await expect(page.locator(".design-card")).toHaveCount(8);
});

test("E: draft editing restores files, backgrounds and default; disabled default blocks only publishing", async ({
  page,
}) => {
  await startDesign(page, "Scenario E Draft");
  await addVariant(page, "Navy", lightFile);
  await addVariant(page, "Cream", darkFile);
  await page.getByLabel("Navy preview background").selectOption("black");
  await page.getByLabel("Default display colour: Navy").check();
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.locator(".success")).toContainText("Draft saved");
  await page.reload();
  await expect(page.getByLabel("Navy preview background")).toHaveValue("black");
  await expect(page.getByLabel("Default display colour: Navy")).toBeChecked();
  await expect(
    page
      .getByRole("region", { name: "Navy variant" })
      .locator(".variant-original img"),
  ).toBeVisible();
  expect(await fileCount(page)).toBe(2);
  await page.goto("/admin/designs");
  await page
    .locator(".admin-library > section")
    .filter({ hasText: "Scenario E Draft" })
    .getByRole("link", { name: "Edit design" })
    .click();
  await expect(page.getByLabel("Navy preview background")).toHaveValue("black");
  await page.getByLabel("Enable Navy").uncheck();
  await page
    .getByRole("button", { name: "Publish Design", exact: true })
    .click();
  await expect(page.locator(".error")).toContainText(
    "Select an enabled default",
  );
  await page.getByLabel("Default display colour: Cream").check();
  const d = await publish(page);
  expect(await fileCount(page)).toBe(2);
  await page.goto("/designs/" + d.slug);
  await expect(
    page.getByRole("button", { name: "Cream", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "qa/scenario-e-mobile.png", fullPage: true });
});

test("How It Works navigates and focuses its homepage section from every public route, desktop and mobile", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/designs", "/designs/the-climb", "/customize"]) {
      await page.goto(route);
      if (width === 390)
        await page
          .getByRole("button", { name: "Open menu", exact: true })
          .click();
      const link = page.getByRole("link", {
        name: "How It Works",
        exact: true,
      });
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/#how-it-works$/);
      const heading = page.getByRole("heading", {
        name: "How It Works",
        exact: true,
      });
      await expect(heading).toBeFocused();
      await expect
        .poll(async () => {
          const b = await heading.boundingBox();
          return !!b && b.y >= 0 && b.y < 900;
        })
        .toBe(true);
    }
  }
});

test("legacy migration preserves seven identities and stored drafts without duplicate records", async ({
  page,
}) => {
  await login(page);
  await page.evaluate(() => {
    localStorage.setItem(
      "iwbi-v1-designs",
      JSON.stringify([
        {
          id: "LEGACY-1",
          slug: "legacy-draft",
          name: "Legacy draft",
          description: "Legacy",
          category: "Minimal",
          tags: [],
          lightShirtAsset:
            "/assets/designs/the-climb/master/print-light-shirt.png",
          darkShirtAsset:
            "/assets/designs/the-climb/master/print-dark-shirt.png",
          thumbnail: "",
          colours: ["black", "cream"],
          sides: ["front"],
          sizes: ["M"],
          published: false,
        },
      ]),
    );
  });
  await page.goto("/admin/designs");
  await expect(page.locator(".admin-library > section")).toHaveCount(8);
  await page
    .locator(".admin-library > section")
    .filter({ hasText: "Legacy draft" })
    .getByRole("link", { name: "Edit design" })
    .click();
  await expect(page.getByLabel("Design code")).toHaveValue("LEGACY-1");
  await expect(page.getByLabel("Enable Navy")).not.toBeChecked();
  await expect(page.getByLabel("Enable Black")).toBeChecked();
  await expect(page.getByLabel("Default display colour: Black")).toBeChecked();
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.locator(".success")).toContainText("Draft saved");
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("iwbi-v1-designs")!),
  );
  expect(records).toHaveLength(1);
  expect(records[0].schemaVersion).toBe(2);
  await page.goto("/designs");
  await expect(page.locator(".design-card")).toHaveCount(7);
});
