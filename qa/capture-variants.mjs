import { chromium } from "@playwright/test";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1672, height: 941 } });
await page.addInitScript(() =>
  localStorage.setItem("iwbi-demo-session", "demo"),
);
await page.goto("http://localhost:3000/admin/designs/new");
await page.getByLabel("Design name", { exact: true }).fill("Coffee Formula");
await page
  .getByLabel("Full description")
  .fill(
    "One design, with artwork and preview backgrounds selected for each shirt colour.",
  );
for (const colour of ["Navy", "Black", "Cream"])
  await page.getByLabel(`Enable ${colour}`, { exact: true }).check();
await page
  .getByLabel("Navy front artwork", { exact: true })
  .setInputFiles(
    "public/assets/designs/coffee-energy/master/print-dark-shirt.png",
  );
await page
  .getByLabel("Cream front artwork", { exact: true })
  .setInputFiles(
    "public/assets/designs/coffee-energy/master/print-light-shirt.png",
  );
await page.getByLabel("Black front artwork source").selectOption("navy");
await page.getByLabel("Default display colour: Black").check();
await page.getByRole("button", { name: "Save Draft", exact: true }).click();
await page.locator(".success").waitFor();
for (const [name, width, height] of [
  ["desktop", 1672, 941],
  ["tablet", 1086, 1448],
  ["mobile", 390, 844],
]) {
  await page.setViewportSize({ width, height });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `qa/variant-editor-${name}.png`,
    fullPage: true,
  });
  console.log(
    name,
    await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      broken: [...document.images].filter((i) => !i.complete || !i.naturalWidth)
        .length,
    })),
  );
}
await page.goto("http://localhost:3000/#how-it-works");
await page.waitForTimeout(800);
await page.screenshot({ path: "qa/how-it-works-mobile.png" });
await browser.close();
