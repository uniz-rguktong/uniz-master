#!/usr/bin/env bash
# Emit GitHub Actions matrix JSON for parallel GHCR image builds.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

export DEPLOY_CONTEXT="${DEPLOY_CONTEXT:-GITHUB_ACTIONS}"
DEPLOY_TAG="${DEPLOY_TAG:-${GITHUB_SHA:-}}"
if [ -z "$DEPLOY_TAG" ]; then
  echo "[Error] DEPLOY_TAG or GITHUB_SHA is required"
  exit 1
fi
SHORT_TAG="${DEPLOY_TAG:0:7}"

deploy_detect_changes "${COMMIT_MSG:-$(git log -1 --pretty=%B)}"

declare -A SEEN=()
items=()
for s in "${UNIZ_SERVICES[@]}"; do
  IFS=':' read -r DIR IMG _DEP _CON <<< "$s"
  [ -n "${SEEN[$IMG]:-}" ] && continue
  if service_needs_ghcr_build "$DIR" "$IMG" "$SHORT_TAG"; then
    SEEN[$IMG]=1
    items+=("{\"dir\":\"${DIR}\",\"img\":\"${IMG}\"}")
    echo "[Plan] Will build $IMG (dir=$DIR)"
  fi
done

if [ ${#items[@]} -eq 0 ]; then
  echo "[Plan] No images to build this run."
  echo "has_builds=false" >> "${GITHUB_OUTPUT:?GITHUB_OUTPUT required}"
  {
    echo "matrix<<EOF"
    echo '{"include":[]}'
    echo "EOF"
  } >> "$GITHUB_OUTPUT"
  exit 0
fi

json="{\"include\":[$(IFS=,; echo "${items[*]}")]}"
echo "[Plan] ${#items[@]} image(s) queued for parallel build."
echo "has_builds=true" >> "$GITHUB_OUTPUT"
{
  echo "matrix<<EOF"
  echo "$json"
  echo "EOF"
} >> "$GITHUB_OUTPUT"
