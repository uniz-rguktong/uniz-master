#!/usr/bin/env bash
# Write JSON map of GHCR/local image tags currently running on the cluster.
set -euo pipefail

# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

OUT="${1:-/root/.uniz_k8s_image_tags.json}"
KUBECONFIG="${KUBECONFIG:-/etc/rancher/k3s/k3s.yaml}"

pairs=()
for s in "${UNIZ_SERVICES[@]}"; do
  IFS=':' read -r _DIR IMG DEP CON <<< "$s"
  [[ "$DEP" == *"job"* ]] && continue

  image=""
  if kubectl get deployment "$DEP" &>/dev/null; then
    image=$(kubectl get deployment "$DEP" \
      -o jsonpath="{.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null || true)
  fi
  [ -z "$image" ] && continue

  tag="${image##*:}"
  tag="${tag//@/}"
  # Accept GHCR sha tags; skip bare "local" (placeholder) — use running pod image below
  if [[ "$tag" == "local" ]]; then
    tag=""
  fi
  if [[ -z "$tag" ]] && kubectl get pods -l "app=$DEP" &>/dev/null; then
    image=$(kubectl get pods -l "app=$DEP" -o jsonpath='{.items[?(@.status.phase=="Running")].spec.containers[0].image}' 2>/dev/null | awk '{print $1}')
    tag="${image##*:}"
    tag="${tag//@/}"
  fi
  [[ -z "$tag" ]] && continue
  [[ "$tag" =~ ^[0-9a-f]{7,40}$ ]] || continue
  pairs+=("\"$IMG\":\"$tag\"")
done

{
  printf '{'
  if [ "${#pairs[@]}" -gt 0 ]; then
    IFS=,
    printf '%s' "${pairs[*]}"
  fi
  printf '}\n'
} > "$OUT"

echo "[Manifest] Wrote ${#pairs[@]} image tag(s) to $OUT"
