/**
 * App Dockerfiles build with the app directory as context, so each app
 * vendors the modules it imports. These copies must stay byte-identical
 * to the canonical files in scripts/og.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const COPIES = [
  ["html.mjs", "apps/uniz-landing/scripts/og/html.mjs"],
  ["prerender.mjs", "apps/uniz-landing/scripts/og/prerender.mjs"],
  ["check.mjs", "apps/uniz-landing/scripts/og/check.mjs"],
  ["html.mjs", "apps/uniz-portal/scripts/og/html.mjs"],
  ["prerender.mjs", "apps/uniz-portal/scripts/og/prerender.mjs"],
  ["check.mjs", "apps/uniz-portal/scripts/og/check.mjs"],
  ["html.mjs", "apps/uniz-docs/scripts/og/html.mjs"],
];

export function assertOgCopies() {
  const drifted = [];
  for (const [name, rel] of COPIES) {
    const canonical = readFileSync(path.join(root, "scripts/og", name), "utf8");
    const vendored = readFileSync(path.join(root, rel), "utf8");
    if (canonical !== vendored) drifted.push(`${rel} (canonical scripts/og/${name})`);
  }
  if (drifted.length) {
    throw new Error(
      "Vendored Open Graph modules drifted. Copy the canonical file over:\n" +
        drifted.join("\n"),
    );
  }
}
