import { test, expect } from "@playwright/test";
import { login } from "./variant-helpers";
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
