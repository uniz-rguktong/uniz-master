/**
 * UI audit "before" captures — public routes only (no API / auth required).
 * Output: /opt/cursor/artifacts/before/{portal|landing|docs}/...
 */
import { createRequire } from "node:module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try {
    return require("playwright");
  } catch {
    return require("/tmp/pw/node_modules/playwright");
  }
})();

const PORTAL = process.env.PORTAL_URL || "http://127.0.0.1:5173";
const LANDING = process.env.LANDING_URL || "http://127.0.0.1:5174";
const DOCS = process.env.DOCS_URL || "http://127.0.0.1:3333";
const OUT = process.env.AUDIT_OUT || "/opt/cursor/artifacts/before";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

async function settle(page) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(350);
}

async function shot(page, rel) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: rel.includes("full") });
  process.stdout.write(`  ${rel}\n`);
}

async function captureApp(browser, base, prefix, routes) {
  for (const viewport of ["desktop", "mobile"]) {
    const context = await browser.newContext({
      viewport: VIEWPORTS[viewport],
      reducedMotion: "reduce",
    });
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("uniz-mobile-app-banner-dismissed", "1");
      } catch {
        /* ignore */
      }
    });
    const page = await context.newPage();
    for (const [id, route, fullPage] of routes) {
      try {
        await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 20000 });
        await settle(page);
        const suffix = fullPage ? "-full" : "";
        await shot(page, `${prefix}/${id}-${viewport}${suffix}.png`);
      } catch (err) {
        process.stdout.write(`  FAIL ${prefix}/${id}-${viewport}: ${err.message}\n`);
      }
    }
    await context.close();
  }
}

const PORTAL_PUBLIC = [
  ["01-home", "/", true],
  ["02-student-signin", "/student/signin", false],
  ["03-admin-signin", "/admin/signin", false],
  ["04-faculty-signin", "/faculty/signin", false],
  ["05-alumni", "/alumni", true],
  ["06-info", "/info", true],
  ["07-admissions", "/admissions", false],
  ["08-developers", "/developers", true],
  ["09-privacy", "/privacy", true],
  ["10-ios", "/ios", false],
  ["11-notifications-deeplink", "/notifications", false],
  ["12-not-found", "/this-route-does-not-exist", false],
  ["13-seo-landing", "/student-project-management", false],
];

const LANDING_ROUTES = [
  ["01-home", "/"],
  ["02-about", "/institute/aboutrgukt"],
  ["03-campus", "/institute/campuslife"],
  ["04-programs", "/academics/AcademicPrograms"],
  ["05-cse", "/departments/CSE"],
  ["06-news", "/notifications/news"],
  ["07-not-found", "/no-such-page"],
];

const DOCS_ROUTES = [["01-index", "/"]];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    await captureApp(
      browser,
      PORTAL,
      "portal",
      PORTAL_PUBLIC.map(([id, route, full]) => [id, route, full]),
    );
    await captureApp(
      browser,
      LANDING,
      "landing",
      LANDING_ROUTES.map(([id, route]) => [id, route, route === "/"]),
    );
    await captureApp(
      browser,
      DOCS,
      "docs",
      DOCS_ROUTES.map(([id, route]) => [id, route, false]),
    );
  } finally {
    await browser.close();
  }
  process.stdout.write(`\nDone → ${OUT}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
