#!/bin/bash
# --- UniZ Universal Deployment (VPS Cloud V5) ---
# CI/CD Context: ${DEPLOY_CONTEXT:-"LOCAL"}

# 1. Push code to GitHub
echo "[Push] Pushing code to GitHub..."
MSG=${1:-"chore: deployment update $(date +'%Y-%m-%d %H:%M:%S')"}

# Only try to commit/push if we are NOT on the VPS and NOT in CI/CD
if [ ! -f "/root/uniz-secrets.env" ] && [ "$DEPLOY_CONTEXT" != "GITHUB_ACTIONS" ]; then
  git add .
  git commit -m "$MSG" || echo "No changes to commit"
  git push origin main
fi

# Map infra manifest basename -> app directory (single-service rebuild)
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

# Map [rebuild <tag>] commit tag -> app directory
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


# Latest local-<timestamp> tag for an image repo (docker first, then k3s ctr).
latest_local_image_tag() {
  local IMG="$1"
  local TAG=""
  mapfile -t tags < <(docker images --format "{{.Tag}}" "$IMG" 2>/dev/null | grep '^local-' | sort -t- -k2 -n || true)
  if [ "${#tags[@]}" -gt 0 ]; then
    echo "${tags[$((${#tags[@]} - 1))]}"
    return 0
  fi
  TAG=$(k3s ctr -n k8s.io images ls -q 2>/dev/null | grep "docker.io/library/$IMG:local-" | sort -V | tail -n 1 | cut -d: -f2)
  if [[ -n "$TAG" && "$TAG" =~ ^local-[0-9]+$ ]]; then
    echo "$TAG"
    return 0
  fi
  return 1
}

# Import a Docker-built image into k3s containerd (required for local tags).
import_image_to_k3s() {
  local IMG="$1"
  local TAG="$2"
  if ! docker image inspect "$IMG:$TAG" &>/dev/null; then
    echo "[Warn] Docker image $IMG:$TAG not found — skip import"
    return 1
  fi
  if k3s ctr -n k8s.io images ls -q 2>/dev/null | grep -q "docker.io/library/$IMG:$TAG"; then
    return 0
  fi
  echo "[Docker] Importing $IMG:$TAG into k3s..."
  docker save "$IMG:$TAG" | k3s ctr -n k8s.io images import -
}

