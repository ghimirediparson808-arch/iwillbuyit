import { test, expect, Page } from "@playwright/test";
import path from "node:path";
const art = path.resolve(
  "public/assets/designs/coffee-energy/master/print-light-shirt.png",
);
async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Admin email").fill("admin@iwillbuyit.com");
  await page.getByLabel("Password", { exact: true }).fill("PrintWithPurpose");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator(".admin-content")).toBeVisible();
}
test("catalogue search, categories, empty state and real dynamic routes", async ({
  page,
}) => {
  await page.goto("/designs");
  await expect(page.locator(".design-card")).toHaveCount(7);
  await page
    .getByRole("textbox", { name: "Search designs", exact: true })
    .fill("coffee");
  await expect(page.locator(".design-card")).toHaveCount(1);
  await expect(page.locator(".design-card")).toContainText("Coffee Energy");
  await page
    .getByRole("textbox", { name: "Search designs", exact: true })
    .fill("");
  await page.getByRole("button", { name: "Minimal", exact: true }).click();
  await expect(page.locator(".design-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Anime", exact: true }).click();
  await expect(page.getByText("No designs found")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".design-card")).toHaveCount(7);
  await page.getByLabel("Inspect The Climb", { exact: true }).click();
  await expect(page).toHaveURL(/designs\/the-climb/);
  await expect(
    page.getByRole("heading", { name: "The Climb", exact: true }),
  ).toBeVisible();
});
test("compositor keeps matching colour, side and view and saves a design request", async ({
  page,
}) => {
  await page.goto("/designs/the-climb");
  await page.getByRole("button", { name: "Cream", exact: true }).click();
  await expect(page.locator(".large-mockup .blank-shirt")).toHaveAttribute(
    "src",
    /product\/front\/cream.webp/,
  );
  await expect(page.locator(".large-mockup .print-art")).toHaveAttribute(
    "src",
    /print-light-shirt.png/,
  );
  await page.getByRole("button", { name: "Try on Model" }).click();
  await page
    .getByRole("group", { name: "Print side", exact: true })
    .getByRole("button", { name: "Back", exact: true })
    .click();
  await page.getByRole("button", { name: "Black", exact: true }).click();
  await expect(page.locator(".large-mockup .blank-shirt")).toHaveAttribute(
    "src",
    /model\/back\/black.webp/,
  );
  await expect(page.locator(".large-mockup .print-art")).toHaveAttribute(
    "src",
    /print-dark-shirt.png/,
  );
  await page.getByRole("button", { name: "Increase quantity" }).click();
  const href = await page
    .getByRole("link", { name: "Order on WhatsApp" })
    .getAttribute("href");
  expect(decodeURIComponent(href || "")).toContain(
    "colour: black, print side: back, view: model",
  );
  await page.getByRole("button", { name: "Request This Design" }).click();
  await page.getByLabel("Your name").fill("Test Design Customer");
  await page.getByLabel("WhatsApp number").fill("9800000000");
  await page
    .getByRole("button", { name: "Submit request", exact: true })
    .click();
  await expect(page.locator(".modal .success")).toContainText("is saved");
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("iwbi-v1-commerce") || "{}").requests[0],
  );
  expect(stored).toMatchObject({
    name: "Test Design Customer",
    colour: "black",
    side: "back",
    view: "model",
    quantity: 2,
  });
});
test("uploaded custom request persists through reload, review and order conversion", async ({
  page,
}) => {
  await page.goto("/customize");
  await page.getByLabel("Your name").fill("Test Custom Customer");
  await page.getByLabel("WhatsApp number").fill("9811111111");
  await page
    .getByLabel("Describe your design")
    .fill("Please print my supplied coffee artwork.");
  await page
    .getByLabel("Upload reference image", { exact: true })
    .setInputFiles(art);
  await expect(page.getByAltText("Uploaded reference preview")).toBeVisible();
  await page.getByRole("button", { name: "Submit Custom Request" }).click();
  await expect(page.getByRole("status")).toContainText("We’ve received");
  await login(page);
  await page.goto("/admin/requests");
  await expect(page.locator(".commerce-detail")).toContainText(
    "Test Custom Customer",
  );
  await expect(page.locator(".commerce-art")).toBeVisible();
  await page.reload();
  await expect(page.locator(".commerce-art")).toHaveJSProperty(
    "naturalWidth",
    1199,
  );
  await page.getByLabel("Private admin note").fill("Artwork reviewed");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await page.getByRole("button", { name: "Create Order", exact: true }).click();
  await page.getByLabel("Total price (Rs.)").fill("2400");
  await page
    .getByRole("button", { name: "Confirm Order", exact: true })
    .click();
  await expect(page.locator(".order-badges")).toContainText("Unpaid");
  await page.getByRole("button", { name: "Mark as Paid", exact: true }).click();
  await page
    .getByRole("button", { name: "Start Printing", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".order-badges")).toContainText("Printing");
  await expect(page.getByLabel("Private admin note")).toHaveValue(
    "Artwork reviewed",
  );
  await page.goto("/admin");
  await expect(page.locator(".recent-orders")).toContainText(
    "Test Custom Customer",
  );
  await expect(page.locator(".metric-1 strong")).toHaveText("1");
  await expect(page.locator(".donut strong")).toHaveText("1");
  await expect(page.locator(".metric-3 strong")).toHaveText("Rs. 2,400");
});
test("admin guard, invalid sign in, real demo sign in and logout", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/admin\/login/);
  await page.getByLabel("Admin email").fill("admin@iwillbuyit.com");
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator(".login-form .error")).toContainText("incorrect");
  await page.getByLabel("Password", { exact: true }).fill("PrintWithPurpose");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator(".admin-content")).toBeVisible();
  await page.getByRole("button", { name: "Log Out", exact: true }).click();
  await expect(page).toHaveURL(/admin\/login/);
  await page.goto("/admin/designs/new");
  await expect(page).toHaveURL(/admin\/login/);
});
test("transparent upload, draft, publish and public catalogue persistence", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/designs/new");
  await page.getByLabel("Enable Cream", { exact: true }).check();
  await page
    .getByLabel("Default display colour: Cream", { exact: true })
    .check();
  await page
    .getByLabel("Design name", { exact: true })
    .fill("Test Launch Artwork");
  await page
    .getByLabel("Full description")
    .fill("An approved transparent coffee illustration.");
  await page
    .getByLabel("Cream front artwork", { exact: true })
    .setInputFiles(art);
  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.locator(".success[role=status]")).toContainText(
    "Draft saved",
  );
  await page.goto("/designs");
  await page
    .getByRole("textbox", { name: "Search designs", exact: true })
    .fill("Test Launch Artwork");
  await expect(page.locator(".design-card")).toHaveCount(0);
  await page.goto("/admin/designs");
  const draft = page
    .locator(".admin-library>section")
    .filter({ hasText: "Test Launch Artwork" });
  await draft.getByRole("button", { name: "Publish", exact: true }).click();
  await page.goto("/designs");
  await page
    .getByRole("textbox", { name: "Search designs", exact: true })
    .fill("Test Launch Artwork");
  await expect(page.locator(".design-card")).toHaveCount(1);
  await page.reload();
  await page
    .getByRole("textbox", { name: "Search designs", exact: true })
    .fill("Test Launch Artwork");
  await expect(page.locator(".design-card img")).toHaveJSProperty(
    "naturalWidth",
    1199,
  );
});
test("mobile navigation, theme and admin drawer work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page.getByRole("button", { name: "Dark theme", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Light theme", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Customize", exact: true })
    .click();
  await expect(page).toHaveURL(/customize/);
  await login(page);
  await page.getByRole("button", { name: "Open admin menu" }).click();
  await page
    .getByRole("navigation", { name: "Admin navigation" })
    .getByRole("link", { name: "Designs", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Design Library" }),
  ).toBeVisible();
});
test("reference widths and typical phone render without console errors, broken images or overflow", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.addInitScript(() =>
    localStorage.setItem("iwbi-demo-session", "demo"),
  );
  const routes = [
    "/",
    "/designs",
    "/designs/the-climb",
    "/customize",
    "/admin/login",
    "/admin",
    "/admin/designs/new",
    "/admin/requests",
  ];
  for (const width of [1672, 1086, 853, 390])
    for (const route of routes) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(route);
      if (route.startsWith("/admin") && route != "/admin/login")
        await expect(page.locator(".admin-content")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              [...document.images].filter(
                (i) => !i.complete || i.naturalWidth === 0,
              ).length,
          ),
        )
        .toBe(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route + " width " + width,
      ).toBe(true);
    }
  expect(errors).toEqual([]);
});

