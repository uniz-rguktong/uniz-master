/**
 * Local feature-doc capture. Talks only to the demo stack on 127.0.0.1.
 * Password for every seeded account is password123. Accounts are fictional.
 *
 *   NODE_PATH=/tmp/pw/node_modules node scripts/docs/capture-features.mjs
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
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT = path.join(ROOT, "docs/features/screenshots");
const PASS = "password123";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const manifest = [];
const failures = [];

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function settle(page) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function shot(page, rel, meta) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: meta.fullPage !== false });
  manifest.push({
    file: `screenshots/${rel.replace(/\\/g, "/")}`,
    ...meta,
  });
  process.stdout.write(`  shot ${rel}\n`);
}

async function safe(label, fn) {
  try {
    await fn();
  } catch (err) {
    const message = err && err.message ? err.message.split("\n")[0] : String(err);
    failures.push({ label, message });
    process.stdout.write(`  FAIL ${label}: ${message}\n`);
  }
}

async function newContext(browser, viewport) {
  const context = await browser.newContext({
    viewport: VIEWPORTS[viewport],
    deviceScaleFactor: 1,
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
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(20000);
  return { context, page };
}

async function login(page, kind, username) {
  const pathName =
    kind === "student"
      ? "/student/signin"
      : kind === "faculty"
        ? "/faculty/signin"
        : "/admin/signin";
  await page.goto(PORTAL + pathName, { waitUntil: "domcontentloaded" });
  await settle(page);
  const idLabel = kind === "student" ? "University ID" : "Institutional ID";
  await page.getByLabel(idLabel).fill(username);
  await page.getByLabel("Password", { exact: true }).fill(PASS);
  await page.locator("button[type='submit']").first().click();
  await page.waitForURL((url) => !url.pathname.includes("signin"), {
    timeout: 20000,
  });
  await settle(page);
}

async function both(browser, name, fn) {
  for (const viewport of ["desktop", "mobile"]) {
    const { context, page } = await newContext(browser, viewport);
    try {
      await fn(page, viewport);
    } finally {
      await context.close();
    }
    void name;
  }
}

async function capturePublic(browser) {
  const pages = [
    ["auth", "01-portal-home", "/", "Public portal home. Quick services include a hostel outpass card; the outpass routes themselves stay unmounted."],
    ["auth", "02-student-signin", "/student/signin", "Student sign-in form, empty."],
    ["auth", "03-admin-signin", "/admin/signin", "Admin sign-in form, empty. Faculty, HODs, and campus offices use this or the faculty sign-in."],
    ["auth", "04-faculty-signin", "/faculty/signin", "Faculty sign-in form, empty. It posts to the admin login endpoint."],
    ["auth", "05-forgot-password", "/admin/signin", "Forgot-password step opened from admin sign-in."],
    ["alumni", "01-public-directory", "/alumni", "Public alumni directory."],
    ["information-centre", "01-public", "/info", "Public information centre."],
    ["auth", "06-developers", "/developers", "Developers page linked from the portal."],
    ["auth", "07-privacy", "/privacy", "Privacy policy page."],
    ["notifications", "01-deeplink", "/notifications", "Notification deep link with no id."],
    ["auth", "08-not-found", "/this-route-does-not-exist", "Unknown portal path renders the 404 page."],
  ];

  for (const viewport of ["desktop", "mobile"]) {
    const { context, page } = await newContext(browser, viewport);
    for (const [mod, id, route, caption] of pages) {
      await safe(`${mod}/${id}/${viewport}`, async () => {
        await page.goto(PORTAL + route, { waitUntil: "domcontentloaded" });
        await settle(page);
        if (id === "05-forgot-password") {
          await page.getByRole("button", { name: "Forgot password?" }).click();
          await page.waitForTimeout(300);
        }
        await shot(page, `${mod}/${id}-${viewport}.png`, {
          module: mod,
          viewport,
          state: id.includes("signin") || id.includes("forgot") ? "empty" : "success",
          caption,
          route,
        });
      });
    }
    await context.close();
  }
}

async function captureAuthErrors(browser) {
  for (const viewport of ["desktop", "mobile"]) {
    const { context, page } = await newContext(browser, viewport);
    await safe(`auth-validation/${viewport}`, async () => {
      await page.goto(PORTAL + "/student/signin", { waitUntil: "domcontentloaded" });
      await settle(page);
      await page.getByLabel("University ID").fill("not-an-id");
      await page.getByLabel("Password", { exact: true }).fill("password123");
      await page.getByRole("button", { name: "Sign In" }).click();
      await page.waitForTimeout(600);
      await shot(page, `auth/09-invalid-id-${viewport}.png`, {
        module: "auth",
        viewport,
        state: "error",
        caption: "Student sign-in rejects an id that is neither a university id nor an email.",
        route: "/student/signin",
      });
    });
    await safe(`auth-short-password/${viewport}`, async () => {
      await page.goto(PORTAL + "/student/signin", { waitUntil: "domcontentloaded" });
      await settle(page);
      await page.getByLabel("University ID").fill("D210001");
      await page.getByLabel("Password", { exact: true }).fill("short");
      await page.getByRole("button", { name: "Sign In" }).click();
      await page.waitForTimeout(600);
      await shot(page, `auth/10-short-password-${viewport}.png`, {
        module: "auth",
        viewport,
        state: "error",
        caption: "Password shorter than 6 characters is rejected in the form before the request is sent.",
        route: "/student/signin",
      });
    });
    await safe(`auth-bad-password/${viewport}`, async () => {
      await page.goto(PORTAL + "/student/signin", { waitUntil: "domcontentloaded" });
      await settle(page);
      await page.getByLabel("University ID").fill("D210001");
      await page.getByLabel("Password", { exact: true }).fill("not-the-password");
      await page.getByRole("button", { name: "Sign In" }).click();
      await page.waitForTimeout(1200);
      await shot(page, `auth/11-wrong-password-${viewport}.png`, {
        module: "auth",
        viewport,
        state: "error",
        caption: "Wrong password for the fictional student D210001. The API returns invalid credentials.",
        route: "/student/signin",
      });
    });
    await safe(`auth-loading/${viewport}`, async () => {
      await page.route("**/api/v1/auth/login/**", async (route) => {
        await new Promise((r) => setTimeout(r, 2500));
        await route.continue();
      });
      await page.goto(PORTAL + "/student/signin", { waitUntil: "domcontentloaded" });
      await settle(page);
      await page.getByLabel("University ID").fill("D210001");
      await page.getByLabel("Password", { exact: true }).fill(PASS);
      const click = page.getByRole("button", { name: "Sign In" }).click();
      await page.waitForTimeout(400);
      await shot(page, `auth/12-signing-in-${viewport}.png`, {
        module: "auth",
        viewport,
        state: "loading",
        caption: "Sign-in button while the login request is still in flight.",
        route: "/student/signin",
      });
      await click.catch(() => {});
      await page.unroute("**/api/v1/auth/login/**").catch(() => {});
    });
    await context.close();
  }
}

const STUDENT_ROUTES = [
  ["profile", "01-dashboard", "/student", "success", "Student home. Profile, academics summary, and shortcuts. Outpass and outing are not in the sidebar."],
  ["profile", "02-password", "/student/resetpassword", "empty", "Change-password form before anything is typed."],
  ["grades", "01-results", "/student/gradehub", "success", "Results for D210001, who has two fictional grades."],
  ["attendance", "01-ledger", "/student/attendance", "success", "Attendance ledger for D210001."],
  ["grades", "02-registration", "/student/registration", "success", "Registration page. D210001 has one registered demo subject."],
  ["grades", "03-current-semester", "/student/current-semester", "success", "Current semester view."],
  ["fees", "01-invoices", "/student/fees", "success", "Fee invoices. Online payment is labelled coming soon."],
  ["library", "01-my-library", "/student/library", "success", "Library loans for D210001."],
  ["placement", "01-drives", "/student/placement", "success", "Open placement drives visible to the demo student."],
  ["alumni", "02-student", "/student/alumni", "success", "Signed-in alumni page."],
  ["information-centre", "02-student", "/student/info", "success", "Signed-in information centre."],
  ["feedback", "01-student", "/student/feedback", "success", "Course feedback available to the signed-in student."],
  ["notifications", "02-inbox", "/student/notifications", "success", "Student notification inbox, including the seeded demo notice."],
  ["profile", "03-help", "/student/help", "success", "Help and support."],
  ["profile", "04-grievance", "/student/grievance", "empty", "Grievance form before submit. A pending fictional grievance already exists for this student."],
  ["outpass", "01-student-route-parked", "/student/outpass", "parked", "Direct visit to /student/outpass. The route is commented out, so the portal 404 is shown. Outpass was not enabled for this capture."],
  ["outpass", "02-outing-route-parked", "/student/outing", "parked", "Direct visit to /student/outing. Same parked behaviour."],
];

async function captureStudent(browser, username, prefix, emptyNote) {
  for (const viewport of ["desktop", "mobile"]) {
    const { context, page } = await newContext(browser, viewport);
    await safe(`login-student-${username}-${viewport}`, async () => {
      await login(page, "student", username);
      await shot(page, `auth/13-student-home-${prefix}-${viewport}.png`, {
        module: "auth",
        viewport,
        state: "success",
        caption: `Signed in as fictional student ${username}. ${emptyNote}`,
        route: "/student",
      });
    });
    for (const [mod, id, route, state, caption] of STUDENT_ROUTES) {
      await safe(`${username}${route}/${viewport}`, async () => {
        await page.goto(PORTAL + route, { waitUntil: "domcontentloaded" });
        await settle(page);
        await shot(page, `${mod}/${id}-${prefix}-${viewport}.png`, {
          module: mod,
          viewport,
          state: prefix === "empty" ? "empty" : state,
          caption: prefix === "empty" ? `${caption} Captured with ${username}, who has no academic, fee, library, or inbox rows.` : caption,
          route,
          role: "student",
          account: username,
        });
      });
    }
    if (prefix === "populated" && viewport === "desktop") {
      await safe("fees-pay", async () => {
        await page.goto(PORTAL + "/student/fees", { waitUntil: "domcontentloaded" });
        await settle(page);
        const pay = page.getByRole("button", { name: /Pay online/i });
        if (await pay.count()) {
          await pay.first().click();
          await page.waitForTimeout(700);
          await shot(page, "fees/02-pay-coming-soon-desktop.png", {
            module: "fees",
            viewport: "desktop",
            state: "success",
            caption: "Pay online stays disabled. The toast reports that payments are coming soon.",
            route: "/student/fees",
          });
        }
      });
      await safe("password-validation", async () => {
        await page.goto(PORTAL + "/student/resetpassword", { waitUntil: "domcontentloaded" });
        await settle(page);
        const inputs = page.locator("input");
        const n = await inputs.count();
        if (n >= 2) {
          await inputs.nth(0).fill("short");
          await inputs.nth(1).fill("different");
          const submit = page.getByRole("button", { name: /update|change|save|submit/i });
          if (await submit.count()) await submit.first().click();
          await page.waitForTimeout(600);
          await shot(page, "profile/05-password-validation-desktop.png", {
            module: "profile",
            viewport: "desktop",
            state: "error",
            caption: "Password change with a weak value and a mismatch, if the form exposes those fields.",
            route: "/student/resetpassword",
          });
        }
      });
      await safe("grievance-validation", async () => {
        await page.goto(PORTAL + "/student/grievance", { waitUntil: "domcontentloaded" });
        await settle(page);
        const send = page.getByRole("button", { name: /submit|send/i });
        if (await send.count()) {
          await send.first().click();
          await page.waitForTimeout(500);
          await shot(page, "profile/06-grievance-empty-submit-desktop.png", {
            module: "profile",
            viewport: "desktop",
            state: "error",
            caption: "Submitting a grievance with an empty description shows a validation toast.",
            route: "/student/grievance",
          });
        }
      });
      await safe("feedback-rate", async () => {
        await page.goto(PORTAL + "/student/feedback", { waitUntil: "domcontentloaded" });
        await settle(page);
        const openBtn = page.getByRole("button").filter({ hasText: /Demo Operating Systems|feedback|Rate/i });
        if (await openBtn.count()) {
          await openBtn.first().click().catch(() => {});
          await page.waitForTimeout(400);
        }
        const rate = page.getByRole("button", { name: "5" });
        if (await rate.count()) await rate.first().click();
        const submit = page.getByRole("button", { name: /submit/i });
        if (await submit.count()) {
          await submit.first().click();
          await page.waitForTimeout(800);
        }
        await shot(page, "feedback/02-submit-desktop.png", {
          module: "feedback",
          viewport: "desktop",
          state: "success",
          caption: "Feedback form after an attempt to rate and submit. The result on screen is whatever the API returned for this demo form.",
          route: "/student/feedback",
        });
      });
    }
    await context.close();
  }
}

async function captureStudentStates(browser) {
  const cases = [
    ["grades", "03-loading", "/student/gradehub", "**/api/v1/academics/grades**", "delay", "Results page while the grades request is held."],
    ["grades", "04-error", "/student/gradehub", "**/api/v1/academics/grades**", "error", "Results page when the grades request fails."],
    ["attendance", "02-loading", "/student/attendance", "**/api/v1/academics/attendance**", "delay", "Attendance page while the attendance request is held."],
    ["attendance", "03-error", "/student/attendance", "**/api/v1/academics/attendance**", "error", "Attendance page when the attendance request fails."],
    ["fees", "03-loading", "/student/fees", "**/api/v1/fees/**", "delay", "Fees page while the fees request is held."],
    ["fees", "04-error", "/student/fees", "**/api/v1/fees/**", "error", "Fees page when the fees request fails."],
    ["library", "02-loading", "/student/library", "**/api/v1/library/**", "delay", "Library page while the library request is held."],
    ["library", "03-error", "/student/library", "**/api/v1/library/**", "error", "Library page when the library request fails."],
    ["placement", "02-error", "/student/placement", "**/api/v1/placement/**", "error", "Placements page when the placement request fails."],
    ["notifications", "03-error", "/student/notifications", "**/api/v1/notifications/**", "error", "Inbox when the notification request fails."],
    ["information-centre", "03-error", "/student/info", "**/api/v1/infocentre/**", "error", "Information centre when its request fails."],
    ["alumni", "03-error", "/student/alumni", "**/api/v1/alumni/**", "error", "Alumni page when its request fails."],
    ["feedback", "03-error", "/student/feedback", "**/api/v1/feedback/**", "error", "Feedback page when its request fails."],
  ];
  for (const viewport of ["desktop", "mobile"]) {
    for (const [mod, id, route, pattern, mode, caption] of cases) {
      const { context, page } = await newContext(browser, viewport);
      await safe(`${id}-${viewport}`, async () => {
        await login(page, "student", "D210001");
        await page.route(pattern, async (r) => {
          if (mode === "delay") {
            await new Promise((res) => setTimeout(res, 4000));
            await r.continue();
          } else {
            await r.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ message: "Demo fault injected for the error screenshot." }),
            });
          }
        });
        const nav = page.goto(PORTAL + route, { waitUntil: "domcontentloaded" });
        if (mode === "delay") {
          await page.waitForTimeout(700);
          await shot(page, `${mod}/${id}-${viewport}.png`, {
            module: mod,
            viewport,
            state: "loading",
            caption,
            route,
          });
          await page.unroute(pattern).catch(() => {});
        }
        await nav.catch(() => {});
        if (mode === "error") {
          await page.waitForTimeout(800);
          await shot(page, `${mod}/${id}-${viewport}.png`, {
            module: mod,
            viewport,
            state: "error",
            caption,
            route,
          });
        }
      });
      await context.close();
    }
  }
}

