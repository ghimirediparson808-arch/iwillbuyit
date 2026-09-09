import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
for (const [name, width, height] of [
  ["desktop", 1672, 941],
  ["tablet", 1672, 941],
  ["mobile", 853, 1844],
]) {
  await page.setViewportSize({ width, height });
  await page.goto("http://localhost:3000");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `qa/landing-${name}.png` });
  console.log(
    name,
    await page.locator("h1").boundingBox(),
    await page.locator(".hero-art img").boundingBox(),
  );
}
await browser.close();
