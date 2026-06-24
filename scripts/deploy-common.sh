#!/usr/bin/env bash
# Shared UniZ deploy/build helpers — sourced by deploy.sh and ci-build-images.sh

infra_yaml_to_dir() {
  case "$1" in
    academics-service.yaml) echo "uniz-academics" ;;
    auth-service.yaml) echo "uniz-auth" ;;
    cron-service.yaml|cron-job.yaml|storage-cleanup-job.yaml) echo "uniz-cron" ;;
    docs-service.yaml) echo "uniz-docs" ;;
    files-service.yaml) echo "uniz-files" ;;
    gateway-api.yaml|gateway.yaml) echo "uniz-gateway" ;;
    mail-service.yaml) echo "uniz-mail" ;;
    notification-service.yaml) echo "uniz-notifications" ;;
    outpass-service.yaml) echo "uniz-outpass" ;;
    portal.yaml) echo "uniz-portal" ;;
    user-service.yaml) echo "uniz-user" ;;
    landing.yaml) echo "uniz-landing" ;;
    *) echo "" ;;
  esac
}

rebuild_tag_to_dir() {
  case "$1" in
    docs) echo "uniz-docs" ;;
    portal) echo "uniz-portal" ;;
    gateway) echo "uniz-gateway" ;;
    auth) echo "uniz-auth" ;;
    academics) echo "uniz-academics" ;;
    user) echo "uniz-user" ;;
    files) echo "uniz-files" ;;
    mail) echo "uniz-mail" ;;
    notifications) echo "uniz-notifications" ;;
    outpass) echo "uniz-outpass" ;;
    cron) echo "uniz-cron" ;;
    landing) echo "uniz-landing" ;;
    *) echo "" ;;
  esac
}

MONOREPO_SERVICES="uniz-academics uniz-auth uniz-user uniz-outpass uniz-files uniz-mail uniz-notifications uniz-cron uniz-gateway"

UNIZ_SERVICES=(
  "uniz-academics:uniz-academics-service:uniz-academics-service:academics-service"
  "uniz-auth:uniz-auth-service:uniz-auth-service:auth-service"
  "uniz-cron:uniz-cron-service:uniz-storage-cleanup-job:storage-cleaner"
  "uniz-cron:uniz-cron-service:uniz-cron-service:cron-worker"
  "uniz-outpass:uniz-outpass-service:uniz-maintenance-job:cron-worker"
  "uniz-files:uniz-files-service:uniz-files-service:files-service"
  "uniz-gateway:uniz-gateway-api:uniz-gateway-api:gateway-api"
  "uniz-mail:uniz-mail-service:uniz-mail-service:mail-service"
  "uniz-notifications:uniz-notification-service:uniz-notification-service:notification-service"
  "uniz-outpass:uniz-outpass-service:uniz-outpass-service:outpass-service"
  "uniz-portal:uniz-portal:uniz-portal:portal"
  "uniz-landing:uniz-landing:uniz-landing:landing"
  "uniz-docs:uniz-docs-service:uniz-docs-service:docs-service"
  "uniz-user:uniz-user-service:uniz-user-service:user-service"
  "infra/core-infra/nginx:uniz-gateway:uniz-gateway:gateway-nginx"
)

uses_monorepo_dockerfile() {
  local DIR="$1"
  echo " $MONOREPO_SERVICES " | grep -q " $DIR "
}

resolve_build_paths() {
  local DIR="$1"
  if [[ "$DIR" == *"infra"* ]]; then
    BUILD_CONTEXT="$DIR"
    DOCKERFILE="$DIR/Dockerfile"
  else
    BUILD_CONTEXT="apps/$DIR"
    DOCKERFILE="$BUILD_CONTEXT/Dockerfile"
  fi

  if uses_monorepo_dockerfile "$DIR"; then
    BUILD_CONTEXT="."
    DOCKERFILE="docker/Dockerfile.service"
    return
  fi

  if [[ "$DIR" == "uniz-docs" ]] && [ -f "apps/uniz-docs/Dockerfile" ]; then
    if ! grep -q '@uniz/shared' "apps/uniz-docs/package.json" 2>/dev/null; then
      BUILD_CONTEXT="apps/uniz-docs"
      DOCKERFILE="apps/uniz-docs/Dockerfile"
    fi
  fi
}

ghcr_image_ref() {
  local IMG="$1"
  local TAG="$2"
  echo "${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}/${IMG}:${TAG}"
}

ghcr_image_exists() {
  local IMG="$1"
  local TAG="$2"
  [ -z "$IMG" ] || [ -z "$TAG" ] && return 1
  docker manifest inspect "$(ghcr_image_ref "$IMG" "$TAG")" >/dev/null 2>&1
}