async function clickNavLabels(page) {
  return page.evaluate(() => {
    const labels = [];
    for (const b of document.querySelectorAll("aside button")) {
      const text = (b.innerText || b.textContent || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!text || text.length > 48) continue;
      if (/collapse|expand|sign out|logout/i.test(text)) continue;
      if (!labels.includes(text)) labels.push(text);
    }
    return labels;
  });
}

async function captureRole(browser, spec) {
  const viewports = spec.viewports || ["desktop", "mobile"];
  for (const viewport of viewports) {
    const { context, page } = await newContext(browser, viewport);
    await safe(`${spec.account}-login-${viewport}`, async () => {
      await login(page, spec.kind, spec.account);
      await shot(page, `${spec.module}/00-home-${spec.account}-${viewport}.png`, {
        module: spec.module,
        viewport,
        state: "success",
        caption: spec.homeCaption,
        route: page.url().replace(PORTAL, ""),
        role: spec.role,
        account: spec.account,
      });
      const labels = await clickNavLabels(page);
      let n = 1;
      for (const label of labels) {
        await safe(`${spec.account}-${viewport}-${label}`, async () => {
          if (viewport === "mobile") {
            const opened = await page.evaluate((wanted) => {
              const buttons = [...document.querySelectorAll("aside button")];
              const btn = buttons.find((b) =>
                (b.innerText || "").replace(/\s+/g, " ").includes(wanted),
              );
              if (!btn) return false;
              btn.click();
              return true;
            }, label);
            if (!opened) throw new Error(`no nav button ${label}`);
            await page.waitForTimeout(600);
          } else {
            const btn = page
              .locator("aside button")
              .filter({ hasText: label })
              .first();
            await btn.click({ timeout: 5000 });
            await settle(page);
          }
          await shot(
            page,
            `${spec.shotModule || spec.module}/${String(n).padStart(2, "0")}-${slug(label)}-${spec.account}-${viewport}.png`,
            {
              module: spec.shotModule || spec.module,
              viewport,
              state: "success",
              caption:
                viewport === "mobile"
                  ? `${spec.role} (${spec.account}) section “${label}” at 390px. The default admin sidebar is hidden below the md breakpoint, so this is the section after the nav button is activated.`
                  : `${spec.role} (${spec.account}) opened “${label}”.`,
              route: new URL(page.url()).pathname,
              role: spec.role,
              account: spec.account,
              section: label,
            },
          );
          n += 1;
        });
      }
    });
    await context.close();
  }
}

