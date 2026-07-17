#!/usr/bin/env node
/**
 * VitePress 1.6.x still nests vite@5 + esbuild@0.21 even with npm overrides.
 * Remove the nested copies so resolution uses the hoisted patched vite (6.4.3+).
 * Dev-only; production docs build is static VitePress output.
 */
const fs = require("fs");
const path = require("path");

const nested = path.join(__dirname, "../../node_modules/vitepress/node_modules");
if (!fs.existsSync(nested)) process.exit(0);

const remove = (name) => {
  const target = path.join(nested, name);
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`[postinstall] pruned vitepress nested ${name}`);
};

remove("vite");
remove("esbuild");

for (const entry of fs.readdirSync(nested)) {
  if (entry.startsWith("@esbuild")) {
    fs.rmSync(path.join(nested, entry), { recursive: true, force: true });
    console.log(`[postinstall] pruned vitepress nested ${entry}`);
  }
}
