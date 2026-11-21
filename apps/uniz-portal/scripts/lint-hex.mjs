import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("src");
const allow = new Set([path.normalize("src/index.css")]);
const hex = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await files(full)));
    } else if (entry.isFile()) {
      found.push(full);
    }
  }
  return found;
}

const hits = [];
for (const file of await files(root)) {
  const rel = path.normalize(path.relative(process.cwd(), file));
  if (allow.has(rel) || rel.endsWith(".svg")) continue;
  const text = await readFile(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, index) => {
    hex.lastIndex = 0;
    if (hex.test(line)) hits.push(`${rel}:${index + 1}: ${line.trim()}`);
  });
}

if (hits.length) {
  console.error("Raw hex in apps/uniz-portal/src (allowed only in src/index.css and SVG logo sources):");
  hits.forEach((hit) => console.error(hit));
  process.exit(1);
}

console.log("lint:hex ok");