service_dir_changed_between() {
  local DIR="$1"
  local FROM_SHA="$2"
  local TO_SHA="$3"
  [ -z "$FROM_SHA" ] || [ -z "$TO_SHA" ] && return 1
  git diff --name-only "$FROM_SHA" "$TO_SHA" 2>/dev/null | grep -q "^apps/$DIR/"
}

deployed_image_baseline_sha() {
  local IMG="$1"
  local MANIFEST="${K8S_IMAGE_MANIFEST:-.uniz-k8s-image-tags.json}"
  if [ -f "$MANIFEST" ] && command -v jq >/dev/null 2>&1; then
    local tag
    tag=$(jq -r --arg img "$IMG" '.[$img] // empty' "$MANIFEST" 2>/dev/null || true)
    if [ -n "$tag" ] && [ "$tag" != "null" ] && [[ "$tag" =~ ^[0-9a-f]{7,40}$ ]]; then
      echo "$tag"
      return 0
    fi
  fi
  return 1
}

# Populates globals used by service_should_build: CHANGED_FILES, FORCE_ALL,
# SCOPED_BUILD_DIRS, SCOPED_REBUILD, NEW_HEAD, LAST_SHA, BUILD_MSG
deploy_detect_changes() {
  local extra_msg="${*:-}"
  NEW_HEAD=$(git rev-parse HEAD)
  if [ -n "${DEPLOY_SHA:-}" ]; then
    NEW_HEAD="$DEPLOY_SHA"
  fi

  COMMIT_MSG=$(git log -1 --pretty=%B)
  BUILD_MSG="$COMMIT_MSG $extra_msg"

  FORCE_ALL=false
  if [[ "$BUILD_MSG" == *"[rebuild all]"* ]] || [[ "$BUILD_MSG" == *"[force build]"* ]]; then
    echo "[Build] Force rebuild all requested."
    FORCE_ALL=true
  fi

  declare -gA SCOPED_BUILD_DIRS=()
  SCOPED_REBUILD=false

  if [ -n "${SERVICES:-}" ]; then
    SCOPED_REBUILD=true
    for tag in $SERVICES; do
      dir=$(rebuild_tag_to_dir "$tag")
      [ -z "$dir" ] && dir="$tag"
      SCOPED_BUILD_DIRS["$dir"]=1
      echo "[Build] SERVICE override: $tag -> $dir"
    done
  else
    for tag in docs portal gateway auth academics user files mail notifications outpass cron landing; do
      if [[ "$BUILD_MSG" == *"[rebuild $tag]"* ]]; then
        dir=$(rebuild_tag_to_dir "$tag")
        if [ -n "$dir" ]; then
          SCOPED_BUILD_DIRS["$dir"]=1
          SCOPED_REBUILD=true
          echo "[Build] Scoped rebuild tag: [rebuild $tag] -> $dir"
        fi
      fi
    done
  fi

  if [ "$SCOPED_REBUILD" == "true" ]; then
    echo "[Build] Scoped rebuild active — only tagged services will build."
  fi

  STATE_FILE="${STATE_FILE:-/root/.uniz_last_deploy_sha}"
  LAST_SHA=""
  # Diff from last *successful* deploy — not merely the previous git push.
  # Using push before-SHA alone misses services when a prior deploy failed or only
  # partially rolled out (e.g. fix commit after a failed image build).
  if [ -f "$STATE_FILE" ]; then
    LAST_SHA=$(tr -d '[:space:]' < "$STATE_FILE")
    echo "[Git] Using last successful deploy SHA (state): ${LAST_SHA:0:7}"
  elif [ -n "${LAST_SUCCESSFUL_DEPLOY_SHA:-}" ]; then
    LAST_SHA="$LAST_SUCCESSFUL_DEPLOY_SHA"
    echo "[Git] Using last successful deploy SHA (cache): ${LAST_SHA:0:7}"
  elif [ "$DEPLOY_CONTEXT" = "GITHUB_ACTIONS" ] && [ -n "${DEPLOY_BEFORE_SHA:-}" ] \
    && [ "$DEPLOY_BEFORE_SHA" != "0000000000000000000000000000000000000000" ]; then
    LAST_SHA="$DEPLOY_BEFORE_SHA"
    echo "[Git] Using GitHub push before-SHA (fallback): ${LAST_SHA:0:7}"
  fi
  [ -z "$LAST_SHA" ] && LAST_SHA="HEAD~1"

  echo "[Git] Diffing from $LAST_SHA to $NEW_HEAD"
  CHANGED_FILES=$(git diff --name-only "$LAST_SHA" "$NEW_HEAD" 2>/dev/null || echo "")
  if [ -n "$CHANGED_FILES" ]; then
    echo "[Git] Changed files:"
    echo "$CHANGED_FILES" | sed 's/^/  /'
  else
    echo "[Git] No file diff (infra apply + health verify still run)"
  fi

  declare -gA INFRA_CHANGED_DIRS=()
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    # Only infra that changes container image contents should trigger GHCR rebuilds.
    # Kubernetes deployment/HPA/replica YAML is applied via kubectl — not baked into images.
    if [[ "$f" =~ ^infra/core-infra/nginx/ ]]; then
      INFRA_CHANGED_DIRS["uniz-gateway"]=1
      INFRA_CHANGED_DIRS["infra/core-infra/nginx"]=1
    fi
  done <<< "$CHANGED_FILES"
}