async function captureFacultyFlows(browser) {
  const { context, page } = await newContext(browser, "desktop");
  await safe("faculty-flows", async () => {
    await login(page, "faculty", "faculty_cse");
    const leave = page.getByRole("button", { name: "Leave & Duties" });
    if (await leave.count()) {
      await leave.click();
      await settle(page);
      await shot(page, "leave/01-faculty-list-desktop.png", {
        module: "leave",
        viewport: "desktop",
        state: "success",
        caption: "Faculty leave page for FACULTY_CSE, including the seeded pending casual leave.",
        role: "faculty",
      });
      await page.getByRole("button", { name: "Apply" }).click();
      await page.waitForTimeout(400);
      await shot(page, "leave/02-apply-validation-desktop.png", {
        module: "leave",
        viewport: "desktop",
        state: "error",
        caption: "Apply with empty required dates and reason. The browser blocks the submit.",
      });
      const dates = page.locator('input[type="date"]');
      if ((await dates.count()) >= 2) {
        await dates.nth(0).fill("2026-12-01");
        await dates.nth(1).fill("2026-12-01");
        await page.getByPlaceholder("Reason").fill("Fictional personal errand.");
        await page.getByRole("button", { name: "Apply" }).click();
        await page.waitForTimeout(1200);
        await shot(page, "leave/03-apply-result-desktop.png", {
          module: "leave",
          viewport: "desktop",
          state: "success",
          caption: "Result of submitting a one-day casual leave. The toast and list show whether the API accepted it.",
        });
      }
    }
    const duties = page.getByRole("button", { name: "Exam Duties" });
    if (await duties.count()) {
      await duties.click();
      await settle(page);
      await shot(page, "exam-duties/01-faculty-desktop.png", {
        module: "exam-duties",
        viewport: "desktop",
        state: "success",
        caption: "Exam duties assigned to FACULTY_CSE in the local fixture.",
        role: "faculty",
      });
    }
    const feedback = page.getByRole("button", { name: "My Feedback" });
    if (await feedback.count()) {
      await feedback.click();
      await settle(page);
      await shot(page, "feedback/04-faculty-results-desktop.png", {
        module: "feedback",
        viewport: "desktop",
        state: "success",
        caption: "Faculty view of feedback results.",
        role: "faculty",
      });
    }
    const library = page.getByRole("button", { name: "Library" });
    if (await library.count()) {
      await library.click();
      await settle(page);
      await shot(page, "library/04-faculty-desktop.png", {
        module: "library",
        viewport: "desktop",
        state: "empty",
        caption: "Faculty library tab. This demo faculty has no loan.",
        role: "faculty",
      });
    }
    const profile = page.getByRole("button", { name: "My Profile" });
    if (await profile.count()) {
      await profile.click();
      await settle(page);
      await shot(page, "profile/07-faculty-desktop.png", {
        module: "profile",
        viewport: "desktop",
        state: "success",
        caption: "Faculty profile for Dr Meera Demo.",
        role: "faculty",
      });
    }
    const students = page.getByRole("button", { name: "Branch Students" });
    if (await students.count()) {
      await students.click();
      await settle(page);
      await shot(page, "profile/08-faculty-students-desktop.png", {
        module: "profile",
        viewport: "desktop",
        state: "success",
        caption: "Branch student search on the faculty dashboard.",
        role: "faculty",
      });
    }
  });
  await context.close();

  const mobile = await newContext(browser, "mobile");
  await safe("faculty-mobile", async () => {
    await login(mobile.page, "faculty", "faculty_cse");
    await shot(mobile.page, "profile/09-faculty-home-mobile.png", {
      module: "profile",
      viewport: "mobile",
      state: "success",
      caption: "Faculty dashboard at 390px. The side navigation is hidden below the md breakpoint; a menu control toggles it.",
      role: "faculty",
    });
    const menu = mobile.page.getByRole("button", { name: /menu/i });
    if (await menu.count()) await menu.first().click();
    await mobile.page.waitForTimeout(300);
    await shot(mobile.page, "profile/10-faculty-menu-mobile.png", {
      module: "profile",
      viewport: "mobile",
      state: "success",
      caption: "Faculty navigation after opening the mobile menu, when that control is present.",
      role: "faculty",
    });
  });
  await mobile.context.close();
}

