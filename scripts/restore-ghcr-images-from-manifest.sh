#!/usr/bin/env bash
# Re-apply GHCR image tags from /root/.uniz_k8s_image_tags.json after kubectl apply resets :local placeholders.
set -euo pipefail

MANIFEST="${1:-/root/.uniz_k8s_image_tags.json}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

export USE_GHCR=true
export IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"

if [ ! -f "$MANIFEST" ] || [ "$(tr -d '[:space:]' <"$MANIFEST")" = "{}" ]; then
  echo "[Restore] No manifest at $MANIFEST — skip."
  exit 0
fi

bash "$(dirname "$0")/ensure-ghcr-pull-secret.sh"

apply_image() {
  local DEP="$1" CON="$2" FULL="$3"
  local pull_patch='{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"ghcr-pull"}]}}}}'
  if [[ "$DEP" == *"job"* ]]; then
    kubectl set image "cronjob/$DEP" "$CON=$FULL" 2>/dev/null || true
    kubectl patch "cronjob/$DEP" --type=merge -p "$pull_patch" 2>/dev/null || true
  else
    kubectl set image "deployment/$DEP" "$CON=$FULL"
    kubectl patch "deployment/$DEP" --type=merge -p \
      '{"spec":{"template":{"spec":{"containers":[{"name":"'"$CON"'","imagePullPolicy":"IfNotPresent"}]}}}}' \
      2>/dev/null || true
    kubectl patch "deployment/$DEP" --type=merge -p "$pull_patch" 2>/dev/null || true
  fi
}

lookup_tag() {
  local img="$1"
  node -e "
    const m = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
    const t = m[process.argv[2]];
    if (t) process.stdout.write(String(t));
  " "$MANIFEST" "$img"
}

declare -A SEEN=()
restored=0
for s in "${UNIZ_SERVICES[@]}"; do
  IFS=':' read -r _DIR IMG DEP CON <<< "$s"
  key="${DEP}:${CON}"
  [ -n "${SEEN[$key]:-}" ] && continue
  SEEN[$key]=1
  TAG=$(lookup_tag "$IMG" || true)
  [ -z "$TAG" ] && continue
  FULL=$(ghcr_image_ref "$IMG" "$TAG")
  echo "[Restore] $DEP -> $FULL"
  if [[ "$DEP" == *"job"* ]]; then
    kubectl get cronjob "$DEP" &>/dev/null && apply_image "$DEP" "$CON" "$FULL"
  elif kubectl get deployment "$DEP" &>/dev/null; then
    apply_image "$DEP" "$CON" "$FULL"
    ((restored++)) || true
  fi
done

echo "[Restore] Re-applied $restored deployment image(s) from manifest."
