/**
 * After `vitepress build`, fetch a few pages the way a crawler would
 * and assert site-wide image tags plus a per-page title.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Vendored from scripts/og so the app-directory Docker context can build.
import { parseTags, pngSize } from "./og/html.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, ".vitepress/dist");
const png = await readFile(path.join(root, "public/og.png"));
const size = pngSize(png);
if (size.width !== 1200 || size.height !== 630) {
  throw new Error(`docs og.png is ${size.width}x${size.height}`);
}
if (png.length > 300 * 1024) {
  throw new Error(`docs og.png is ${png.length} bytes`);
}

const pages = [
  { file: "index.html", title: "UniZ Documentation | UniZ" },
  { file: "introduction.html", title: "Introduction | UniZ" },
  { file: "system/overview.html", title: "System overview | UniZ" },
  { file: "api/auth/login.html", title: "Login | UniZ" },
];

function fileFor(urlPath) {
  const clean = urlPath.replace(/^\//, "").replace(/\/$/, "");
  const nested = path.join(dist, clean, "index.html");
  if (existsSync(nested)) return nested;
  const flat = path.join(dist, `${clean}.html`);
  if (existsSync(flat)) return flat;
  if (clean === "" && existsSync(path.join(dist, "index.html"))) {
    return path.join(dist, "index.html");
  }
  return null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const rel = url.pathname.replace(/^\/docs\/?/, "");
  const file = fileFor(rel);
  if (!file) {
    res.writeHead(404);
    res.end("missing");
    return;
  }
  readFile(file).then((body) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
  });
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const port = typeof address === "object" && address ? address.port : 0;

const failures = [];
try {
  for (const page of pages) {
    const route = page.file === "index.html" ? "/docs/" : `/docs/${page.file.replace(/\.html$/, "")}`;
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
      headers: { "user-agent": "facebookexternalhit/1.1" },
    });
    const html = await response.text();
    const tags = parseTags(html);
    const expect = [
      ["og:title", page.title],
      ["og:site_name", "UniZ Docs"],
      ["og:image", "https://api-uniz.rguktong.in/docs/og.png"],
      ["og:image:width", "1200"],
      ["og:image:height", "630"],
      ["twitter:card", "summary_large_image"],
      ["theme-color", "#0b1b3a"],
    ];
    for (const [key, value] of expect) {
      if (tags[key] !== value) failures.push(`${route} ${key}: "${tags[key] || ""}"`);
    }
    if (!tags["og:description"]) failures.push(`${route} missing og:description`);
    if (!tags.canonical?.startsWith("https://api-uniz.rguktong.in/docs")) {
      failures.push(`${route} canonical "${tags.canonical || ""}"`);
    }
    if (!html.includes('rel="apple-touch-icon"')) failures.push(`${route} missing apple-touch-icon`);
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  throw new Error(failures.join("\n"));
}
console.log(`docs open graph ok (${pages.length} pages)`);
