/**
 * Enumerate frontend routes from the router sources so the audit cannot
 * drift from a hand-maintained list. Dynamic params are filled from fixtures.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function stripComments(src) {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function unique(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.app}|${item.path}|${item.auth}|${item.empty ? "e" : ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function portalRoutes() {
  const app = stripComments(read("apps/uniz-portal/src/App.tsx"));
  const declared = [...app.matchAll(/\bpath\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);

  const sections = stripComments(read("apps/uniz-portal/src/utils/adminSectionRoutes.ts"));
  const sectionPaths = [];
  for (const match of sections.matchAll(/^\s*[A-Za-z0-9_]+\s*:\s*"([^"]*)"/gm)) {
    const segment = match[1];
    sectionPaths.push(segment ? `/admin/${segment}` : "/admin");
  }

  const concrete = [];
  for (const raw of [...declared, ...sectionPaths]) {
    if (raw === "*") {
      concrete.push("/this-page-does-not-exist");
      continue;
    }
    if (raw.includes("*")) {
      if (raw === "/admin/*" || raw === "admin/*") concrete.push("/admin/not-a-section");
      else if (raw.startsWith("/blog")) concrete.push("/blog/campus-notes");
      else concrete.push(raw.replace(/\/?\*$/, "/sample").replace(/^\//, "/") || "/sample");
      continue;
    }
    if (raw.includes(":")) continue;
    concrete.push(raw.startsWith("/") ? raw : `/${raw}`);
  }

  return unique(
    concrete.map((routePath) => ({
      app: "portal",
      path: routePath,
      auth: portalAuth(routePath),
      empty: false,
    })),
  );
}

function portalAuth(routePath) {
  if (routePath === "/student/signin" || routePath === "/admin/signin") return "public";
  if (routePath === "/student" || routePath.startsWith("/student/")) return "student";
  if (routePath === "/admin" || routePath.startsWith("/admin/")) return "admin";
  if (routePath === "/faculty" || routePath.startsWith("/faculty/")) return "faculty";
  return "public";
}

function landingPathsFromNav() {
  const nav = read("apps/uniz-landing/src/data/nav.ts");
  return [...nav.matchAll(/\bto:\s*"([^"]+)"/g)].map((m) => m[1]).filter((p) => p.startsWith("/"));
}

function landingDeclared() {
  const app = stripComments(read("apps/uniz-landing/src/App.tsx"));
  const paths = [];
  for (const match of app.matchAll(/\bpath\s*=\s*"([^"]+)"/g)) {
    const raw = match[1];
    if (raw === "*") paths.push("/this-page-does-not-exist");
    else if (raw.includes("*")) paths.push(`/${raw.replace(/^\//, "").replace(/\/?\*$/, "/sample")}`);
    else if (!raw.includes(":")) paths.push(raw === "" ? "/" : `/${raw.replace(/^\//, "")}`);
  }
  // Index route is `index` with no path attribute.
  if (app.includes("<Route index")) paths.push("/");
  return paths;
}

const DEPTS = [
  "CSE",
  "CIVIL",
  "ECE",
  "EEE",
  "ME",
  "MATHEMATICS",
  "PHYSICS",
  "CHEMISTRY",
  "IT",
  "BIOLOGY",
  "ENGLISH",
  "LIB",
  "MANAGEMENT",
  "PED",
  "TELUGU",
  "YOGA",
];

export function landingRoutes() {
  const paths = [...landingDeclared(), ...landingPathsFromNav()];
  for (const dept of DEPTS) {
    paths.push(`/departments/${dept}`);
    paths.push(`/departments/${dept}/faculty/0`);
  }
  const routes = paths.map((routePath) => ({
    app: "landing",
    path: routePath,
    auth: "public",
    empty: false,
  }));
  routes.push({
    app: "landing",
    path: "/departments/YOGA",
    auth: "public",
    empty: true,
  });
  routes.push({
    app: "landing",
    path: "/notifications/news",
    auth: "public",
    empty: true,
  });
  return unique(routes);
}

function walkMarkdown(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".vitepress" || entry.name === "api" && false) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".vitepress" || entry.name === "scripts") continue;
      walkMarkdown(full, acc);
    } else if (entry.name.endsWith(".md")) {
      acc.push(full);
    }
  }
  return acc;
}

export function docsRoutes() {
  const docsRoot = path.join(ROOT, "apps/uniz-docs");
  const skip = new Set(["README.md", "AGENTS.md", "CONTRIBUTING.md", "_sidebar.md"]);
  const routes = [];
  for (const file of walkMarkdown(docsRoot)) {
    const base = path.basename(file);
    if (skip.has(base)) continue;
    const rel = path.relative(docsRoot, file).replace(/\\/g, "/").replace(/\.md$/, "");
    const slug = rel.replace(/(^|\/)index$/, "").replace(/\/$/, "");
    routes.push({
      app: "docs",
      path: slug ? `/docs/${slug}` : "/docs/",
      auth: "public",
      empty: false,
    });
  }
  return unique(routes);
}

export function allRoutes() {
  return [...portalRoutes(), ...landingRoutes(), ...docsRoutes()];
}

/** Extra visits that force the mocked API into an empty list. */
export function withEmptyVariants(routes) {
  const extras = [];
  for (const route of routes) {
    if (route.app !== "portal") continue;
    if (
      route.path === "/admin/students" ||
      route.path === "/admin/faculty" ||
      route.path === "/admin/staff/roles" ||
      route.path === "/student/notifications" ||
      route.path === "/student/grievance"
    ) {
      extras.push({ ...route, empty: true });
    }
  }
  return unique([...routes, ...extras]);
}