async function captureLanding(browser) {
  const routes = [
    ["01-home", "/", "Landing home."],
    ["02-about", "/institute/aboutrgukt", "Institute: about RGUKT."],
    ["03-campus", "/institute/campuslife", "Institute: campus life."],
    ["04-education", "/institute/edusys", "Institute: education system."],
    ["05-council", "/institute/govcouncil", "Institute: governing council."],
    ["06-rti", "/institute/rtiinfo", "Institute: RTI."],
    ["07-scst", "/institute/scst", "Institute: SC/ST cell."],
    ["08-programs", "/academics/AcademicPrograms", "Academics: programs."],
    ["09-calendar", "/academics/AcademicCalender", "Academics: calendar."],
    ["10-regulations", "/academics/AcademicRegulations", "Academics: regulations."],
    ["11-curricula", "/academics/curicula", "Academics: curricula."],
    ["12-cse", "/departments/CSE", "Department: CSE."],
    ["13-civil", "/departments/CIVIL", "Department: Civil."],
    ["14-ece", "/departments/ECE", "Department: ECE."],
    ["15-news", "/notifications/news", "Public news and updates."],
    ["16-tenders", "/notifications/tenders", "Public tenders."],
    ["17-careers", "/notifications/careers", "Public careers."],
    ["18-not-found", "/no-such-page", "Landing 404."],
  ];
  for (const viewport of ["desktop", "mobile"]) {
    const { context, page } = await newContext(browser, viewport);
    for (const [id, route, caption] of routes) {
      await safe(`landing${route}/${viewport}`, async () => {
        await page.goto(LANDING + route, { waitUntil: "domcontentloaded" });
        await settle(page);
        await shot(page, `landing/${id}-${viewport}.png`, {
          module: "landing",
          viewport,
          state: id.includes("not-found") ? "error" : "success",
          caption,
          route,
          fullPage: id !== "01-home",
        });
      });
    }
    await safe(`landing-menu/${viewport}`, async () => {
      await page.goto(LANDING + "/", { waitUntil: "domcontentloaded" });
      await settle(page);
      if (viewport === "mobile") {
        const menu = page.getByRole("button").first();
        if (await menu.count()) await menu.click().catch(() => {});
        await page.waitForTimeout(400);
        await shot(page, "landing/19-mobile-menu-mobile.png", {
          module: "landing",
          viewport: "mobile",
          state: "success",
          caption: "Landing header menu on a narrow viewport.",
          route: "/",
          fullPage: false,
        });
      }
    });
    await context.close();
  }
}

