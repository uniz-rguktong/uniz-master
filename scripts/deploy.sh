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

# 16. Deploy Logic
deploy_logic() {
  echo "[CI/CD] Deployment Verified at $(date)"
  export DOCKER_BUILDKIT=1

  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "[Git] Branch: $CURRENT_BRANCH | Commit: $(git log -1 --format='%h - %s')"
  NEW_HEAD=$(git rev-parse HEAD)

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

  # State tracking
  STATE_FILE="/root/.uniz_last_deploy_sha"
  LAST_SHA=$( [ -f "$STATE_FILE" ] && cat "$STATE_FILE" || echo "" )
  [ -z "$LAST_SHA" ] && LAST_SHA="HEAD~1"

  echo "[Git] Diffing from $LAST_SHA to $NEW_HEAD"
  CHANGED_FILES=$(git diff --name-only "$LAST_SHA" "$NEW_HEAD" 2>/dev/null || echo "")
  if [ -n "$CHANGED_FILES" ]; then
    echo "[Git] Changed files:"
    echo "$CHANGED_FILES" | sed 's/^/  /'
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
          docker save $IMG:$TAG | k3s ctr -n k8s.io images import -
          BUILT_IMAGES[$IMG]=$TAG
          ((REBUILT_COUNT++))
        else
          echo "[Error] Build failed for $IMG."
          exit 1
        fi
      else
        TAG=${BUILT_IMAGES[$IMG]}
      fi
    else
      echo "[Skip] No changes for $DIR — reusing existing image."
      TAG=$(k3s ctr -n k8s.io images ls -q | grep "docker.io/library/$IMG:local-" | sort -V | tail -n 1 | cut -d: -f2)
      if [ -z "$TAG" ]; then
          TAG="local"
      fi
    fi

    if [ -n "$TAG" ]; then
      echo "[Deploy] Updating $DEP -> $IMG:$TAG"
      if [[ "$DEP" == *"job"* ]]; then
        kubectl set image "cronjob/$DEP" "$CON=docker.io/library/$IMG:$TAG"
      else
        kubectl set image "deployment/$DEP" "$CON=docker.io/library/$IMG:$TAG"
        # Aggressive stabilization: Restart only if it's stuck or we built fresh
        if [ "$SHOULD_BUILD" == "true" ] || kubectl get pod -l "app=$DEP" 2>/dev/null | grep -q "ImagePullBackOff\|ErrImagePull"; then
           kubectl rollout restart "deployment/$DEP"
        fi
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
