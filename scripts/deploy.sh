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

# 2. Deploy Logic
deploy_logic() {
  echo "[CI/CD] Deployment Verified at $(date)"
  cd /root/uniz-master
  
  echo "[Git] Latest Commit: $(git log -1 --format='%h - %s')"
  NEW_HEAD=$(git rev-parse HEAD)

  # Force rebuild all if requested
  FORCE_ALL=false
  COMMIT_MSG=$(git log -1 --pretty=%B)
  if [[ "$COMMIT_MSG" == *"[rebuild all]"* ]] || [[ "$COMMIT_MSG" == *"[force build]"* ]]; then
    echo "[Build] Force rebuild all requested via commit message."
    FORCE_ALL=true
  fi

  # Persistently track last successful deployment SHA on VPS
  STATE_FILE="/root/.uniz_last_deploy_sha"
  LAST_SHA=$( [ -f "$STATE_FILE" ] && cat "$STATE_FILE" || echo "" )
  
  if [ -z "$LAST_SHA" ]; then
    echo "[Build] First deploy or empty state. Using HEAD~1 as base."
    LAST_SHA="HEAD~1"
  fi

  echo "[Git] Verifying cumulative changes from $LAST_SHA to $NEW_HEAD"
  CHANGED_FILES=$(git diff --name-only "$LAST_SHA" "$NEW_HEAD" 2>/dev/null || git show --name-only --format="" "$NEW_HEAD" 2>/dev/null || echo "")
  
  # Service mapping: "folder_name:image_name:deployment_name:container_name"
  ALL_SERVICES=(
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
    "ornate-core:ornate-core:ornate-core:ornate-core"
    "ornate:ornate-landing:ornate-landing:ornate-landing"
  )

  # Prevent kubectl apply from overwriting current images with :local
  echo "[Infra] Preserving current image tags..."
  K_FILE="infra/core-infra/kubernetes/base/kustomization.yaml"
  # Use a temporary file to rebuild kustomization.yaml to be safe
  sed -n '/^images:/q;p' "$K_FILE" > "$K_FILE.tmp"
  
  echo "images:" >> "$K_FILE.tmp"
  IMAGE_CONFIGURED=false
  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    if [[ "$DEP" == *"job"* ]]; then
      CURRENT_IMG=$(kubectl get cronjob "$DEP" -o jsonpath="{.spec.jobTemplate.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null)
    else
      CURRENT_IMG=$(kubectl get deployment "$DEP" -o jsonpath="{.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null)
    fi
    if [ -n "$CURRENT_IMG" ] && [[ "$CURRENT_IMG" != *":local" ]]; then
      IMG_REPO="${CURRENT_IMG%:*}"
      IMG_TAG="${CURRENT_IMG##*:}"
      echo "  - name: ${IMG}:local" >> "$K_FILE.tmp"
      echo "    newName: $IMG_REPO" >> "$K_FILE.tmp"
      echo "    newTag: $IMG_TAG" >> "$K_FILE.tmp"
      IMAGE_CONFIGURED=true
    fi
  done
  
  if [ "$IMAGE_CONFIGURED" = true ]; then
    mv "$K_FILE.tmp" "$K_FILE"
  else
    # If no images found (maybe first deployment), just keep the clean version without images block
    sed -n '/^images:/q;p' "$K_FILE.tmp" > "$K_FILE"
    rm "$K_FILE.tmp"
  fi

  echo "[K8s] Applying Kubernetes configurations..."
  if [ -f "infra/core-infra/kubernetes/base/secrets.yaml.template" ]; then
    echo "[Vault] Generating secrets from template..."
    if [ -f "/root/uniz-secrets.env" ]; then
      while IFS='=' read -r key value || [ -n "$key" ]; do
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ "$key" =~ ^[[:space:]]*$ ]] && continue
        value="${value%\"}"
        value="${value#\"}"
        export "$key"="$value"
      done < /root/uniz-secrets.env
    fi
    envsubst < infra/core-infra/kubernetes/base/secrets.yaml.template > infra/core-infra/kubernetes/base/secrets.yaml
  fi
  
  export NEXT_PUBLIC_ASSETS_URL="https://pub-d189280ec8be47c6a7f90812775baa54.r2.dev/landing-assets"
  kubectl apply -k infra/core-infra/kubernetes/base/

  REBUILT_COUNT=0
  declare -A BUILT_IMAGES

  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    SHOULD_BUILD=false
    
    if [ "$FORCE_ALL" == "true" ]; then
       SHOULD_BUILD=true
    elif [ -n "$CHANGED_FILES" ] && echo "$CHANGED_FILES" | grep -q "^apps/$DIR/\|^$DIR/"; then
      echo "[Build] Change detected in $DIR"
      SHOULD_BUILD=true
    fi

    if [ "$SHOULD_BUILD" == "true" ]; then
      if [ -z "${BUILT_IMAGES[$IMG]}" ]; then
        BUILD_CONTEXT="apps/$DIR"
        [[ "$DIR" == *"infra"* ]] && BUILD_CONTEXT="$DIR"

        TAG="local-$(date +%s)"
        echo "[Build] Rebuilding $IMG:$TAG in context $BUILD_CONTEXT..."
        
        BUILD_ARGS=""
        if [[ "$DIR" == "uniz-portal" ]]; then
          BUILD_ARGS="--build-arg VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY --build-arg VITE_API_URL=$VITE_API_URL --build-arg VITE_CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME --build-arg VITE_CLOUDINARY_UPLOAD_PRESET=$CLOUDINARY_UPLOAD_PRESET --build-arg VITE_ANALYTICS_URL=$VITE_ANALYTICS_URL --build-arg VITE_ANALYTICS_KEY=$VITE_ANALYTICS_API_KEY"
        elif [[ "$DIR" == "ornate" ]]; then
          BUILD_ARGS="--build-arg NEXT_PUBLIC_ASSETS_URL=$NEXT_PUBLIC_ASSETS_URL --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY"
        fi

        if docker build --no-cache --platform linux/amd64 $BUILD_ARGS -t $IMG:$TAG $BUILD_CONTEXT; then
          echo "[Docker] Importing $IMG:$TAG to K3s..."
          docker save $IMG:$TAG | k3s ctr -n k8s.io images import -
          BUILT_IMAGES[$IMG]=$TAG
          ((REBUILT_COUNT++))
        else
          echo "[Error] Build failed for $IMG. Aborting deployment."
          exit 1
        fi
      else
        TAG=${BUILT_IMAGES[$IMG]}
        echo "[Build] Using built image for $IMG with tag $TAG"
      fi

      echo "[Deploy] Updating $DEP to use $IMG:$TAG..."
      if [[ "$DEP" == *"job"* ]]; then
        kubectl set image "cronjob/$DEP" "$CON=docker.io/library/$IMG:$TAG"
      else
        if kubectl set image "deployment/$DEP" "$CON=docker.io/library/$IMG:$TAG"; then
          kubectl rollout restart "deployment/$DEP"
        else
          echo "[Warning] Deployment update failed for $DEP"
        fi
      fi
    fi
  done

  if [ $REBUILT_COUNT -gt 0 ] || [ "$FORCE_ALL" == "true" ]; then
    echo "[Cleanup] Docker & K3s Image Pruning..."
    docker system prune -f
    docker image prune -a -f --filter "until=24h"
    USED_IMAGES=$(kubectl get pods,deployments,cronjobs -A -o jsonpath='{..image}' | tr ' ' '\n' | sort -u)
    k3s ctr images ls -q | grep "local-" | while read -r img; do
      if ! echo "$USED_IMAGES" | grep -q "$img"; then
        k3s ctr images rm "$img" || true
      fi
    done
    echo "[OK] Redeployed $REBUILT_COUNT services."
    echo "[State] Updating deployment SHA: $NEW_HEAD"
    echo "$NEW_HEAD" > "$STATE_FILE"
  else
    # Even if nothing rebuilt, current commit is now "deployed"
    echo "$NEW_HEAD" > "$STATE_FILE"
  fi
}

# Execution
if [ -f "/root/uniz-secrets.env" ]; then
  echo "[Deploy] Running directly on VPS context..."
  deploy_logic
else
  echo "[Deploy] Triggering VPS Deployment via SSH..."
  ssh -o StrictHostKeyChecking=no root@76.13.241.174 << 'EOF'
    cd /root/uniz-master
    git fetch origin main
    git reset --hard origin/main
    # Fixed the nested quote issue by using simple arguments
    /bin/bash ./scripts/deploy.sh "remote-trigger"
EOF
fi

echo "[Health] Checking API Status..."
curl -s -o /dev/null -w "%{http_code}" https://api.uniz.rguktong.in/api/v1/system/health || true
echo -e "\n[Done] Process Complete!"
