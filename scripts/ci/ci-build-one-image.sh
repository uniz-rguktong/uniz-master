#!/usr/bin/env bash
# Build and push a single UniZ image to GHCR (used by matrix workers).
set -euo pipefail

DIR="${1:?usage: ci-build-one-image.sh <service-dir> <image-name>}"
IMG="${2:?usage: ci-build-one-image.sh <service-dir> <image-name>}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=deploy-common.sh
source "$(dirname "$0")/../deploy/deploy-common.sh"

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

resolve_build_paths "$DIR"
if [ ! -d "$BUILD_CONTEXT" ]; then
  echo "[Error] Build context $BUILD_CONTEXT not found"
  exit 1
fi
if [ ! -f "$DOCKERFILE" ]; then
  echo "[Error] Dockerfile $DOCKERFILE not found"
  exit 1
fi

REMOTE="${IMAGE_REGISTRY}/${IMG}"
CACHE_REF="${REMOTE}:buildcache"
echo "[Build] $IMG -> ${REMOTE}:${SHORT_TAG} (context=$BUILD_CONTEXT)"

service_build_args "$DIR"

docker buildx build --platform linux/amd64 \
  --cache-from "type=registry,ref=${CACHE_REF}" \
  --cache-to "type=registry,ref=${CACHE_REF},mode=max" \
  $BUILD_ARGS \
  -f "$DOCKERFILE" \
  -t "${REMOTE}:${SHORT_TAG}" \
  -t "${REMOTE}:${BRANCH_TAG}" \
  --push \
  "$BUILD_CONTEXT"

echo "[Push] ${REMOTE}:${SHORT_TAG} and :${BRANCH_TAG}"
