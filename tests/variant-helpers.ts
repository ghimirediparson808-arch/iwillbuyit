import { expect, Page } from "@playwright/test";
import path from "node:path";
export const darkFile = path.resolve(
  "public/assets/designs/the-climb/master/print-light-shirt.png",
);
export const lightFile = path.resolve(
  "public/assets/designs/the-climb/master/print-dark-shirt.png",
);
export async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Admin email").fill("admin@iwillbuyit.com");
  await page.getByLabel("Password", { exact: true }).fill("PrintWithPurpose");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.locator(".admin-content")).toBeVisible();
}
export async function startDesign(page: Page, name: string) {
  await login(page);
  await page.goto("/admin/designs/new");
  await page.getByLabel("Design name", { exact: true }).fill(name);
  await page
    .getByLabel("Full description", { exact: true })
    .fill("Admin-selected transparent colour variants.");
}
export async function addVariant(page: Page, colour: string, file: string) {
  await page.getByLabel(`Enable ${colour}`, { exact: true }).check();
  await page
    .getByLabel(`${colour} front artwork`, { exact: true })
    .setInputFiles(file);
  await expect(
    page
      .getByRole("region", { name: `${colour} variant`, exact: true })
      .locator(".variant-original img"),
  ).toBeVisible();
}
export async function publish(page: Page) {
  await page
    .getByRole("button", { name: "Publish Design", exact: true })
    .click();
  await expect(page.locator(".success")).toContainText("Design published");
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("iwbi-v1-designs") || "[]").at(-1),
  );
}
export async function ink(page: Page, selector = ".large-mockup .print-art") {
  return page.locator(selector).evaluate(async (node) => {
    const im = node as HTMLImageElement;
    await im.decode();
    const c = document.createElement("canvas");
    c.width = im.naturalWidth;
    c.height = im.naturalHeight;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(im, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let alpha = 0,
      sum = 0,
      count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (!data[i + 3]) alpha++;
      if (data[i + 3] > 240) {
        sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        count++;
      }
    }
    return {
      mean: sum / count,
      transparent: alpha > 0,
      filter: getComputedStyle(im).filter,
      src: im.src,
    };
  });
}
export async function fileCount(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const op = indexedDB.open("iwbi-uploads", 1);
        op.onsuccess = () => {
          const db = op.result;
          const r = db.transaction("files").objectStore("files").count();
          r.onsuccess = () => {
            resolve(r.result);
            db.close();
          };
          r.onerror = () => reject(r.error);
        };
      }),
  );
}
