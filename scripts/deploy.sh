#!/bin/bash
# ==============================================================================
# UNIZ INFRASTRUCTURE - AUTOMATED DEPLOYMENT PIPELINE
# ==============================================================================
# Author: UNIZ Engineering
# Description: Handles secure code push, VPS remote trigger, and K8s rollout.
# Usage: ./scripts/deploy.sh "commit message" [--vps-run]
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. EXECUTION CONTEXT DETECTION
# ------------------------------------------------------------------------------
# Determines if the script is running on a local developer machine or 
# directly on the production VPS (hybrid execution).

VPS_RUN=false
for arg in "$@"; do
  if [ "$arg" == "--vps-run" ]; then
    VPS_RUN=true
    break
  fi
done

if [ "$VPS_RUN" == "true" ]; then
  echo "[Deploy] Detected direct VPS execution..."
  # When running on VPS, we skip the SSH remote-trigger and proceed to core logic.
else
  # ----------------------------------------------------------------------------
  # 1.1 LOCAL WRAPPER: Git Push & Remote Trigger
  # ----------------------------------------------------------------------------
  # Steps:
  # a. Commit and Push latest changes to GitHub
  # b. Execute the same script on VPS via SSH with the --vps-run flag
  # c. Perform immediate health check
  
  echo "[Push] Pushing code to GitHub..."
  MSG=${1:-"chore: deployment update $(date +'%Y-%m-%d %H:%M:%S')"}
  git add .
  git commit -m "$MSG" || echo "No changes to commit"
  git push origin main

  echo "[Deploy] Starting VPS Deployment..."
  ssh -o StrictHostKeyChecking=no root@76.13.241.174 "bash /root/uniz-master/scripts/deploy.sh --vps-run '$MSG'"
  
  echo "[Health] Quick check on API health..."
  curl -s -o /dev/null -w "%{http_code}" https://api.uniz.rguktong.in/api/v1/system/health || true
  echo -e "\n[Done] Deployment Pipeline Complete!"
  exit 0
fi

# ------------------------------------------------------------------------------
# 2. CORE DEPLOYMENT LOGIC (VPS EXCLUSIVE)
# ------------------------------------------------------------------------------
# This block handles the actual container builds and Kubernetes orchestration.

