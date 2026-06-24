#!/usr/bin/env bash
# Point all k8s workloads at ghcr.io/...:$TAG (images must already exist in GHCR).
set -euo pipefail

TAG="${1:?usage: sync-ghcr-deployments.sh <7-char-sha>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

export USE_GHCR=true
export IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"

if [ -f /root/uniz-secrets.env ]; then
  # shellcheck source=/dev/null
  set -a && source /root/uniz-secrets.env && set +a
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
      '{"spec":{"template":{"spec":{"containers":[{"name":"'"$CON"'","imagePullPolicy":"Always"}]}}}}' \
      2>/dev/null || true
    kubectl patch "deployment/$DEP" --type=merge -p "$pull_patch" 2>/dev/null || true
  fi
}

declare -A SEEN=()
for s in "${UNIZ_SERVICES[@]}"; do
  IFS=':' read -r _DIR IMG DEP CON <<< "$s"
  key="${DEP}:${CON}"
  [ -n "${SEEN[$key]:-}" ] && continue
  SEEN[$key]=1
  FULL=$(ghcr_image_ref "$IMG" "$TAG")
  echo "[Sync] $DEP -> $FULL"
  if [[ "$DEP" == *"job"* ]]; then
    kubectl get cronjob "$DEP" &>/dev/null && apply_image "$DEP" "$CON" "$FULL"
  elif kubectl get deployment "$DEP" &>/dev/null; then
    apply_image "$DEP" "$CON" "$FULL"
  fi
done

echo "[Sync] Done — tagged workloads to :$TAG"
