import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] || "http://127.0.0.1:5173/";
const outDir = process.argv[3] || "/opt/cursor/artifacts/screenshots";
const prefix = process.argv[4] || "landing";

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

async function shot(name, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("#leadership, h1", { timeout: 90000 });
  await page.waitForTimeout(1500);
  const path = `${outDir}/${prefix}-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(path);
}

await shot("desktop", { width: 1440, height: 900 });
await shot("mobile", { width: 390, height: 844 });

await browser.close();
