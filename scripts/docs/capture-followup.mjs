import { createRequire } from "node:module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const { chromium } = require("/tmp/pw/node_modules/playwright");
const PORTAL = "http://127.0.0.1:5173";
const PASS = "password123";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "docs/features/screenshots");

async function login(page, username) {
  await page.goto(PORTAL + "/student/signin", { waitUntil: "domcontentloaded" });
  await page.getByLabel("University ID").fill(username);
  await page.getByLabel("Password", { exact: true }).fill(PASS);
  await page.locator("button[type='submit']").first().click();
  await page.waitForURL((url) => !url.pathname.includes("signin"), { timeout: 20000 });
}

async function shot(page, rel) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: true });
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
    await login(page, "D210001");
    await page.goto(PORTAL + "/student/gradehub", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Get Results" }).click();
    await page.waitForTimeout(1500);
    await shot(page, `grades/05-results-loaded-${viewport.name}.png`);

    await page.goto(PORTAL + "/student/attendance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Get Attendance" }).click();
    await page.waitForTimeout(1500);
    await shot(page, `attendance/05-ledger-loaded-${viewport.name}.png`);

    await page.goto(PORTAL + "/student/feedback", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const give = page.getByRole("button", { name: "Give feedback" });
    if (await give.count()) {
      await give.click();
      await page.waitForTimeout(400);
      await shot(page, `feedback/05-form-open-${viewport.name}.png`);
      const submit = page.getByRole("button", { name: /^Submit/i });
      if (await submit.count()) {
        await submit.first().click();
        await page.waitForTimeout(500);
        await shot(page, `feedback/06-missing-rating-${viewport.name}.png`);
      }
      const five = page.getByRole("button", { name: "5" });
      if (await five.count()) await five.first().click();
      const comment = page.locator("textarea");
      if (await comment.count()) await comment.first().fill("Clear sessions in the local demo.");
      if (await submit.count()) {
        await submit.first().click();
        await page.waitForTimeout(1200);
        await shot(page, `feedback/07-submitted-${viewport.name}.png`);
      }
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await login(page, "D210001");
  await page.route("**/api/v1/academics/grades**", async (route) => {
    await new Promise((r) => setTimeout(r, 2500));
    await route.continue();
  });
  await page.goto(PORTAL + "/student/gradehub", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const pending = page.getByRole("button", { name: "Get Results" }).click();
  await page.waitForTimeout(400);
  await shot(page, "grades/06-results-loading-desktop.png");
  await pending.catch(() => {});
  await page.unroute("**/api/v1/academics/grades**");

  await page.route("**/api/v1/academics/grades**", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Demo fault injected for the error screenshot." }),
    }),
  );
  await page.goto(PORTAL + "/student/gradehub", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Get Results" }).click();
  await page.waitForTimeout(1000);
  await shot(page, "grades/07-results-error-desktop.png");
  await context.close();

  const empty = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const emptyPage = await empty.newPage();
  await login(emptyPage, "D210002");
  await emptyPage.goto(PORTAL + "/student/gradehub", { waitUntil: "domcontentloaded" });
  await emptyPage.waitForTimeout(500);
  await emptyPage.getByRole("button", { name: "Get Results" }).click();
  await emptyPage.waitForTimeout(1200);
  await shot(emptyPage, "grades/08-results-empty-desktop.png");
  await emptyPage.goto(PORTAL + "/student/attendance", { waitUntil: "domcontentloaded" });
  await emptyPage.waitForTimeout(400);
  await emptyPage.getByRole("button", { name: "Get Attendance" }).click();
  await emptyPage.waitForTimeout(1200);
  await shot(emptyPage, "attendance/06-ledger-empty-desktop.png");
  await empty.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