# Remove stale uniz-*:local-<timestamp> Docker tags after deploy (keep latest 2 per repo + in-use).
prune_old_local_images() {
  echo "[Cleanup] Pruning old local-* Docker images..."
  local repos
  repos=$(docker images --format "{{.Repository}}" | grep -E '^uniz-' | sort -u || true)
  [ -z "$repos" ] && return 0

  for repo in $repos; do
    mapfile -t tags < <(docker images --format "{{.Tag}}" "$repo" | grep '^local-' | sort -t- -k2 -n || true)
    local count=${#tags[@]}
    [ "$count" -le 2 ] && continue
    local i
    for ((i=0; i<count-2; i++)); do
      docker rmi "$repo:${tags[$i]}" 2>/dev/null || true
    done
  done

  docker image prune -f >/dev/null 2>&1 || true
  docker builder prune -f --keep-storage 8GB >/dev/null 2>&1 || docker builder prune -f >/dev/null 2>&1 || true
  echo "[Cleanup] Docker prune complete."
}

# Wait for key deployments and verify production health (fail CI if broken).
verify_deployment() {
  echo "[Verify] Waiting for rollouts..."
  local deps=(
    uniz-gateway-api
    uniz-auth-service
    uniz-user-service
    uniz-academics-service
    uniz-outpass-service
    uniz-portal
    uniz-docs-service
    uniz-mail-service
    uniz-notification-service
  )
  local dep
  for dep in "${deps[@]}"; do
    if kubectl get deployment "$dep" &>/dev/null; then
      kubectl rollout status "deployment/$dep" --timeout=180s || {
        echo "[Verify] Rollout timeout for $dep"
        kubectl get pods -l "app=$dep" 2>/dev/null || kubectl get pods | grep "$dep" || true
        return 1
      }
    fi
  done

  echo "[Verify] Checking API health..."
  local attempt code body
  for attempt in 1 2 3 4 5; do
    # -k: host nginx LE cert for api.* may be expired; verify app health not TLS here
    code=$(curl -sk -o /tmp/uniz-health.json -w "%{http_code}" --max-time 15 \
      https://api.uniz.rguktong.in/api/v1/system/health 2>/dev/null || true)
    code=${code:-000}
    if [ "$code" = "200" ]; then
      body=$(cat /tmp/uniz-health.json 2>/dev/null || echo "")
      if echo "$body" | grep -q '"status":"ok"'; then
        echo "[Verify] Health OK (HTTP 200, status ok)"
        return 0
      fi
      if echo "$body" | grep -q '"status":"degraded"'; then
        echo "[Verify] Health degraded but reachable — checking critical services..."
        if echo "$body" | grep -qE '"auth".*"healthy"|"name": "auth".*"healthy"'; then
          echo "[Verify] Core API reachable (degraded — non-critical service slow/down)"
          return 0
        fi
      fi
    fi
    echo "[Verify] Health attempt $attempt/5: HTTP $code — retry in 20s..."
    sleep 20
  done

  echo "[Verify] Production health check failed after 5 attempts (last HTTP $code)"
  cat /tmp/uniz-health.json 2>/dev/null || true
  return 1
}

# 16. Deploy Logic
deploy_logic() {
  set -e
  echo "[CI/CD] Deployment Verified at $(date)"
  export DOCKER_BUILDKIT=1

  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "[Git] Branch: $CURRENT_BRANCH | Commit: $(git log -1 --format='%h - %s')"
  NEW_HEAD=$(git rev-parse HEAD)
  if [ -n "${DEPLOY_SHA:-}" ]; then
    NEW_HEAD="$DEPLOY_SHA"
  fi

  COMMIT_MSG=$(git log -1 --pretty=%B)
  BUILD_MSG="$COMMIT_MSG $*"

  # Force rebuild all if requested
  FORCE_ALL=false
  if [[ "$BUILD_MSG" == *"[rebuild all]"* ]] || [[ "$BUILD_MSG" == *"[force build]"* ]]; then
    echo "[Build] Force rebuild all requested."
    FORCE_ALL=true
  fi

  # Scoped [rebuild <service>] tags — only build listed services (ignores diff for others)
  declare -A SCOPED_BUILD_DIRS=()
  SCOPED_REBUILD=false
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
  if [ "$SCOPED_REBUILD" == "true" ]; then
    echo "[Build] Scoped rebuild active — only tagged services will build."
  fi

  MONOREPO_SERVICES="uniz-academics uniz-auth uniz-user uniz-outpass uniz-files uniz-mail uniz-notifications uniz-cron uniz-gateway"

  # Change detection: GitHub Actions uses push before-SHA (Vercel-style); VPS uses last deploy file
  STATE_FILE="/root/.uniz_last_deploy_sha"
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

  # Dirs touched by infra manifest changes (one service per yaml)
  declare -A INFRA_CHANGED_DIRS=()
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

  service_should_build() {
    local DIR="$1"

    if [ "$FORCE_ALL" == "true" ]; then
      return 0
    fi

    if [ "$SCOPED_REBUILD" == "true" ]; then
      [ -n "${SCOPED_BUILD_DIRS[$DIR]}" ] && return 0
      return 1
    fi

    # Shared workspace deps -> backend monorepo services only (not portal/docs/landing)
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

    # App source changes -> that app only
    if [ -n "$CHANGED_FILES" ] && echo "$CHANGED_FILES" | grep -q "^apps/$DIR/"; then
      return 0
    fi

    # Infra manifest -> mapped service only
    if [ -n "${INFRA_CHANGED_DIRS[$DIR]}" ]; then
      return 0
    fi

    return 1
  }

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

    # Docs has no @uniz/shared — use lightweight per-app Dockerfile + small context
    if [[ "$DIR" == "uniz-docs" ]] && [ -f "apps/uniz-docs/Dockerfile" ]; then
      if ! grep -q '@uniz/shared' "apps/uniz-docs/package.json" 2>/dev/null; then
        BUILD_CONTEXT="apps/uniz-docs"
        DOCKERFILE="apps/uniz-docs/Dockerfile"
      fi
    fi
  }
  
  # Service Definitions
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

  ALL_SERVICES=("${UNIZ_SERVICES[@]}")
  K_BASE="infra/core-infra/kubernetes/base/core"
  [ ! -d "$K_BASE" ] && K_BASE="infra/core-infra/kubernetes/base"

  # LOAD SECRETS (Sanitized)
  if [ -f "/root/uniz-secrets.env" ]; then
    echo "[Vault] Loading sanitized secrets..."
    while IFS='=' read -r key value || [ -n "$key" ]; do
      [[ "$key" =~ ^#.*$ ]] && continue
      [[ -z "$key" ]] && continue
      # Strip all surrounding quotes and whitespace
      clean_val=$(echo "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'\'']*//' -e 's/["'\'']*$//')
      export "$key"="$clean_val"
    done < /root/uniz-secrets.env

  fi

  # Generate Infrastructure from templates
  if [ -f "infra/core-infra/kubernetes/base/shared/secrets.yaml.template" ]; then
    echo "[Infra] Generating secrets.yaml..."
    envsubst < infra/core-infra/kubernetes/base/shared/secrets.yaml.template > infra/core-infra/kubernetes/base/shared/secrets.yaml
  fi

  # Apply Infrastructure
  echo "[Infra] Applying shared components..."
  kubectl apply -k infra/core-infra/kubernetes/base/shared/ || true

  if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
    echo "[Infra] Syncing Cloudflare DNS token for cert-manager..."
    kubectl create secret generic cloudflare-api-token -n cert-manager \
      --from-literal=api-token="$CLOUDFLARE_API_TOKEN" \
      --dry-run=client -o yaml | kubectl apply -f -
  fi
  
  echo "[Infra] Applying branch components ($K_BASE)..."
  kubectl apply -k "$K_BASE" || true

  # Build & Deploy Loop
  REBUILT_COUNT=0
  declare -A BUILT_IMAGES

  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    SHOULD_BUILD=false

    if service_should_build "$DIR"; then
      SHOULD_BUILD=true
    fi

    TAG=""
    if [ "$SHOULD_BUILD" == "true" ]; then
      if [ -z "${BUILT_IMAGES[$IMG]}" ]; then
        resolve_build_paths "$DIR"

        # Verify context and Dockerfile exist
        if [ ! -d "$BUILD_CONTEXT" ]; then
          echo "[Skip] Directory $BUILD_CONTEXT not found in branch $CURRENT_BRANCH"
          continue
        fi
        if [ ! -f "$DOCKERFILE" ]; then
            echo "[Skip] Dockerfile not found at $DOCKERFILE. Skipping build."
            continue
        fi

        TAG="local-$(date +%s)"
        echo "[Build] Rebuilding $IMG:$TAG (context=$BUILD_CONTEXT, dockerfile=$DOCKERFILE)..."

        BUILD_ARGS=""
        if uses_monorepo_dockerfile "$DIR"; then
          WORKSPACE_NAME=$(node -p "require('./apps/$DIR/package.json').name")
          BUILD_ARGS="--build-arg SERVICE_DIR=apps/$DIR --build-arg WORKSPACE_NAME=$WORKSPACE_NAME"
        elif [[ "$DIR" == "uniz-portal" ]]; then
          BUILD_ARGS="--build-arg VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY --build-arg VITE_API_URL=$VITE_API_URL --build-arg VITE_CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME --build-arg VITE_CLOUDINARY_UPLOAD_PRESET=$CLOUDINARY_UPLOAD_PRESET --build-arg VITE_ANALYTICS_URL=$VITE_ANALYTICS_URL --build-arg VITE_ANALYTICS_KEY=$VITE_ANALYTICS_API_KEY --build-arg VITE_SCRAPER_URL=$VITE_SCRAPER_URL"
        fi

        CACHE_ARGS=""
        if [ -d "/tmp/.buildx-cache" ]; then
          CACHE_ARGS="--cache-from type=local,src=/tmp/.buildx-cache"
        fi
        mkdir -p /tmp/.buildx-cache 2>/dev/null || true

        if docker build --platform linux/amd64 \
          ${CACHE_ARGS} \
          --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
          $BUILD_ARGS \
          -f "$DOCKERFILE" \
          -t $IMG:$TAG \
          $BUILD_CONTEXT; then
          [ -d /tmp/.buildx-cache-new ] && rm -rf /tmp/.buildx-cache && mv /tmp/.buildx-cache-new /tmp/.buildx-cache
          echo "[Docker] Importing $IMG:$TAG..."
          import_image_to_k3s "$IMG" "$TAG"
          PREV_TAG="${BUILT_IMAGES[$IMG]:-}"
          BUILT_IMAGES[$IMG]=$TAG
          if [ -n "$PREV_TAG" ] && [ "$PREV_TAG" != "$TAG" ]; then
            docker rmi "$IMG:$PREV_TAG" 2>/dev/null || true
          fi
          ((REBUILT_COUNT++)) || true
        else
          echo "[Error] Build failed for $IMG."
          exit 1
        fi
      else
        TAG=${BUILT_IMAGES[$IMG]}
      fi
    else
      echo "[Skip] No changes for $DIR — reusing existing image."
      TAG=$(latest_local_image_tag "$IMG" || true)
      if [ -z "$TAG" ]; then
        # Never fall back to bare "local" — k3s will try docker.io and fail with ImagePullBackOff
        CURRENT=$(kubectl get deployment "$DEP" -o jsonpath="{.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null || true)
        if [[ "$CURRENT" =~ :local-[0-9]+$ ]]; then
          TAG="${CURRENT##*:}"
          echo "[Skip] Reusing deployment image tag $TAG for $DEP"
        else
          echo "[Warn] No local image for $IMG — leaving deployment image unchanged"
          TAG=""
        fi
      fi
    fi

    if [ -n "$TAG" ]; then
      import_image_to_k3s "$IMG" "$TAG" || {
        echo "[Error] Cannot deploy $DEP — image $IMG:$TAG missing from Docker and k3s"
        exit 1
      }
      echo "[Deploy] Updating $DEP -> $IMG:$TAG"
      if [[ "$DEP" == *"job"* ]]; then
        kubectl set image "cronjob/$DEP" "$CON=docker.io/library/$IMG:$TAG"
      else
        kubectl set image "deployment/$DEP" "$CON=docker.io/library/$IMG:$TAG"
      fi
    fi
  done

  # Docker Compose Handling (Main branch only)
  if [ "$CURRENT_BRANCH" == "main" ]; then
    LANDING_BACKEND_DIR="apps/uniz-landing-backend"
    if [ "$FORCE_ALL" == "true" ] || echo "$CHANGED_FILES" | grep -q "^$LANDING_BACKEND_DIR/"; then
      echo "[Compose] Redeploying $LANDING_BACKEND_DIR..."
      BASE_DIR=$PWD
      cd "$BASE_DIR/$LANDING_BACKEND_DIR"
      
      # Generate a strictly mapped .env for Python backend
      echo "DATABASE_URL=$LANDING_DATABASE_URL" > .env
      echo "JWT_SECURITY_KEY=$LANDING_JWT_SECURITY_KEY" >> .env
      echo "JWT_ALGORITHM=$LANDING_JWT_ALGORITHM" >> .env
      echo "DUMMY_TOKEN=$DUMMY_TOKEN" >> .env
      echo "POSTGRES_USER=$LANDING_POSTGRES_USER" >> .env
      echo "POSTGRES_PASSWORD=$LANDING_POSTGRES_PASSWORD" >> .env
      echo "POSTGRES_DB=$LANDING_POSTGRES_DB" >> .env
      # Include specific DB connection params with safe defaults
      echo "DB_USER=${DB_USER:-$POSTGRES_USER}" >> .env
      echo "DB_PASS=${DB_PASS:-$POSTGRES_PASSWORD}" >> .env
      echo "DB_HOST=${DB_HOST:-"localhost"}" >> .env
      echo "DB_PORT=${DB_PORT:-"5432"}" >> .env
      echo "DB_NAME=${DB_NAME:-$POSTGRES_DB}" >> .env

      docker compose -f docker-compose.yml.vps up -d --build
      cd "$BASE_DIR"
    fi
  fi

  echo "[Build] Rebuilt $REBUILT_COUNT image(s) this deploy."

  if [ "$DEPLOY_CONTEXT" = "GITHUB_ACTIONS" ]; then
    verify_deployment
  fi

  prune_old_local_images
  echo "$NEW_HEAD" > "$STATE_FILE"
}

# Execution Entry Point
if [ -f "/root/uniz-secrets.env" ]; then
  deploy_logic "$@"
else
  # On Local Machine -> Trigger VPS
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  git add .
  git commit -m "${1:-"chore: auto-deploy from $CURRENT_BRANCH"}" || true
  git push origin "$CURRENT_BRANCH"

  echo "[SSH] Dispatching $CURRENT_BRANCH to VPS..."
  ssh -o StrictHostKeyChecking=no root@76.13.241.174 << EOF
    export WORK_DIR="/root/uniz-master-$CURRENT_BRANCH"
    if [ ! -d "\$WORK_DIR" ]; then
      echo "[Setup] Creating isolated directory for $CURRENT_BRANCH..."
      git clone https://github.com/uniz-rguktong/uniz-master.git "\$WORK_DIR"
    fi
    cd "\$WORK_DIR"
    git fetch origin $CURRENT_BRANCH
    git checkout -B $CURRENT_BRANCH origin/$CURRENT_BRANCH
    git reset --hard origin/$CURRENT_BRANCH
    git clean -fd
    /bin/bash ./scripts/deploy.sh "remote-trigger"
EOF
fi

echo "[Health] API: \$(curl -s -o /dev/null -w "%{http_code}" https://api.uniz.rguktong.in/api/v1/system/health || echo 'FAIL')"
echo "[Done] Branch $CURRENT_BRANCH Deployed."
