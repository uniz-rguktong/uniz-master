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
  BUILD_CONTEXT="apps/$DIR"
  DOCKERFILE="$BUILD_CONTEXT/Dockerfile"
  [[ "$DIR" == *"infra"* ]] && BUILD_CONTEXT="$DIR"

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
  if [ "$DEPLOY_CONTEXT" = "GITHUB_ACTIONS" ] && [ -n "${DEPLOY_BEFORE_SHA:-}" ] \
    && [ "$DEPLOY_BEFORE_SHA" != "0000000000000000000000000000000000000000" ]; then
    LAST_SHA="$DEPLOY_BEFORE_SHA"
    echo "[Git] Using GitHub push before-SHA for change detection: ${LAST_SHA:0:7}"
  elif [ -f "$STATE_FILE" ]; then
    LAST_SHA=$(cat "$STATE_FILE")
    echo "[Git] Using last deploy SHA: ${LAST_SHA:0:7}"
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
    if [[ "$f" =~ ^infra/ ]]; then
      mapped=$(infra_yaml_to_dir "$(basename "$f")")
      [ -n "$mapped" ] && INFRA_CHANGED_DIRS["$mapped"]=1
      if [[ "$f" =~ ^infra/core-infra/nginx/ ]]; then
        INFRA_CHANGED_DIRS["uniz-gateway"]=1
        INFRA_CHANGED_DIRS["infra/core-infra/nginx"]=1
      fi
    fi
  done <<< "$CHANGED_FILES"
}

service_should_build() {
  local DIR="$1"

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
