#!/bin/bash
set -e

# 1. Sync with GitHub
echo "🚀 Syncing local changes to GitHub..."
git add .
git commit -m "chore: trigger surefire deployment [force build] $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main

# 2. Remote Deployment
echo "🌐 Starting VPS Deployment (Surefire Mode)..."
ssh -o StrictHostKeyChecking=no root@76.13.241.174 << 'EOF'
  set -e
  cd /root/uniz-master
  
  echo "📥 Updating local repository on VPS..."
  git fetch origin main
  git reset --hard origin/main
  
  CURRENT_COMMIT=$(git rev-parse --short HEAD)
  COMMIT_MSG=$(git log -1 --pretty=%B)
  echo "✅ Current Deployment Commit: $CURRENT_COMMIT - $COMMIT_MSG"

  # Force rebuild all?
  FORCE_ALL=false
  if [[ "$COMMIT_MSG" == *"[force build]"* ]] || [[ "$COMMIT_MSG" == *"[rebuild all]"* ]]; then
    echo "🚨 FORCE BUILD detected. Rebuilding all services."
    FORCE_ALL=true
  fi

  # Changed files in this push (last commit)
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD || git show --name-only --format="")

  # Mapping: folder:image:deployment:container
  SERVICES=(
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

  declare -A BUILT
  REDEPLOYED=0

  for s in "${SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    
    SHOULD_BUILD=false
    if [ "$FORCE_ALL" = true ]; then
      SHOULD_BUILD=true
    elif echo "$CHANGED_FILES" | grep -q "^apps/$DIR/\|^$DIR/"; then
      echo "🎯 Changes detected in $DIR"
      SHOULD_BUILD=true
    fi

    if [ "$SHOULD_BUILD" = true ]; then
      if [ -z "${BUILT[$IMG]}" ]; then
        TAG="prod-$(date +%s)"
        CONTEXT="apps/$DIR"
        [[ "$DIR" == *"infra"* ]] && CONTEXT="$DIR"

        echo "🏗️  Building $IMG:$TAG..."
        docker build --no-cache --platform linux/amd64 -t $IMG:$TAG $CONTEXT
        
        echo "📥 Importing $IMG:$TAG to K3s..."
        docker save $IMG:$TAG | k3s ctr -n k8s.io images import -
        
        BUILT[$IMG]=$TAG
        ((REDEPLOYED++))
      else
        TAG=${BUILT[$IMG]}
        echo "♻️  Reusing image $IMG:$TAG"
      fi

      echo "🛡️  Updating $DEP ($CON) -> $TAG..."
      if [[ "$DEP" == *"job"* ]]; then
        kubectl set image cronjob/$DEP $CON=docker.io/library/$IMG:$TAG
      else
        kubectl set image deployment/$DEP $CON=docker.io/library/$IMG:$TAG
        kubectl rollout restart deployment/$DEP
      fi
    else
      echo "⏭️  Skipping $IMG (no changes)"
    fi
  done

  echo "🧹 Cleaning up old Docker images..."
  docker image prune -f
  
  echo "✅ Deployment finished. Redeployed $REDEPLOYED images."
  echo "⌛ Waiting 30s for K8s stabilization..."
  sleep 30
  kubectl get pods
EOF

echo "🚀 Quick check on Platform Status..."
curl -s -o /dev/null -w "API Status: %{http_code}\n" https://api.uniz.rguktong.in/api/v1/system/health || true
echo "✅ Surefire Deployment Complete!"