cd /root/uniz-master
echo "[Git] Fetching latest code..."
git fetch origin main
git reset --hard origin/main
  NEW_HEAD=$(git rev-parse HEAD)
  echo "[Git] Latest Commit: $(git log -1 --format='%h - %s')"

  # ----------------------------------------------------------------------------
  # 2.1 FORCE BUILD DETECTION
  # ----------------------------------------------------------------------------
  # Allows bypass of diff-based build logic via commit message tags.
  
  FORCE_ALL=false
  COMMIT_MSG=$(git log -1 --pretty=%B)
  if [[ "$COMMIT_MSG" == *"[rebuild all]"* ]] || [[ "$COMMIT_MSG" == *"[force build]"* ]]; then
    echo "[Build] Force rebuild all requested via commit message."
    FORCE_ALL=true
  fi

  # ----------------------------------------------------------------------------
  # 2.2 CHANGE DETECTION
  # ----------------------------------------------------------------------------
  # Optimizes deployment by only rebuilding modified microservices.
  
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD || git show --name-only --format="")
  
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

  # ----------------------------------------------------------------------------
  # 2.3 KUSTOMIZE STATE PRESERVATION
  # ----------------------------------------------------------------------------
  # Crucial: This prevent K8s from reverting rolling updates of services 
  # that were NOT rebuilt in this cycle by locking their current image tags.
  # We clear the images block first to avoid duplicates.
  
  echo "[Infra] Preserving current image tags..."
  sed -i '/^images:/,$d' infra/core-infra/kubernetes/base/kustomization.yaml
  echo "images:" >> infra/core-infra/kubernetes/base/kustomization.yaml
  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    if [[ "$DEP" == *"job"* ]]; then
      CURRENT_IMG=$(kubectl get cronjob "$DEP" -o jsonpath="{.spec.jobTemplate.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null)
    else
      CURRENT_IMG=$(kubectl get deployment "$DEP" -o jsonpath="{.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null)
    fi
    
    if [ -n "$CURRENT_IMG" ]; then
      # CURRENT_IMG comes out like docker.io/library/uniz-academics-service:local-12345
      IMG_REPO="${CURRENT_IMG%:*}"
      IMG_TAG="${CURRENT_IMG##*:}"
      
      # Only preserve if it's a timestamped local tag (e.g. local-1234 or fixed-1234)
      if [[ "$IMG_TAG" == "local-"* ]] || [[ "$IMG_TAG" == "fixed-"* ]]; then
        echo "  - name: ${IMG}:local" >> infra/core-infra/kubernetes/base/kustomization.yaml
        echo "    newName: $IMG_REPO" >> infra/core-infra/kubernetes/base/kustomization.yaml
        echo "    newTag: $IMG_TAG" >> infra/core-infra/kubernetes/base/kustomization.yaml
      fi
    fi
  done

  # ----------------------------------------------------------------------------
  # 2.4 SECRET MANAGEMENT & K8S APPLY
  # ----------------------------------------------------------------------------
  # Dynamically hydrates secrets.yaml with environment variables from VPS storage.

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
  kubectl apply -k infra/core-infra/kubernetes/base/

  # ----------------------------------------------------------------------------
  # 2.5 BUILD & ROLLOUT ORCHESTRATOR
  # ----------------------------------------------------------------------------
  # Iterates through service map, performs parallel-safe builds and triggers rollouts.
  
  REBUILT_COUNT=0
  declare -A BUILT_IMAGES

  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    SHOULD_BUILD=false
    
    if [ "$FORCE_ALL" == "true" ]; then
       SHOULD_BUILD=true
    elif echo "$CHANGED_FILES" | grep -q "^apps/$DIR/\|^$DIR/"; then
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
          BUILD_ARGS="--build-arg VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY --build-arg VITE_API_URL=$VITE_API_URL --build-arg VITE_CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME --build-arg VITE_CLOUDINARY_UPLOAD_PRESET=$CLOUDINARY_UPLOAD_PRESET"
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

      echo "[Deploy] Deploying $IMG:$TAG to $DEP..."
      if [[ "$DEP" == *"job"* ]]; then
        kubectl set image "cronjob/$DEP" "$CON=docker.io/library/$IMG:$TAG"
      else
        if kubectl set image "deployment/$DEP" "$CON=docker.io/library/$IMG:$TAG"; then
          kubectl rollout restart "deployment/$DEP"
        else
          echo "[Warning] Deployment upgrade failed for $DEP, check container name $CON"
        fi
      fi
    fi
  done

  # ----------------------------------------------------------------------------
  # 2.6 INFRASTRUCTURE CLEANUP & HEALTH
  # ----------------------------------------------------------------------------
  # Prunes dangling Docker layers and unused K3s images to prevent disk saturation.
  
  if [ $REBUILT_COUNT -gt 0 ] || [ "$FORCE_ALL" == "true" ]; then
    echo "[Cleanup] Cleaning up dangling Docker components..."
    docker system prune -f
    docker image prune -a -f --filter "until=24h"
    
    echo "[Cleanup] Pruning old K3s images..."
    # Remove images with 'local-' tag that are not currently used by any pod
    USED_IMAGES=$(kubectl get pods,deployments,cronjobs -A -o jsonpath='{..image}' | tr ' ' '\n' | sort -u)
    k3s ctr images ls -q | grep "local-" | while read -r img; do
      if ! echo "$USED_IMAGES" | grep -q "$img"; then
        echo "[Cleanup] Removing unused K3s image: $img"
        k3s ctr images rm "$img" || true
      fi
    done
    
    echo "[OK] Redeployed $REBUILT_COUNT services."
  else
    echo "[OK] No services needed updating."
  fi
  
  echo "[Health] Stabilization & Health Check..."
  for i in {1..6}; do
    INIT_COUNT=$(kubectl get pods --no-headers | grep -v 'Running\|Completed' | wc -l | xargs)
    echo "Check $i/6: $INIT_COUNT pods still initializing..."
    if [ "$INIT_COUNT" == "0" ]; then break; fi
    sleep 10
  done
  kubectl get pods

echo "[Health] Quick check on API health..."
curl -s -o /dev/null -w "%{http_code}" https://api.uniz.rguktong.in/api/v1/system/health || true
echo -e "\n[Done] Deployment Pipeline Complete!"
