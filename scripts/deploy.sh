#!/bin/bash

# 1. Push code to GitHub
echo "🚀 Pushing code to GitHub..."
MSG=${1:-"chore: deployment update $(date +'%Y-%m-%d %H:%M:%S')"}
git add .
git commit -m "$MSG" || echo "No changes to commit"
git push origin main

# 2. Deploy to VPS
echo "🌐 Starting VPS Deployment..."
ssh -o StrictHostKeyChecking=no root@76.13.241.174 << 'EOF'
  cd /root/uniz-master
  
  echo "📥 Fetching latest code..."
  git fetch origin main
  git reset --hard origin/main
  NEW_HEAD=$(git rev-parse HEAD)
  echo "✅ Latest Commit: $(git log -1 --format='%h - %s')"

  # Force rebuild all if requested
  FORCE_ALL=false
  COMMIT_MSG=$(git log -1 --pretty=%B)
  if [[ "$COMMIT_MSG" == *"[rebuild all]"* ]] || [[ "$COMMIT_MSG" == *"[force build]"* ]]; then
    echo "🏗️  Force rebuild all requested via commit message."
    FORCE_ALL=true
  fi

  # Detect changed files relative to last successful build
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
    "uniz-user:uniz-user-service:uniz-user-service:user-service"
    "infra/core-infra/nginx:uniz-gateway:uniz-gateway:gateway-nginx"
    "ornate-ems:ornate-ems:ornate-ems:ornate-ems"
  )

  # Prevent kubectl apply from overwriting current images with :local
  echo "💾 Preserving current image tags..."
  echo "images:" >> infra/core-infra/kubernetes/base/kustomization.yaml
  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    if [[ "$DEP" == *"job"* ]]; then
      CURRENT_IMG=$(kubectl get cronjob "$DEP" -o jsonpath="{.spec.jobTemplate.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null)
    else
      CURRENT_IMG=$(kubectl get deployment "$DEP" -o jsonpath="{.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null)
    fi
    if [ -n "$CURRENT_IMG" ] && [[ "$CURRENT_IMG" != *":local" ]]; then
      # CURRENT_IMG comes out like docker.io/library/uniz-academics-service:local-12345
      IMG_REPO="${CURRENT_IMG%:*}"
      IMG_TAG="${CURRENT_IMG##*:}"
      echo "  - name: ${IMG}:local" >> infra/core-infra/kubernetes/base/kustomization.yaml
      echo "    newName: $IMG_REPO" >> infra/core-infra/kubernetes/base/kustomization.yaml
      echo "    newTag: $IMG_TAG" >> infra/core-infra/kubernetes/base/kustomization.yaml
    fi
  done

  echo "🛠️  Applying Kubernetes configurations..."
  kubectl apply -k infra/core-infra/kubernetes/base/

  REBUILT_COUNT=0
  declare -A BUILT_IMAGES

  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    SHOULD_BUILD=false
    
    if [ "$FORCE_ALL" == "true" ]; then
       SHOULD_BUILD=true
    elif echo "$CHANGED_FILES" | grep -q "^apps/$DIR/\|^$DIR/"; then
      echo "🎯 Change detected in $DIR"
      SHOULD_BUILD=true
    fi

    if [ "$SHOULD_BUILD" == "true" ]; then
      if [ -z "${BUILT_IMAGES[$IMG]}" ]; then
        BUILD_CONTEXT="apps/$DIR"
        [[ "$DIR" == *"infra"* ]] && BUILD_CONTEXT="$DIR"

        TAG="local-$(date +%s)"
        echo "🏗️  Rebuilding $IMG:$TAG in context $BUILD_CONTEXT..."
        if docker build --no-cache --platform linux/amd64 -t $IMG:$TAG $BUILD_CONTEXT; then
          echo "📥 Importing $IMG:$TAG to K3s..."
          docker save $IMG:$TAG | k3s ctr -n k8s.io images import -
          BUILT_IMAGES[$IMG]=$TAG
          ((REBUILT_COUNT++))
        else
          echo "❌ Build failed for $IMG, skipping deployment."
          continue
        fi
      else
        TAG=${BUILT_IMAGES[$IMG]}
        echo "♻️  Using built image for $IMG with tag $TAG"
      fi

      echo "🛡️  Deploying $IMG:$TAG to $DEP..."
      if [[ "$DEP" == *"job"* ]]; then
        kubectl set image "cronjob/$DEP" "$CON=docker.io/library/$IMG:$TAG"
      else
        if kubectl set image "deployment/$DEP" "$CON=docker.io/library/$IMG:$TAG"; then
          kubectl rollout restart "deployment/$DEP"
        else
          echo "⚠️  Deployment upgrade failed for $DEP, check container name $CON"
        fi
      fi
    fi
  done

  if [ $REBUILT_COUNT -gt 0 ] || [ "$FORCE_ALL" == "true" ]; then
    echo "🧹 Cleaning up dangling Docker components..."
    docker system prune -f
    docker image prune -a -f --filter "until=24h"
    
    echo "♻️  Pruning old K3s images..."
    # Remove images with 'local-' tag that are not currently used by any pod
    USED_IMAGES=$(kubectl get pods,deployments,cronjobs -A -o jsonpath='{..image}' | tr ' ' '\n' | sort -u)
    k3s ctr images ls -q | grep "local-" | while read -r img; do
      if ! echo "$USED_IMAGES" | grep -q "$img"; then
        echo "🗑️ Removing unused K3s image: $img"
        k3s ctr images rm "$img" || true
      fi
    done
    
    echo "✅ Redeployed $REBUILT_COUNT services."
  else
    echo "✨ No services needed updating."
  fi
  
  echo "⌛ Stabilization & Health Check..."
  for i in {1..6}; do
    INIT_COUNT=$(kubectl get pods --no-headers | grep -v 'Running\|Completed' | wc -l | xargs)
    echo "Check $i/6: $INIT_COUNT pods still initializing..."
    if [ "$INIT_COUNT" == "0" ]; then break; fi
    sleep 10
  done
  kubectl get pods
EOF

echo "🚀 Quick check on API health..."
curl -s -o /dev/null -w "%{http_code}" https://api.uniz.rguktong.in/api/v1/system/health || true
echo -e "\n✅ Deployment Pipeline Complete!"