async function captureAdminUrls(browser) {
  const urls = [
    ["/admin/addstudents", "establishment", "01-add-students", "Legacy add-students page."],
    ["/admin/addfaculty", "establishment", "02-add-faculty", "Legacy add-faculty page."],
    ["/admin/addgrades", "grades", "05-legacy-upload", "Legacy grades upload page."],
    ["/admin/addattendance", "attendance", "04-legacy-upload", "Legacy attendance upload page."],
    ["/admin/settings", "auth", "14-settings", "Admin settings."],
    ["/admin/profile", "profile", "11-admin-profile", "Admin profile page."],
    ["/admin/roles", "auth", "15-roles", "Role management."],
    ["/admin/security", "auth", "16-security-page", "Security portal route."],
    ["/admin/notifications", "notifications", "04-admin-page", "Admin notifications page."],
    ["/admin/approveoutpass", "outpass", "03-admin-route-parked", "Approve-outpass URL. The route is commented out."],
    ["/admin/approveouting", "outpass", "04-admin-outing-parked", "Approve-outing URL. The route is commented out."],
  ];
  const { context, page } = await newContext(browser, "desktop");
  await safe("legacy-admin", async () => {
    await login(page, "admin", "webadmin");
    for (const [route, mod, id, caption] of urls) {
      await safe(route, async () => {
        await page.goto(PORTAL + route, { waitUntil: "domcontentloaded" });
        await settle(page);
        await shot(page, `${mod}/${id}-desktop.png`, {
          module: mod,
          viewport: "desktop",
          state: route.includes("outpass") || route.includes("outing") ? "parked" : "success",
          caption,
          route,
          role: "webadmin",
        });
      });
    }
  });
  await context.close();
  const mobile = await newContext(browser, "mobile");
  await safe("legacy-admin-mobile", async () => {
    await login(mobile.page, "admin", "webadmin");
    for (const route of ["/admin/profile", "/admin/security", "/admin/approveoutpass"]) {
      await mobile.page.goto(PORTAL + route, { waitUntil: "domcontentloaded" });
      await settle(mobile.page);
      const id = slug(route);
      await shot(mobile.page, `profile/${id}-mobile.png`, {
        module: route.includes("outpass") ? "outpass" : "profile",
        viewport: "mobile",
        state: route.includes("outpass") ? "parked" : "success",
        caption: `Mobile view of ${route} while signed in as webadmin.`,
        route,
      });
    }
  });
  await mobile.context.close();
}

