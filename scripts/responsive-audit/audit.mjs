#!/usr/bin/env node
/**
 * Headless Chromium responsive audit for the portal, landing site, and docs.
 *
 *   node scripts/responsive-audit/audit.mjs
 *   node scripts/responsive-audit/audit.mjs --skip-build --app landing --limit 4
 *
 * Writes scripts/responsive-audit/out/report.json and report.md.
 * Screenshots are taken only for open failures.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { chromium } from "playwright";
import { allRoutes, withEmptyVariants } from "./routes.mjs";
import { isApiRequest, mockFor } from "./fixtures.mjs";
import { detectLayout } from "./detect.mjs";
import { decorate, writeReports } from "./report.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const OUT = path.join(import.meta.dirname, "out");
const SHOTS = path.join(OUT, "screenshots");

const VIEWPORTS = [
  { name: "360x740", width: 360, height: 740 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
];

const SERVERS = {
  portal: { cwd: "apps/uniz-portal", port: 4173, cmd: ["npx", "vite", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"] },
  landing: { cwd: "apps/uniz-landing", port: 4174, cmd: ["npx", "vite", "preview", "--host", "127.0.0.1", "--port", "4174", "--strictPort"] },
  docs: { cwd: "apps/uniz-docs", port: 4175, cmd: ["npx", "vitepress", "preview", "--host", "127.0.0.1", "--port", "4175"] },
};

function parseArgs(argv) {
  const args = {
    skipBuild: false,
    baseline: false,
    apps: ["portal", "landing", "docs"],
    limit: 0,
    workers: Number(process.env.AUDIT_WORKERS || 4),
    viewports: VIEWPORTS,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--skip-build") args.skipBuild = true;
    else if (arg === "--baseline") args.baseline = true;
    else if (arg === "--app") args.apps = argv[++i].split(",");
    else if (arg === "--limit") args.limit = Number(argv[++i]);
    else if (arg === "--workers") args.workers = Number(argv[++i]);
    else if (arg === "--viewport") {
      const name = argv[++i];
      args.viewports = VIEWPORTS.filter((v) => v.name === name);
    }
  }
  return args;
}

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", env: process.env });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))));
  });
}

async function buildApps(apps) {
  const steps = [];
  if (apps.includes("portal")) steps.push(["npm", ["run", "build", "-w", "uniz"], ROOT]);
  if (apps.includes("landing")) steps.push(["npm", ["run", "build", "-w", "uniz-landing"], ROOT]);
  if (apps.includes("docs")) steps.push(["npm", ["run", "build", "-w", "uniz-docs"], ROOT]);
  for (const [cmd, args, cwd] of steps) {
    console.log(`\n> ${cmd} ${args.join(" ")}`);
    await run(cmd, args, cwd);
  }
}

function waitForPort(port, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const socket = net.connect({ host: "127.0.0.1", port }, () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error(`port ${port} did not open`));
        else setTimeout(tick, 250);
      });
    };
    tick();
  });
}

function startServer(app) {
  const spec = SERVERS[app];
  const child = spawn(spec.cmd[0], spec.cmd.slice(1), {
    cwd: path.join(ROOT, spec.cwd),
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    detached: true,
  });
  child.unref();
  child.stdout.on("data", (buf) => process.stdout.write(`[${app}] ${buf}`));
  child.stderr.on("data", (buf) => process.stderr.write(`[${app}] ${buf}`));
  return child;
}

function jwt(payload) {
  const body = { ...payload };
  let json = JSON.stringify(body);
  while (Buffer.byteLength(json) % 3 !== 0) {
    body.pad = `${body.pad || ""}a`;
    json = JSON.stringify(body);
  }
  const segment = Buffer.from(json).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `eyJhbGciOiJub25lIn0.${segment}.audit`;
}

const EXP = { exp: 2_000_000_000, iat: 1_700_000_000 };
const LONG_EMAIL = "padmavathi.venkata.subrahmanyam.krishnamacharyulu@rguktong.ac.in";

function sessionFor(auth) {
  if (auth === "student") {
    return {
      student_token: jwt({ username: "o190001", role: "student", email: LONG_EMAIL, ...EXP }),
      username: "o190001",
    };
  }
  if (auth === "admin") {
    return {
      admin_token: jwt({
        username: "webadmin",
        email: "webadmin@rguktong.ac.in",
        role: "webadmin",
        department: "CSE",
        ...EXP,
      }),
      username: "webadmin",
      admin_role: "webadmin",
      role: "webadmin",
      department: "CSE",
    };
  }
  if (auth === "faculty") {
    return {
      faculty_token: jwt({
        username: "faculty.cse",
        email: LONG_EMAIL,
        role: "teacher",
        department: "CSE",
        ...EXP,
      }),
      username: "faculty.cse",
      role: "teacher",
      department: "CSE",
    };
  }
  return {};
}

function ignoreConsole(text) {
  return /Download the React DevTools|\[vite\]|\[Push\]|favicon|ResizeObserver loop|chrome-extension:|Failed to load resource: the server responded with a status of 404 \(Not Found\).*og\.png/i.test(
    text,
  );
}

function consoleOwner(text) {
  if (/X-Frame-Options|Refused to display|localStorage|Access is denied|status of 403/i.test(text)) {
    return "cross-origin-frame";
  }
  return null;
}

function navigationOwner(actual, expected) {
  if (actual === "/admin" && expected.startsWith("/admin/")) return "auth-redirect";
  if (actual === "/" && expected === "/this-page-does-not-exist") return "auth-redirect";
  return null;
}

function splitOwned(issue) {
  const groups = new Map();
  const examples = issue.examples?.length ? issue.examples : [{ selector: "", text: "", ownedBy: issue.ownedBy || null }];
  for (const example of examples) {
    const key = example.ownedBy || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(example);
  }
  return [...groups.entries()].map(([ownedBy, grouped]) => ({
    ...issue,
    ownedBy: ownedBy || null,
    examples: grouped,
  }));
}

async function auditPage(browser, job) {
  const context = await browser.newContext({
    viewport: { width: job.viewport.width, height: job.viewport.height },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
    javaScriptEnabled: true,
  });
  await context.addInitScript((raw) => {
    const data = JSON.parse(raw);
    for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value);
    localStorage.setItem("uniz-audit", "1");
  }, JSON.stringify(sessionFor(job.auth)));

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err && err.message ? err.message : err)));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (!ignoreConsole(text)) consoleErrors.push(text);
  });

  await page.route("**/*", async (route) => {
    const request = route.request();
    const type = request.resourceType();
    if (type === "document" || type === "script" || type === "stylesheet" || type === "font" || type === "websocket") {
      return route.continue();
    }
    const url = request.url();
    if (!isApiRequest(url, job.origin)) return route.continue();
    const referer = request.headers().referer || "";
    const mocked = mockFor(url, { empty: job.empty || referer.includes("auditState=empty") });
    if (mocked.body) {
      return route.fulfill({ status: mocked.status, body: mocked.body, contentType: mocked.contentType });
    }
    return route.fulfill({
      status: mocked.status,
      contentType: "application/json",
      body: JSON.stringify(mocked.json),
    });
  });

  const target = new URL(job.path, job.origin);
  if (job.empty) target.searchParams.set("auditState", "empty");
  const findings = [];
  try {
    const response = await page.goto(target.href, { waitUntil: "load", timeout: 30000 });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
    await page.waitForTimeout(600);
    const status = response ? response.status() : 0;
    if (status >= 400) {
      findings.push({
        app: job.app,
        path: job.path,
        auth: job.auth,
        empty: job.empty,
        viewport: job.viewport.name,
        check: "navigation",
        detail: `HTTP ${status} for ${target.pathname}`,
        examples: [],
      });
    }
    const layout = await page.evaluate(detectLayout, {
      mobile: job.viewport.width <= 390,
      tapMin: 40,
    });
    for (const issue of layout.issues) {
      for (const part of splitOwned(issue)) {
        findings.push({
          app: job.app,
          path: job.path,
          auth: job.auth,
          empty: Boolean(job.empty),
          viewport: job.viewport.name,
          check: part.check,
          detail: part.detail,
          ownedBy: part.ownedBy,
          examples: part.examples,
          finalUrl: layout.href,
        });
      }
    }
    const finalPath = new URL(layout.href).pathname;
    const expected = job.path.replace(/\/$/, "") || "/";
    const actual = finalPath.replace(/\/$/, "") || "/";
    const redirectedOk =
      (job.path === "/login" && actual.endsWith("/student/signin")) ||
      (job.path === "/signin" && actual.endsWith("/student/signin")) ||
      (job.path === "/notifications" && actual.includes("/signin")) ||
      job.path.startsWith("/nexus");
    if (!redirectedOk && actual !== expected && !actual.endsWith(expected)) {
      findings.push({
        app: job.app,
        path: job.path,
        auth: job.auth,
        empty: Boolean(job.empty),
        viewport: job.viewport.name,
        check: "navigation",
        detail: `Landed on ${actual} instead of ${expected}`,
        ownedBy: navigationOwner(actual, expected),
        examples: [],
        finalUrl: layout.href,
      });
    }
    for (const message of [...new Set(consoleErrors)].slice(0, 6)) {
      findings.push({
        app: job.app,
        path: job.path,
        auth: job.auth,
        empty: Boolean(job.empty),
        viewport: job.viewport.name,
        check: "console-error",
        detail: message.slice(0, 500),
        ownedBy: consoleOwner(message),
        console: message.slice(0, 500),
        examples: [],
      });
    }

    const openShots = findings.filter((finding) => decorate(finding).status === "open");
    for (const finding of openShots) {
      const slug = `${job.app}-${job.path}-${job.viewport.name}-${finding.check}${job.empty ? "-empty" : ""}`
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 140);
      const file = path.join(SHOTS, `${slug}.png`);
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: file, fullPage: false });
      finding.screenshot = path.relative(OUT, file);
    }
  } catch (err) {
    findings.push({
      app: job.app,
      path: job.path,
      auth: job.auth,
      empty: Boolean(job.empty),
      viewport: job.viewport.name,
      check: "navigation",
      detail: String(err && err.message ? err.message : err).slice(0, 500),
      examples: [],
    });
  } finally {
    await context.close();
  }
  return findings;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.skipBuild) await buildApps(args.apps);

  let routes = withEmptyVariants(allRoutes()).filter((route) => args.apps.includes(route.app));
  if (args.limit) routes = routes.slice(0, args.limit);
  console.log(`Routes: ${routes.length} across ${args.apps.join(", ")}`);
  for (const app of args.apps) {
    console.log(`  ${app}: ${routes.filter((route) => route.app === app).length}`);
  }

  const children = args.apps.map((app) => ({ app, child: startServer(app) }));
  const stop = () => {
    for (const { child } of children) {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        try {
          child.kill("SIGKILL");
        } catch {
          /* already gone */
        }
      }
    }
  };
  process.on("SIGINT", () => {
    stop();
    process.exit(1);
  });

  try {
    await Promise.all(children.map(({ app }) => waitForPort(SERVERS[app].port)));
    const jobs = [];
    for (const route of routes) {
      for (const viewport of args.viewports) {
        jobs.push({
          ...route,
          viewport,
          origin: `http://127.0.0.1:${SERVERS[route.app].port}`,
        });
      }
    }
    console.log(`Checking ${jobs.length} page/viewport pairs with ${args.workers} workers`);
    const browser = await chromium.launch({ headless: true });
    const findings = [];
    let cursor = 0;
    let done = 0;
    async function worker() {
      while (cursor < jobs.length) {
        const job = jobs[cursor++];
        const found = await auditPage(browser, job);
        findings.push(...found);
        done += 1;
        if (done % 25 === 0 || done === jobs.length) {
          console.log(`  ${done}/${jobs.length}  open-so-far ${findings.filter((f) => decorate(f).status === "open").length}`);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.max(1, args.workers) }, () => worker()));
    await browser.close();

    const payload = writeReports(OUT, findings, {
      routes: routes.length,
      viewports: args.viewports.map((v) => v.name),
      apps: args.apps,
      workers: args.workers,
    });
    if (args.baseline) {
      fs.copyFileSync(path.join(OUT, "report.json"), path.join(OUT, "baseline.json"));
    }
    console.log(`Open ${payload.counts.open} · accepted ${payload.counts.accepted}`);
    console.log(`Report ${path.join(OUT, "report.md")}`);
    if (payload.counts.open > 0) process.exitCode = 1;
  } finally {
    stop();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
