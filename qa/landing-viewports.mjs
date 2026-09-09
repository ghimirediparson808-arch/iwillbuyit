import { chromium } from "@playwright/test";
import fs from "node:fs";
const sizes = [
  [360, 800],
  [390, 844],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 800],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ deviceScaleFactor: 1 });
page.setDefaultNavigationTimeout(60000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const results = [];
for (const [width, height] of sizes) {
  await page.setViewportSize({ width, height });
  await page.goto("http://localhost:3000");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const geometry = await page.evaluate(() => {
    const box = (s) => {
      const { x, y, width, height, bottom, right } = document
        .querySelector(s)
        .getBoundingClientRect();
      return { x, y, width, height, bottom, right };
    };
    const nav = box(".site-header"),
      copy = box(".hero-copy"),
      art = box(".hero-art"),
      image = box(".hero-art img"),
      actions = box(".hero-actions");
    const overlap = (a, b) =>
      a.x < b.right - 1 &&
      a.right > b.x + 1 &&
      a.y < b.bottom - 1 &&
      a.bottom > b.y + 1;
    return {
      nav,
      copy,
      art,
      image,
      actions,
      artCropped: art.bottom > box(".hero").bottom + 1,
      scrollHeight: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
      navCollision: overlap(nav, art) || overlap(nav, copy),
      textCollision: overlap(copy, art),
      ctaInViewport: actions.bottom <= innerHeight,
      scale: visualViewport.scale,
      broken: [...document.images].filter((i) => !i.complete || !i.naturalWidth)
        .length,
    };
  });
  results.push({ width, height, ...geometry });
  console.log(width, height, JSON.stringify(geometry));
  await page.screenshot({
    path: `qa/landing-${width}x${height}.png`,
    fullPage: false,
  });
}
fs.writeFileSync(
  "qa/landing-viewports.json",
  JSON.stringify({ results, errors }, null, 2),
);
await browser.close();
if (
  errors.length ||
  results.some(
    (r) =>
      r.artCropped ||
      r.overflow ||
      r.navCollision ||
      r.textCollision ||
      !r.ctaInViewport ||
      r.broken,
  )
)
  process.exitCode = 1;
