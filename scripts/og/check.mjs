/**
 * Asserts crawler-visible tags for key routes.
 * Builds a temporary dist from the route map, then fetches each path
 * the way a link-preview crawler would (no JavaScript).
 */
import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MARK_END, MARK_START, matchRule, normalizePath, parseTags, pngSize } from "./html.mjs";
import { prerender } from "./prerender.mjs";

const REQUIRED = [
  "title",
  "description",
  "og:title",
  "og:description",
  "og:image",
  "og:url",
  "og:type",
  "og:site_name",
  "twitter:card",
  "twitter:title",
  "twitter:description",
  "twitter:image",
  "canonical",
  "theme-color",
];

function existingHtml(dist, pathname) {
  if (pathname === "/") {
    const index = path.join(dist, "index.html");
    return existsSync(index) ? index : null;
  }
  const nested = path.join(dist, pathname, "index.html");
  if (existsSync(nested)) return nested;
  const flat = path.join(dist, `${pathname}.html`);
  if (existsSync(flat)) return flat;
  return null;
}

function redirectFile(dist, pathname, rules) {
  for (const rule of rules) {
    if (matchRule(rule.from, pathname)) {
      const file = path.join(dist, rule.to.replace(/^\//, ""));
      if (existsSync(file)) return file;
    }
  }
  return null;
}

export function resolveHtml(dist, urlPath, rules, mode) {
  const pathname = normalizePath(urlPath);
  if (mode === "redirect") {
    return (
      redirectFile(dist, pathname, rules) ||
      existingHtml(dist, pathname) ||
      path.join(dist, "index.html")
    );
  }
  return (
    existingHtml(dist, pathname) ||
    redirectFile(dist, pathname, rules) ||
    path.join(dist, "index.html")
  );
}

function problemsFor(html, meta, check) {
  const tags = parseTags(html);
  const problems = [];
  for (const key of REQUIRED) {
    if (!tags[key]) problems.push(`missing ${key}`);
  }
  if (tags.title !== meta.title) problems.push(`title "${tags.title}"`);
  if (tags["og:title"] !== meta.title) problems.push(`og:title "${tags["og:title"]}"`);
  if (tags["og:description"] !== meta.description) problems.push("og:description");
  if (tags.description !== meta.description) problems.push("description");
  if (tags["og:image"] !== meta.image) problems.push(`og:image "${tags["og:image"]}"`);
  if (tags["twitter:image"] !== meta.image) problems.push("twitter:image");
  if (tags["og:url"] !== meta.url) problems.push(`og:url "${tags["og:url"]}"`);
  if (tags.canonical !== meta.url) problems.push(`canonical "${tags.canonical}"`);
  if (tags["og:type"] !== meta.type) problems.push(`og:type "${tags["og:type"]}"`);
  if (tags["og:site_name"] !== meta.siteName) problems.push(`og:site_name "${tags["og:site_name"]}"`);
  if (tags["twitter:card"] !== "summary_large_image") problems.push("twitter:card");
  if (tags["og:image:width"] !== "1200" || tags["og:image:height"] !== "630") {
    problems.push("og:image dimensions");
  }
  if (tags["og:image:type"] !== "image/png") problems.push("og:image:type");
  if (tags["theme-color"] !== meta.themeColor) problems.push("theme-color");
  if (!tags["og:image"]?.startsWith("https://")) problems.push("og:image is not absolute");
  if (tags.robots !== meta.robots) problems.push(`robots "${tags.robots}"`);
  if (check.leak && html.includes(check.leak)) problems.push(`leaked ${check.leak}`);
  if (check.forbid) {
    const visible = [
      tags["og:title"],
      tags["og:description"],
      tags["og:site_name"],
      tags["og:image"],
      tags["og:image:alt"],
      tags["twitter:title"],
      tags["twitter:description"],
    ].join("\n");
    if (new RegExp(check.forbid, "i").test(visible)) {
      problems.push(`forbidden ${check.forbid}`);
    }
  }
  return problems;
}

async function listen(dist, rules) {
  const server = createServer((req, res) => {
    const file = resolveHtml(dist, req.url || "/", rules, "static");
    readFile(file)
      .then((body) => {
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=60",
        });
        res.end(body);
      })
      .catch((error) => {
        res.writeHead(500, { "content-type": "text/plain" });
        res.end(String(error));
      });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function assertPngs(pngDir) {
  const names = (await readdir(pngDir)).filter((name) => name.endsWith(".png"));
  if (!names.length) throw new Error(`No PNG files in ${pngDir}`);
  const problems = [];
  for (const name of names) {
    const file = path.join(pngDir, name);
    const buffer = await readFile(file);
    const { width, height } = pngSize(buffer);
    if (width !== 1200 || height !== 630) {
      problems.push(`${name} is ${width}x${height}`);
    }
    if (buffer.length > 300 * 1024) {
      problems.push(`${name} is ${buffer.length} bytes`);
    }
  }
  if (problems.length) {
    throw new Error(problems.join("\n"));
  }
  return names.length;
}

export async function runDistCheck(dist, routes) {
  const rules = routes.redirectRules();
  const server = await listen(dist, rules);
  const failures = [];
  try {
    for (const check of routes.checks) {
      const requestPath = check.path.startsWith("/") ? check.path : `/${check.path}`;
      const meta = routes.resolve(requestPath);
      const response = await fetch(`${server.origin}${requestPath}`, {
        headers: { "user-agent": "Twitterbot/1.0" },
      });
      if (!response.ok) failures.push(`${requestPath}: HTTP ${response.status}`);
      const html = await response.text();
      const fetched = problemsFor(html, meta, check);
      if (fetched.length) failures.push(`${requestPath}: ${fetched.join(", ")}`);
      for (const mode of ["static", "redirect"]) {
        const file = resolveHtml(dist, requestPath, rules, mode);
        const disk = await readFile(file, "utf8");
        const diskProblems = problemsFor(disk, meta, check);
        if (diskProblems.length) {
          failures.push(`${requestPath} (${mode} ${file}): ${diskProblems.join(", ")}`);
        }
      }
    }
  } finally {
    await server.close();
  }
  if (failures.length) throw new Error(failures.join("\n"));
  return routes.checks.length;
}

export async function runCheck(routes, { pngDir }) {
  await assertPngs(pngDir);
  const appDir = await mkdtemp(path.join(os.tmpdir(), "og-check-"));
  const dist = path.join(appDir, "dist");
  await mkdir(dist);
  const fixture = `<!doctype html><html lang="en"><head>
    ${MARK_START}
    <title>placeholder</title>
    ${MARK_END}
    </head><body><div id="root"></div></body></html>`;
  await writeFile(path.join(dist, "index.html"), fixture);
  await prerender({ appDir, routes });

  const rules = routes.redirectRules();
  const server = await listen(dist, rules);
  const failures = [];
  try {
    for (const check of routes.checks) {
      const requestPath = check.path.startsWith("/") ? check.path : `/${check.path}`;
      const meta = routes.resolve(requestPath);
      const response = await fetch(`${server.origin}${requestPath}`, {
        headers: { "user-agent": "facebookexternalhit/1.1" },
      });
      const html = await response.text();
      const fetched = problemsFor(html, meta, check);
      if (fetched.length) {
        failures.push(`${requestPath}: ${fetched.join(", ")}`);
      }
      for (const mode of ["static", "redirect"]) {
        const file = resolveHtml(dist, requestPath, rules, mode);
        const disk = await readFile(file, "utf8");
        const diskProblems = problemsFor(disk, meta, check);
        if (diskProblems.length) {
          failures.push(`${requestPath} (${mode}): ${diskProblems.join(", ")}`);
        }
      }
    }
  } finally {
    await server.close();
  }
  if (failures.length) {
    throw new Error(failures.join("\n"));
  }
  return routes.checks.length;
}
