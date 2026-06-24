#!/usr/bin/env bash
# Build and push changed UniZ service images to GHCR (sequential fallback / local use).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

export DEPLOY_CONTEXT="${DEPLOY_CONTEXT:-GITHUB_ACTIONS}"
export DOCKER_BUILDKIT=1

DEPLOY_TAG="${DEPLOY_TAG:-${GITHUB_SHA:-}}"
if [ -z "$DEPLOY_TAG" ]; then
  echo "[Error] DEPLOY_TAG or GITHUB_SHA is required"
  exit 1
fi
SHORT_TAG="${DEPLOY_TAG:0:7}"

deploy_detect_changes "${COMMIT_MSG:-}"

declare -A BUILT_IMAGES=()
REBUILT_COUNT=0

for s in "${UNIZ_SERVICES[@]}"; do
  IFS=':' read -r DIR IMG _DEP _CON <<< "$s"
  if ! service_needs_ghcr_build "$DIR" "$IMG" "$SHORT_TAG"; then
    continue
  fi
  if [ -n "${BUILT_IMAGES[$IMG]:-}" ]; then
    continue
  fi
  bash "$(dirname "$0")/ci-build-one-image.sh" "$DIR" "$IMG"
  BUILT_IMAGES[$IMG]="$SHORT_TAG"
  ((REBUILT_COUNT++)) || true
done

echo "[Build] Pushed $REBUILT_COUNT image(s)."
