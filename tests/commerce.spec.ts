import { test, expect, Page } from "@playwright/test";
import { login, lightFile, ink } from "./variant-helpers";
async function manual(page: Page, name = "Manual Customer", total = "1500") {
  await page.goto("/admin/requests?tab=orders");
  await page
    .getByRole("button", { name: "New Manual Order", exact: true })
    .click();
  await expect(page.getByLabel("Garment colour")).toHaveValue("");
  await expect(page.getByLabel("Print side", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Size", { exact: true })).toHaveValue("");
  await page.getByLabel("Customer name").fill(name);
  await page.getByLabel("WhatsApp number").fill("9779800000000");
  await page
    .getByLabel("Design", { exact: true })
    .selectOption({ label: "The Climb · IWBI-006" });
  await page.getByLabel("Garment colour").selectOption("cream");
  await page.getByLabel("Print side", { exact: true }).selectOption("front");
  await page.getByLabel("Size", { exact: true }).selectOption("L");
  await page.getByLabel("Quantity", { exact: true }).fill("2");
  await page.getByLabel("Total price (Rs.)").fill(total);
  await page
    .getByRole("button", { name: "Confirm Order", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/tab=orders&order=IWBI-O/);
  return page.url();
}
async function sales(page: Page, value: string) {
  await page.goto("/admin");
  await expect(page.locator(".metric-3 strong")).toHaveText(value);
}

test("manual order keeps independent paid sales through printing, delivery, archive and restore", async ({
  page,
}) => {
  await login(page);
  const url = await manual(page);
  await sales(page, "Rs. 0");
  await page.goto(url);
  await page.getByRole("button", { name: "Mark as Paid", exact: true }).click();
  await sales(page, "Rs. 1,500");
  await page.goto(url);
  for (const action of ["Start Printing", "Mark Ready", "Mark Delivered"]) {
    await page.getByRole("button", { name: action, exact: true }).click();
    await sales(page, "Rs. 1,500");
    await page.goto(url);
  }
  await expect(
    page.getByRole("button", { name: "Remove unpaid test order" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Archive Order", exact: true })
    .click();
  await page.getByLabel("Archived orders", { exact: true }).check();
  await page.locator(".commerce-inbox-item").click();
  await expect(page.locator(".order-badges")).toContainText("Archived");
  await page
    .getByRole("button", { name: "Restore Order", exact: true })
    .click();
  await page.getByLabel("Archived orders", { exact: true }).uncheck();
  await expect(page.locator(".commerce-inbox-item")).toHaveCount(1);
  await sales(page, "Rs. 1,500");
  await expect(page.locator(".metric-1 strong")).toHaveText("0");
});

test("paid cancellation retains sales until explicitly refunded; never-paid manual removal supports Undo", async ({
  page,
}) => {
  await login(page);
  const url = await manual(page);
  await page.getByRole("button", { name: "Mark as Paid", exact: true }).click();
  await page.getByRole("button", { name: "Cancel Order", exact: true }).click();
  await expect(page.locator(".order-badges")).toContainText("Paid");
  await sales(page, "Rs. 1,500");
  await page.goto(url);
  await page
    .getByRole("button", { name: "Mark Refunded", exact: true })
    .click();
  await sales(page, "Rs. 0");
  await manual(page, "Accidental test");
  await page
    .getByRole("button", { name: "Remove unpaid test order", exact: true })
    .click();
  await expect(page.locator(".commerce-inbox-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.locator(".commerce-inbox-item")).toHaveCount(2);
});

test("request WhatsApp contact, close, reopen, conversion and immutable customer submission", async ({
  page,
  context,
}) => {
  await page.goto("/designs/the-climb");
  await page
    .getByRole("button", { name: "Request This Design", exact: true })
    .click();
  await page.getByLabel("Your name").fill("Gallery Customer");
  await page.getByLabel("WhatsApp number").fill("9779800000000");
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(page.locator(".success")).toContainText("is saved");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(
    page.getByRole("link", { name: "Order on WhatsApp" }),
  ).toHaveAttribute("href", /Request%20ID/);
  await login(page);
  await page.goto("/admin/requests");
  const original = await page.locator(".original-message p").textContent();
  const wa = page.getByRole("link", { name: "Open WhatsApp", exact: true });
  await expect(wa).toHaveAttribute("href", /^https:\/\/wa.me\/9779800000000/);
  await context.route("https://wa.me/**", (route) => route.abort());
  const popup = page.waitForEvent("popup");
  await wa.click();
  await (await popup).close();
  await expect(page.locator(".commerce-detail-heading")).toContainText(
    "Contacted",
  );
  await page
    .getByRole("button", { name: "Close Request", exact: true })
    .click();
  await expect(page.locator(".commerce-detail-heading")).toContainText(
    "Closed",
  );
  await page
    .getByRole("button", { name: "Reopen Request", exact: true })
    .click();
  await page.getByRole("button", { name: "Create Order", exact: true }).click();
  await page.getByLabel("Garment colour").selectOption("cream");
  await page.getByLabel("Total price (Rs.)").fill("2400");
  await page
    .getByRole("button", { name: "Confirm Order", exact: true })
    .click();
  await page
    .locator(".commerce-detail-heading")
    .getByRole("link", { name: /Request IWBI/ })
    .click();
  await expect(page.locator(".commerce-detail-heading")).toContainText(
    "Converted to Order",
  );
  await expect(page.locator(".original-message p")).toHaveText(original!);
  await expect(
    page.getByRole("button", { name: "Create Order", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Delete accidental request" }),
  ).toHaveCount(0);
  await sales(page, "Rs. 0");
  await expect(page.locator(".metric-0 strong")).toHaveText("0");
});

test("design removal has Undo, unavailable is reversible, and order snapshot survives final removal", async ({
  page,
}) => {
  await login(page);
  const url = await manual(page);
  await page.getByRole("button", { name: "Mark as Paid", exact: true }).click();
  await page.goto("/admin/designs");
  const row = page
    .locator(".admin-library>section")
    .filter({ hasText: "The Climb" });
  await row
    .getByRole("button", { name: "Mark Unavailable", exact: true })
    .click();
  await expect(row.locator(".badge")).toHaveText("Unavailable");
  await page.goto("/designs");
  await expect(page.locator(".design-card")).toHaveCount(6);
  await page.goto("/designs/the-climb");
  await expect(
    page.getByRole("button", { name: "Request This Design" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Order on WhatsApp" }),
  ).toBeDisabled();
  await page.goto("/admin/designs");
  await row
    .getByRole("button", { name: "Make Available", exact: true })
    .click();
  await row.getByRole("button", { name: "Remove Design", exact: true }).click();
  await expect(page.locator(".admin-library>section")).toHaveCount(6);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Remove Design", exact: true }).click();
  await page.clock.install();
  await page.clock.fastForward(11000);
  await page.goto("/designs");
  await expect(page.locator(".design-card")).toHaveCount(6);
  await page.goto(url);
  await expect(page.locator(".commerce-submission")).toContainText("The Climb");
  await expect
    .poll(() =>
      page
        .locator(".commerce-art")
        .evaluate((el) => (el as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(page.locator(".commerce-submission")).toContainText(
    "cream / front",
  );
  await sales(page, "Rs. 1,500");
});

test("explicit Gallery Cover switches source only, keeps a shared canvas and unchanged print pixels", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/designs/new?edit=IWBI-006");
  await page.getByLabel("Gallery Cover source").selectOption("cream");
  await page
    .getByRole("button", { name: "Publish Design", exact: true })
    .click();
  await expect(page.locator(".success")).toContainText("Design published");
  await page.goto("/designs");
  const card = page.locator(".design-card").filter({ hasText: "The Climb" });
  await expect(card.locator("img")).toHaveAttribute("src", /print-light-shirt/);
  const canvases = await page.locator(".gallery-canvas").evaluateAll((els) =>
    els.map((el) => ({
      height: el.getBoundingClientRect().height,
      background: getComputedStyle(el).backgroundImage,
    })),
  );
  expect(new Set(canvases.map((c) => c.background)).size).toBe(1);
  expect(new Set(canvases.map((c) => c.height)).size).toBe(1);
  await page.goto("/admin/designs/new?edit=IWBI-006");
  await page.getByLabel("Gallery Cover source").selectOption("upload");
  await page
    .getByLabel("Gallery Cover artwork", { exact: true })
    .setInputFiles(lightFile);
  await page
    .getByRole("button", { name: "Publish Design", exact: true })
    .click();
  await expect(page.locator(".success")).toContainText("Design published");
  await page.reload();
  await expect(page.getByLabel("Gallery Cover source")).toHaveValue("upload");
  await page.goto("/designs");
  await expect(card.locator("img")).toHaveAttribute("src", /^blob:/);
  await expect
    .poll(
      async () =>
        (await ink(page, '.design-card:has-text("The Climb") img')).mean,
    )
    .toBeGreaterThan(220);
  await card.getByLabel("Inspect The Climb", { exact: true }).click();
  await page.getByRole("button", { name: "Cream", exact: true }).click();
  await expect.poll(async () => (await ink(page)).mean).toBeLessThan(30);
  await expect(page.locator(".print-art").first()).toHaveCSS("filter", "none");
  await page.goto("/designs");
  await expect(card.locator("img")).toHaveAttribute("src", /^blob:/);
  await page.goto("/admin/designs/new?edit=IWBI-006");
  await page.getByLabel("Gallery Cover source").selectOption("black");
  await page
    .getByRole("button", { name: "Publish Design", exact: true })
    .click();
  await expect(page.locator(".success")).toContainText("Design published");
  await page.goto("/designs");
  await expect(card.locator("img")).toHaveAttribute("src", /print-dark-shirt/);
});

test("populated requests, orders and gallery are usable at desktop, tablet and phone sizes", async ({
  page,
}) => {
  test.setTimeout(120000);
  await login(page);
  const orderUrl = await manual(page, "Responsive Customer");
  await page.goto("/customize");
  await page.getByLabel("Your name").fill("Mobile Request");
  await page.getByLabel("WhatsApp number").fill("9800000000");
  await page
    .getByLabel("Describe your design")
    .fill("Custom drawing for a navy shirt");
  await page.getByRole("button", { name: "Submit Custom Request" }).click();
  await expect(page.getByRole("status")).toContainText("We’ve received");
  // Visual fixtures belong only to this isolated automated browser context.
  await page.evaluate(() =>
    localStorage.setItem(
      "iwbi-v1-design-updates",
      JSON.stringify({
        "IWBI-006": { galleryCover: { kind: "variant", colour: "cream" } },
        "IWBI-001": { name: "Never Alone — Unseen Battles and Quiet Strength" },
      }),
    ),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [label, width, height] of [
    ["desktop", 1672, 941],
    ["tablet", 1086, 1448],
    ["mobile", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    for (const [name, route] of [
      ["gallery", "/designs"],
      ["requests", "/admin/requests"],
      ["orders", orderUrl],
    ]) {
      await page.goto(route);
      if (name !== "gallery") {
        await expect(page.locator(".admin-content")).toBeVisible();
        await expect(page.locator(".commerce-inbox-item")).toHaveCount(1);
      } else
        await expect(
          page.locator(".design-card").filter({ hasText: "Quiet Strength" }),
        ).toBeVisible();
      if (name === "requests" && width === 390) {
        await page.locator(".commerce-inbox-item").first().click();
        await expect(page).toHaveURL(/order=IWBI-R/);
      }
      if (name !== "gallery")
        await expect(page.locator(".commerce-detail-heading")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              [...document.images].filter((i) => !i.complete || !i.naturalWidth)
                .length,
          ),
        )
        .toBe(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (name === "gallery") {
        const boxes = await page.locator(".design-card").evaluateAll((cards) =>
          cards.map((card) => ({
            height: card.getBoundingClientRect().height,
            artwork: card
              .querySelector(".gallery-canvas")!
              .getBoundingClientRect().height,
            background: getComputedStyle(card.querySelector(".gallery-canvas")!)
              .backgroundImage,
          })),
        );
        expect(new Set(boxes.map((b) => b.height)).size).toBe(1);
        expect(new Set(boxes.map((b) => b.artwork)).size).toBe(1);
        expect(new Set(boxes.map((b) => b.background)).size).toBe(1);
      }
      await page.screenshot({
        path: `qa/commerce-${name}-${label}.png`,
        fullPage: true,
      });
      if (name === "orders") {
        await expect(
          page.getByRole("button", { name: "Mark as Paid", exact: true }),
        ).toBeVisible();
      }
    }
  }
  expect(errors).toEqual([]);
});
