#!/usr/bin/env bash
# Build infra/core-infra/kubernetes/overlays/production from image manifest.
# Prevents kubectl apply from resetting deployments to uniz-*:local (ImagePullBackOff on scale-up).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

MANIFEST="${1:-/root/.uniz_k8s_image_tags.json}"
DEPLOY_SHA="${2:-}"
OVERLAY="$ROOT/infra/core-infra/kubernetes/overlays/production"
REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"

mkdir -p "$OVERLAY"

# Export service list for node (DIR:IMG:DEP:CON per line)
SERVICES_FILE=$(mktemp)
for s in "${UNIZ_SERVICES[@]}"; do
  echo "$s" >> "$SERVICES_FILE"
done

node - "$MANIFEST" "$DEPLOY_SHA" "$OVERLAY/kustomization.yaml" "$REGISTRY" "$SERVICES_FILE" <<'NODE'
const fs = require("fs");
const [manifestPath, deploySha, outPath, registry, servicesFile] =
  process.argv.slice(2);
let manifest = {};
try {
  if (manifestPath && manifestPath !== "/dev/null" && fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }
} catch (_) {}
const fallback = deploySha ? deploySha.slice(0, 7) : "";
const hardcoded = {
  "uniz-gateway": process.env.GATEWAY_NGINX_TAG || "593480a",
  "uniz-landing": process.env.LANDING_TAG || "1a6cf28",
};
const seen = new Set();
const images = [];
for (const line of fs.readFileSync(servicesFile, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const parts = line.split(":");
  const img = parts[1];
  if (!img || seen.has(img)) continue;
  seen.add(img);
  let tag = manifest[img] || hardcoded[img] || fallback;
  if (!tag) continue;
  images.push({ name: img, newName: `${registry}/${img}`, newTag: String(tag) });
}
fs.unlinkSync(servicesFile);
const yaml = [
  "apiVersion: kustomize.config.k8s.io/v1beta1",
  "kind: Kustomization",
  "resources:",
  "  - ../../base/core",
  "images:",
  ...images.flatMap((i) => [
    `  - name: ${i.name}`,
    `    newName: ${i.newName}`,
    `    newTag: "${i.newTag}"`,
  ]),
  "",
].join("\n");
fs.writeFileSync(outPath, yaml);
console.log(`[Kustomize] Wrote ${outPath} (${images.length} images)`);
NODE
