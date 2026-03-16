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

# 16. Deploy Logic
deploy_logic() {
  echo "[CI/CD] Deployment Verified at $(date)"
  
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "[Git] Branch: $CURRENT_BRANCH | Commit: $(git log -1 --format='%h - %s')"
  NEW_HEAD=$(git rev-parse HEAD)

  # Force rebuild all if requested
  FORCE_ALL=false
  COMMIT_MSG=$(git log -1 --pretty=%B)
  # Check commit message OR script arguments for force flags
  if [[ "$COMMIT_MSG" == *"[rebuild all]"* ]] || [[ "$COMMIT_MSG" == *"[force build]"* ]] || [[ "$*" == *"[rebuild all]"* ]] || [[ "$*" == *"[force build]"* ]]; then
    echo "[Build] Force rebuild all requested."
    FORCE_ALL=true
  fi

  # State tracking
  STATE_FILE="/root/.uniz_last_deploy_sha"
  LAST_SHA=$( [ -f "$STATE_FILE" ] && cat "$STATE_FILE" || echo "" )
  [ -z "$LAST_SHA" ] && LAST_SHA="HEAD~1"

  echo "[Git] Diffing from $LAST_SHA to $NEW_HEAD"
  CHANGED_FILES=$(git diff --name-only "$LAST_SHA" "$NEW_HEAD" 2>/dev/null || echo "")
  
  # Service Definitions
  UNIZ_SERVICES=(
    "uniz-academics:uniz-academics-service:uniz-academics-service:academics-service"
    "uniz-auth:uniz-auth-service:uniz-auth-service:auth-service"
    "uniz-cron:uniz-cron-service:uniz-maintenance-job:cron-worker"
    "uniz-cron:uniz-cron-service:uniz-storage-cleanup-job:storage-cleaner"
    "uniz-cron:uniz-cron-service:uniz-cron-service:cron-worker"
    "uniz-files:uniz-files-service:uniz-files-service:files-service"
    "uniz-gateway:uniz-gateway-api:uniz-gateway-api:gateway-api"
    "uniz-mail:uniz-mail-service:uniz-mail-service:mail-service"
    "uniz-notifications:uniz-notification-service:uniz-notification-service:notification-service"
    "uniz-outpass:uniz-outpass-service:uniz-outpass-service:outpass-service"
    "uniz-portal:uniz-portal:uniz-portal:portal"
    "uniz-landing:uniz-landing:uniz-landing:landing"
    "uniz-user:uniz-user-service:uniz-user-service:user-service"
    "infra/core-infra/nginx:uniz-gateway:uniz-gateway:gateway-nginx"
  )

  ORNATE_SERVICES=(
    "ornate-core:ornate-core:ornate-core:ornate-core"
    "ornate:ornate:ornate:ornate"
    "ornate:ornate-landing:ornate-landing:ornate-landing"
  )

  # Branch Filtering
  if [ "$CURRENT_BRANCH" == "ornate" ]; then
    ALL_SERVICES=("${ORNATE_SERVICES[@]}")
    K_BASE="infra/core-infra/kubernetes/base/ornate"
    # Fallback if ornate/ folder doesn't exist in base
    [ ! -d "$K_BASE" ] && K_BASE="infra/core-infra/kubernetes/base"
  else
    ALL_SERVICES=("${UNIZ_SERVICES[@]}")
    K_BASE="infra/core-infra/kubernetes/base/core"
    [ ! -d "$K_BASE" ] && K_BASE="infra/core-infra/kubernetes/base"
  fi

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

    # Ornate Variable Fallbacks (Ensure they are never empty for envsubst)
    export ORNATE_NEXTAUTH_URL="${ORNATE_NEXTAUTH_URL:-$NEXTAUTH_URL}"
    export ORNATE_NEXTAUTH_URL_CORE="${ORNATE_NEXTAUTH_URL_CORE:-$NEXTAUTH_URL}"
    export ORNATE_NEXTAUTH_SECRET="${ORNATE_NEXTAUTH_SECRET:-$NEXTAUTH_SECRET}"
    export ORNATE_AWS_REGION="${ORNATE_AWS_REGION:-$AWS_REGION}"
    export ORNATE_AWS_ACCESS_KEY_ID="${ORNATE_AWS_ACCESS_KEY_ID:-$AWS_ACCESS_KEY_ID}"
    export ORNATE_AWS_SECRET_ACCESS_KEY="${ORNATE_AWS_SECRET_ACCESS_KEY:-$AWS_SECRET_ACCESS_KEY}"
  fi

  # Generate Infrastructure from templates
  if [ -f "infra/core-infra/kubernetes/base/shared/secrets.yaml.template" ]; then
    echo "[Infra] Generating secrets.yaml..."
    envsubst < infra/core-infra/kubernetes/base/shared/secrets.yaml.template > infra/core-infra/kubernetes/base/shared/secrets.yaml
  fi

  # Apply Infrastructure
  echo "[Infra] Applying shared components..."
  kubectl apply -k infra/core-infra/kubernetes/base/shared/ || true
  
  echo "[Infra] Applying branch components ($K_BASE)..."
  kubectl apply -k "$K_BASE" || true

  # Build & Deploy Loop
  REBUILT_COUNT=0
  declare -A BUILT_IMAGES

  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    SHOULD_BUILD=false
    
    if [ "$FORCE_ALL" == "true" ]; then
       SHOULD_BUILD=true
    elif [ -n "$CHANGED_FILES" ] && echo "$CHANGED_FILES" | grep -q "^apps/$DIR/\|^$DIR/"; then
      SHOULD_BUILD=true
    fi

    TAG=""
    if [ "$SHOULD_BUILD" == "true" ]; then
      if [ -z "${BUILT_IMAGES[$IMG]}" ]; then
        BUILD_CONTEXT="apps/$DIR"
        [[ "$DIR" == *"infra"* ]] && BUILD_CONTEXT="$DIR"
        
        # Verify context and Dockerfile exist
        if [ ! -d "$BUILD_CONTEXT" ]; then
          echo "[Skip] Directory $BUILD_CONTEXT not found in branch $CURRENT_BRANCH"
          continue
        fi
        if [ ! -f "$BUILD_CONTEXT/Dockerfile" ]; then
            echo "[Skip] Dockerfile not found in $BUILD_CONTEXT. Skipping build."
            continue
        fi

        TAG="local-$(date +%s)"
        echo "[Build] Rebuilding $IMG:$TAG..."
        
        BUILD_ARGS=""
        if [[ "$DIR" == "uniz-portal" ]]; then
          BUILD_ARGS="--build-arg VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY --build-arg VITE_API_URL=$VITE_API_URL --build-arg VITE_CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME --build-arg VITE_CLOUDINARY_UPLOAD_PRESET=$CLOUDINARY_UPLOAD_PRESET --build-arg VITE_ANALYTICS_URL=$VITE_ANALYTICS_URL --build-arg VITE_ANALYTICS_KEY=$VITE_ANALYTICS_API_KEY --build-arg VITE_SCRAPER_URL=$VITE_SCRAPER_URL"
        elif [[ "$DIR" == "ornate" || "$DIR" == "ornate-core" || "$DIR" == "ornate-landing" ]]; then
          # Ensure NEXTAUTH_URL is valid and not empty
          EFFECTIVE_AUTH_URL="${ORNATE_NEXTAUTH_URL:-$NEXTAUTH_URL}"
          [ -z "$EFFECTIVE_AUTH_URL" ] && EFFECTIVE_AUTH_URL="https://ornate.rguktong.in"
          
          BUILD_ARGS="--build-arg NEXT_PUBLIC_ASSETS_URL=https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/landing-assets --build-arg DATABASE_URL=$ORNATE_DATABASE_URL --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY --build-arg NEXTAUTH_URL=$EFFECTIVE_AUTH_URL --build-arg REDIS_URL=$ORNATE_REDIS_URL --build-arg R2_ENDPOINT=$R2_ENDPOINT --build-arg R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID --build-arg R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY --build-arg R2_PUBLIC_DOMAIN=$R2_PUBLIC_DOMAIN --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=$VAPID_PUBLIC_KEY --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"
        fi

        if docker build --platform linux/amd64 $BUILD_ARGS -t $IMG:$TAG $BUILD_CONTEXT; then
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
      # Not rebuilding -> Find latest local tag to avoid ":local" placeholder trap
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

  echo "$NEW_HEAD" > "$STATE_FILE"
}

# Execution Entry Point
if [ -f "/root/uniz-secrets.env" ]; then
  deploy_logic
else
  # On Local Machine -> Trigger VPS
  git add .
  git commit -m "${1:-"chore: auto-deploy from $CURRENT_BRANCH"}" || true
  git push origin "$CURRENT_BRANCH"

  echo "[SSH] Dispatching to VPS..."
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