service_should_build() {
  local DIR="$1"
  local IMG="${2:-}"

  if [ "$FORCE_ALL" == "true" ]; then
    return 0
  fi

  if [ "$SCOPED_REBUILD" == "true" ]; then
    [ -n "${SCOPED_BUILD_DIRS[$DIR]:-}" ] && return 0
    return 1
  fi

  if [ -n "$CHANGED_FILES" ] && echo "$CHANGED_FILES" | grep -qE '^packages/uniz-shared/|^packages/@uniz/shared'; then
    if echo " $MONOREPO_SERVICES " | grep -q " $DIR "; then
      return 0
    fi
  fi
  if [ -n "$CHANGED_FILES" ] && echo "$CHANGED_FILES" | grep -qE '^package\.json$|^package-lock\.json$|^docker/Dockerfile\.service$'; then
    if echo " $MONOREPO_SERVICES " | grep -q " $DIR "; then
      return 0
    fi
  fi

  if [ -n "$CHANGED_FILES" ] && echo "$CHANGED_FILES" | grep -q "^apps/$DIR/"; then
    return 0
  fi

  if [ -n "${INFRA_CHANGED_DIRS[$DIR]:-}" ]; then
    return 0
  fi

  # Catch-up: service code changed since what is actually running on the VPS.
  if [ -n "$IMG" ] && [ -n "${NEW_HEAD:-}" ]; then
    local baseline=""
    baseline=$(deployed_image_baseline_sha "$IMG" 2>/dev/null || true)
    if [ -n "$baseline" ] && service_dir_changed_between "$DIR" "$baseline" "$NEW_HEAD"; then
      echo "[Build] $DIR changed since deployed image $IMG:$baseline — rebuild required."
      return 0
    fi
  fi

  return 1
}

# GHCR image build gate — also build when HEAD tag is missing but source changed.
service_needs_ghcr_build() {
  local DIR="$1"
  local IMG="$2"
  local SHORT_TAG="${3:-${DEPLOY_SHA:0:7}}"

  if service_should_build "$DIR" "$IMG"; then
    return 0
  fi

  if [ -n "$SHORT_TAG" ] && ! ghcr_image_exists "$IMG" "$SHORT_TAG"; then
    local baseline="${LAST_SHA:-}"
    local deployed=""
    deployed=$(deployed_image_baseline_sha "$IMG" 2>/dev/null || true)
    [ -n "$deployed" ] && baseline="$deployed"
    if [ -n "$baseline" ] && [ -n "${NEW_HEAD:-}" ] \
      && service_dir_changed_between "$DIR" "$baseline" "$NEW_HEAD"; then
      echo "[Build] Missing GHCR image $IMG:$SHORT_TAG with pending $DIR changes — rebuilding."
      return 0
    fi
  fi

  return 1
}

service_build_args() {
  local DIR="$1"
  BUILD_ARGS=""
  if uses_monorepo_dockerfile "$DIR"; then
    WORKSPACE_NAME=$(node -p "require('./apps/$DIR/package.json').name")
    BUILD_ARGS="--build-arg SERVICE_DIR=apps/$DIR --build-arg WORKSPACE_NAME=$WORKSPACE_NAME"
  elif [[ "$DIR" == "uniz-portal" ]]; then
    BUILD_ARGS="--build-arg VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY:-} --build-arg VITE_API_URL=${VITE_API_URL:-} --build-arg VITE_CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME:-} --build-arg VITE_CLOUDINARY_UPLOAD_PRESET=${CLOUDINARY_UPLOAD_PRESET:-} --build-arg VITE_ANALYTICS_URL=${VITE_ANALYTICS_URL:-} --build-arg VITE_ANALYTICS_KEY=${VITE_ANALYTICS_API_KEY:-} --build-arg VITE_SCRAPER_URL=${VITE_SCRAPER_URL:-}"
  fi
}
