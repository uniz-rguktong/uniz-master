#!/usr/bin/env node
/**
 * Remove nested vulnerable vite/esbuild entries from package-lock.json
 * after pruning on disk. Keeps npm audit / Dependabot clean.
 */
const fs = require("fs");
const path = require("path");

const lockPath = path.join(__dirname, "../../package-lock.json");
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const packages = lock.packages || {};
let removed = 0;

for (const key of Object.keys(packages)) {
  if (
    key === "node_modules/vitepress/node_modules/vite" ||
    key === "node_modules/vitepress/node_modules/esbuild" ||
    key.startsWith("node_modules/vitepress/node_modules/@esbuild/")
  ) {
    delete packages[key];
    removed++;
  }
}

if (removed) {
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`[fix-vitepress-lock] removed ${removed} nested lock entries`);
}