test("invalid uploads, draft preview, restricted garments and keyboard dialog", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/designs/new");
  await page.getByLabel("Enable Cream", { exact: true }).check();
  await page
    .getByLabel("Default display colour: Cream", { exact: true })
    .check();
  await page
    .getByLabel("Full description")
    .fill("A deliberately selected Cream variant.");
  await page.getByLabel("Cream front artwork", { exact: true }).setInputFiles({
    name: "invalid.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.locator(".variants-section .error")).toContainText(
    "not a valid image",
  );
  await page
    .getByLabel("Cream front artwork", { exact: true })
    .setInputFiles(art);
  await page
    .getByLabel("Design name", { exact: true })
    .fill("Cream Only Draft");

  await page.getByRole("button", { name: "Save Draft", exact: true }).click();
  await expect(page.locator(".success[role=status]")).toContainText(
    "Draft saved",
  );
  await page.goto("/admin/designs");
  const draft = page
    .locator(".admin-library>section")
    .filter({ hasText: "Cream Only Draft" });
  await draft.getByLabel("Inspect Cream Only Draft", { exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await draft.getByRole("button", { name: "Publish", exact: true }).click();
  await page.goto("/designs");
  await page
    .getByRole("textbox", { name: "Search designs", exact: true })
    .fill("Cream Only Draft");
  await page.getByLabel("Inspect Cream Only Draft", { exact: true }).click();
  await expect(page.locator(".large-mockup .blank-shirt")).toHaveAttribute(
    "src",
    /front\/cream.webp/,
  );
  await expect(
    page
      .getByRole("group", { name: "Print side", exact: true })
      .getByRole("button", { name: "Back", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Request This Design" }).click();
  await page.getByLabel("Your name").pressSequentially("Keyboard Customer");
  await expect(page.getByLabel("Your name")).toHaveValue("Keyboard Customer");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("settings, inventory and repeated workspace search persist", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/settings");
  await page.getByLabel("WhatsApp business number").fill("9779800000000");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await page.reload();
  await expect(page.getByLabel("WhatsApp business number")).toHaveValue(
    "9779800000000",
  );
  await page.goto("/designs/the-climb");
  await expect(
    page.getByRole("link", { name: "Order on WhatsApp" }),
  ).toHaveAttribute("href", /^https:\/\/wa.me\/9779800000000\?/);
  await page.goto("/admin/inventory");
  await page.getByRole("button", { name: "Add stock entry" }).click();
  await page.getByLabel("navy stock", { exact: true }).fill("15");
  await page.getByRole("button", { name: "Save stock", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("navy stock", { exact: true })).toHaveValue(
    "15",
  );
  const search = page.getByLabel("Search orders, customers or designs", {
    exact: true,
  });
  await search.fill("Coffee");
  await search.press("Enter");
  await expect(
    page.getByLabel("Search workspace", { exact: true }),
  ).toHaveValue("Coffee");
  await search.fill("Duck");
  await search.press("Enter");
  await expect(
    page.getByLabel("Search workspace", { exact: true }),
  ).toHaveValue("Duck");
  await expect(
    page.locator(".search-result").filter({ hasText: "Street Duck" }),
  ).toBeVisible();
});
