import { createRequire } from "node:module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const { chromium } = require("/tmp/pw/node_modules/playwright");
const PORTAL = "http://127.0.0.1:5173";
const LANDING = "http://127.0.0.1:5174";
const PASS = "password123";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "docs/features/screenshots");

const routes = [
  ["01-home", "/", false],
  ["02-about", "/institute/aboutrgukt", true],
  ["03-campus", "/institute/campuslife", true],
  ["04-education", "/institute/edusys", true],
  ["05-council", "/institute/govcouncil", true],
  ["06-rti", "/institute/rtiinfo", true],
  ["07-scst", "/institute/scst", true],
  ["08-programs", "/academics/AcademicPrograms", true],
  ["09-calendar", "/academics/AcademicCalender", true],
  ["10-regulations", "/academics/AcademicRegulations", true],
  ["11-curricula", "/academics/curicula", true],
  ["12-cse", "/departments/CSE", true],
  ["13-civil", "/departments/CIVIL", true],
  ["14-ece", "/departments/ECE", true],
  ["15-news", "/notifications/news", true],
  ["16-tenders", "/notifications/tenders", true],
  ["17-careers", "/notifications/careers", true],
  ["18-not-found", "/no-such-page", true],
];

async function shot(page, rel, fullPage) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage });
  console.log("shot", rel);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();
    for (const [id, route, full] of routes) {
      await page.goto(LANDING + route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(700);
      const overlay = await page.locator("text=Failed to load PostCSS").count();
      if (overlay) throw new Error("landing still showing the PostCSS overlay on " + route);
      await shot(page, `landing/${id}-${viewport.name}.png`, full && id !== "01-home");
    }
    if (viewport.name === "mobile") {
      await page.goto(LANDING + "/", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const menu = page.locator("button").first();
      if (await menu.count()) await menu.click().catch(() => {});
      await page.waitForTimeout(400);
      await shot(page, "landing/19-mobile-menu-mobile.png", false);
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(PORTAL + "/admin/signin", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Institutional ID").fill("hod_cse");
  await page.getByLabel("Password", { exact: true }).fill(PASS);
  await page.locator("button[type='submit']").first().click();
  await page.waitForURL((url) => !url.pathname.includes("signin"), { timeout: 20000 });
  await page.waitForTimeout(800);
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll("aside button")]
      .map((b) => (b.innerText || "").replace(/\s+/g, " ").trim())
      .filter((t) => t && t.length < 48 && !/collapse|expand|sign out|logout/i.test(t)),
  );
  let n = 1;
  const seen = new Set();
  for (const label of labels) {
    if (seen.has(label)) continue;
    seen.add(label);
    await page.evaluate((wanted) => {
      const btn = [...document.querySelectorAll("aside button")].find((b) =>
        (b.innerText || "").includes(wanted),
      );
      btn?.click();
    }, label);
    await page.waitForTimeout(900);
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await shot(page, `profile/${String(n).padStart(2, "0")}-${slug}-hod_cse-desktop.png`, true);
    n += 1;
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
