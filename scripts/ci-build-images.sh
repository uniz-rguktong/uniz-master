#!/usr/bin/env bash
# Build and push changed UniZ service images to GHCR (GitHub Actions).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

export DEPLOY_CONTEXT="${DEPLOY_CONTEXT:-GITHUB_ACTIONS}"
export DOCKER_BUILDKIT=1

IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"
DEPLOY_TAG="${DEPLOY_TAG:-${GITHUB_SHA:-}}"
if [ -z "$DEPLOY_TAG" ]; then
  echo "[Error] DEPLOY_TAG or GITHUB_SHA is required"
  exit 1
fi
SHORT_TAG="${DEPLOY_TAG:0:7}"
BRANCH_TAG="${GITHUB_REF_NAME:-main}"
BRANCH_TAG="${BRANCH_TAG//\//-}"

deploy_detect_changes "${COMMIT_MSG:-}"

declare -A BUILT_IMAGES=()
REBUILT_COUNT=0

for s in "${UNIZ_SERVICES[@]}"; do
  IFS=':' read -r DIR IMG _DEP _CON <<< "$s"

  if ! service_needs_ghcr_build "$DIR" "$IMG" "$SHORT_TAG"; then
    echo "[Skip] No changes for $DIR — skip GHCR build."
    continue
  fi

  if [ -n "${BUILT_IMAGES[$IMG]:-}" ]; then
    echo "[Skip] Already built $IMG for this run."
    continue
  fi

  resolve_build_paths "$DIR"

  if [ ! -d "$BUILD_CONTEXT" ]; then
    echo "[Skip] Directory $BUILD_CONTEXT not found — skip $IMG"
    continue
  fi
  if [ ! -f "$DOCKERFILE" ]; then
    echo "[Skip] Dockerfile not found at $DOCKERFILE — skip $IMG"
    continue
  fi

  LOCAL_TAG="build-${SHORT_TAG}"
  REMOTE="${IMAGE_REGISTRY}/${IMG}"
  echo "[Build] $IMG -> ${REMOTE}:${SHORT_TAG} (context=$BUILD_CONTEXT, dockerfile=$DOCKERFILE)"

  service_build_args "$DIR"

  docker build --platform linux/amd64 \
    $BUILD_ARGS \
    -f "$DOCKERFILE" \
    -t "${IMG}:${LOCAL_TAG}" \
    "$BUILD_CONTEXT"

  docker tag "${IMG}:${LOCAL_TAG}" "${REMOTE}:${SHORT_TAG}"
  docker tag "${IMG}:${LOCAL_TAG}" "${REMOTE}:${BRANCH_TAG}"

  docker push "${REMOTE}:${SHORT_TAG}"
  docker push "${REMOTE}:${BRANCH_TAG}"

  BUILT_IMAGES[$IMG]="$SHORT_TAG"
  ((REBUILT_COUNT++)) || true
  echo "[Push] ${REMOTE}:${SHORT_TAG} and :${BRANCH_TAG}"
done

echo "[Build] Pushed $REBUILT_COUNT image(s) to ${IMAGE_REGISTRY}."