const ROLES = [
  {
    account: "faculty_cse",
    kind: "faculty",
    role: "faculty",
    module: "profile",
    shotModule: "profile",
    homeCaption: "Faculty dashboard home for Dr Meera Demo.",
  },
  {
    account: "hod_cse",
    kind: "admin",
    role: "hod",
    module: "profile",
    shotModule: "profile",
    homeCaption: "CSE HOD shell. Leave approvals and semester approvals are in this nav. Outpass tabs are filtered out.",
  },
  {
    account: "dean",
    kind: "admin",
    role: "dean",
    module: "profile",
    shotModule: "profile",
    homeCaption: "Dean shell. Academic uploads, semester approval, leave, fees, feedback, placements, alumni, and the information centre.",
  },
  {
    account: "director",
    kind: "admin",
    role: "director",
    module: "profile",
    shotModule: "profile",
    homeCaption: "Director shell. Students, academics, campus content, faculty, logs, and security. Hostel outpass is not in this nav.",
  },
  {
    account: "webadmin",
    kind: "admin",
    role: "webadmin",
    module: "profile",
    shotModule: "profile",
    homeCaption: "Webadmin shell. This is the widest admin navigation.",
  },
  {
    account: "coe",
    kind: "admin",
    role: "coe",
    module: "profile",
    shotModule: "profile",
    homeCaption: "Controller of Examinations uses the same webmaster shell as webadmin.",
  },
  {
    account: "swo_office",
    kind: "admin",
    role: "swo",
    module: "profile",
    shotModule: "profile",
    homeCaption: "Student welfare shell. Grievances stay. Outpass and outing tabs are removed while the feature is parked.",
  },
  {
    account: "warden_male",
    kind: "admin",
    role: "warden_male",
    module: "outpass",
    shotModule: "outpass",
    homeCaption: "Boys hostel warden. Approval actions for outpass and outing are not shown.",
  },
  {
    account: "warden_female",
    kind: "admin",
    role: "warden_female",
    module: "outpass",
    shotModule: "outpass",
    homeCaption: "Girls hostel warden. Same parked outpass navigation.",
  },
  {
    account: "caretaker_male",
    kind: "admin",
    role: "caretaker_male",
    module: "outpass",
    shotModule: "outpass",
    homeCaption: "Boys hostel caretaker. Outpass approval links are hidden.",
  },
  {
    account: "caretaker_female",
    kind: "admin",
    role: "caretaker_female",
    module: "outpass",
    shotModule: "outpass",
    homeCaption: "Girls hostel caretaker. Outpass approval links are hidden.",
  },
  {
    account: "security",
    kind: "admin",
    role: "security",
    module: "auth",
    shotModule: "auth",
    homeCaption: "Security role lands on the security portal.",
  },
  {
    account: "librarian",
    kind: "admin",
    role: "librarian",
    module: "library",
    shotModule: "library",
    homeCaption: "Librarian desk.",
  },
  {
    account: "ao",
    kind: "admin",
    role: "ao",
    module: "establishment",
    shotModule: "establishment",
    homeCaption: "Administrative officer. This role has no dedicated establishment module screen; it falls through to the generic admin hub. Outpass cards are omitted.",
  },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const only = process.env.CAPTURE_ONLY || "all";
  const browser = await chromium.launch({ headless: true });
  try {
    if (only === "all") {
      await capturePublic(browser);
      await captureAuthErrors(browser);
      await captureStudent(browser, "D210001", "populated", "This account has grades, attendance, a fee invoice, a library loan, and an inbox item.");
      await captureStudent(browser, "D210002", "empty", "This account has a profile and no module rows.");
      await captureStudentStates(browser);
    }
    if (only === "all" || only === "rest") {
      await captureFacultyFlows(browser);
      const skipDesktop = new Set(["hod_cse", "dean", "director", "webadmin"]);
      for (const spec of ROLES) {
        if (spec.account === "faculty_cse") continue;
        process.stdout.write(`\nrole ${spec.account}\n`);
        if (only === "rest" && skipDesktop.has(spec.account)) {
          const original = { ...spec };
          await captureRole(browser, { ...original, viewports: ["mobile"] });
        } else {
          await captureRole(browser, spec);
        }
      }
      await captureAdminUrls(browser);
      await captureLanding(browser);
    }
  } finally {
    await browser.close();
  }
  const manifestPath = path.join(ROOT, "docs/features/capture-manifest.json");
  let previous = [];
  try {
    previous = JSON.parse(fs.readFileSync(manifestPath, "utf8")).shots || [];
  } catch {
    previous = [];
  }
  const byFile = new Map(previous.map((s) => [s.file, s]));
  for (const shot of manifest) byFile.set(shot.file, shot);
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".png")) {
        const rel = path.relative(OUT, p).split(path.sep).join("/");
        const file = `screenshots/${rel}`;
        if (!byFile.has(file)) {
          byFile.set(file, {
            file,
            caption: rel,
            state: "captured",
          });
        }
      }
    }
  };
  if (fs.existsSync(OUT)) walk(OUT);
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        shots: [...byFile.values()],
        failures,
      },
      null,
      2,
    ),
  );
  process.stdout.write(`\nshots ${manifest.length} failures ${failures.length}\n`);
  if (failures.length) {
    for (const f of failures) process.stdout.write(` - ${f.label}: ${f.message}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
