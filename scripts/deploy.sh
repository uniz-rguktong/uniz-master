#!/bin/bash

# 1. Push code to GitHub
echo "🚀 Pushing code to GitHub..."
git add .
git commit -m "chore: deployment update $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main

# 2. Deploy to VPS
echo "🌐 Starting VPS Deployment..."
ssh -o StrictHostKeyChecking=no root@76.13.241.174 << 'EOF'
  set -e
  cd /root/uniz-master
  
  echo "📥 Fetching latest code..."
  git fetch origin main
  git reset --hard origin/main
  NEW_HEAD=$(git rev-parse HEAD)
  echo "✅ Latest Commit: $(git log -1 --format='%h - %s')"

  # Force rebuild all if requested
  FORCE_ALL=false
  if [[ "$(git log -1 --pretty=%B)" == *"[rebuild all]"* ]] || [[ "$(git log -1 --pretty=%B)" == *"[force build]"* ]]; then
    echo "� Force rebuild all requested via commit message."
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
    "uniz-files:uniz-files-service:uniz-files-service:files-service"
    "uniz-gateway:uniz-gateway-api:uniz-gateway-api:gateway-api"
    "uniz-mail:uniz-mail-service:uniz-mail-service:mail-service"
    "uniz-notifications:uniz-notification-service:uniz-notification-service:notification-service"
    "uniz-outpass:uniz-outpass-service:uniz-outpass-service:outpass-service"
    "uniz-portal:uniz-portal:uniz-portal:portal"
    "uniz-user:uniz-user-service:uniz-user-service:user-service"
    "infra/core-infra/nginx:uniz-gateway:uniz-gateway:gateway-nginx"
  )

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
        echo "🏗️  Rebuilding $IMG:$TAG..."
        docker build --no-cache --platform linux/amd64 -t $IMG:$TAG $BUILD_CONTEXT
        
        echo "📥 Importing $IMG:$TAG to K3s..."
        docker save $IMG:$TAG | k3s ctr -n k8s.io images import -
        
        BUILT_IMAGES[$IMG]=$TAG
        ((REBUILT_COUNT++))
      else
        TAG=${BUILT_IMAGES[$IMG]}
        echo "♻️  Using built image for $IMG with tag $TAG"
      fi

      echo "🛡️  Deploying $IMG:$TAG to $DEP..."
      if [[ "$DEP" == *"job"* ]]; then
        kubectl set image cronjob/$DEP $CON=docker.io/library/$IMG:$TAG
      else
        kubectl set image deployment/$DEP $CON=docker.io/library/$IMG:$TAG
        # Force a fresh pod creation
        kubectl rollout restart deployment/$DEP
      fi
    fi
  done

  if [ $REBUILT_COUNT -gt 0 ]; then
    echo "✅ Redeployed $REBUILT_COUNT services."
    docker image prune -f
  else
    echo "✨ No services needed updating."
  fi
  
  echo "⌛ Stabilization (30s)..."
  sleep 30
  kubectl get pods
EOF

echo "🚀 Quick check on API health..."
curl -s -o /dev/null -w "%{http_code}" https://api.uniz.rguktong.in/api/v1/system/health || true
echo -e "\n✅ Deployment Pipeline Complete!"
