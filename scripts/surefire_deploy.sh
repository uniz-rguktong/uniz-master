#!/bin/bash
set -e

# 1. Sync with GitHub
echo "🚀 Syncing local changes to GitHub..."
git add .
git commit -m "chore: surefire deployment [force build] $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main

# 2. Remote Deployment
echo "🌐 Starting VPS Deployment (Surefire Mode)..."
ssh -o StrictHostKeyChecking=no root@76.13.241.174 "/bin/bash -s" << 'EOF'
  cd /root/uniz-master
  
  echo "📥 Updating local repository on VPS..."
  git fetch origin main
  git reset --hard origin/main
  
  CURRENT_COMMIT=$(git rev-parse --short HEAD)
  COMMIT_MSG=$(git log -1 --pretty=%B)
  echo "✅ Current Deployment Commit: $CURRENT_COMMIT"

  # Force rebuild all?
  FORCE_ALL=false
  if [[ "$COMMIT_MSG" == *"[force build]"* ]] || [[ "$COMMIT_MSG" == *"[rebuild all]"* ]]; then
    FORCE_ALL=true
  fi

  # Changed files in last commit
  CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD || git show --name-only --format="")

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
      SHOULD_BUILD=true
    fi

    if [ "$SHOULD_BUILD" = true ]; then
      if [ -z "${BUILT[$IMG]}" ]; then
        TAG="stage-$(date +%s)"
        CONTEXT="apps/$DIR"
        [[ "$DIR" == *"infra"* ]] && CONTEXT="$DIR"

        echo "🏗️ Building $IMG:$TAG..."
        docker build --no-cache --platform linux/amd64 -t $IMG:$TAG $CONTEXT || { echo "❌ Failed to build $IMG"; continue; }
        
        echo "📦 Exporting $IMG to tarball..."
        docker save $IMG:$TAG -o /tmp/$IMG.tar || { echo "❌ Failed to save $IMG"; continue; }
        
        echo "📥 Importing $IMG to K3s..."
        # We ignore errors on import if it says it already exists or has metadata issues but still succeeds
        k3s ctr -n k8s.io images import /tmp/$IMG.tar
        rm -f /tmp/$IMG.tar
        
        BUILT[$IMG]=$TAG
        ((REDEPLOYED++))
      else
        TAG=${BUILT[$IMG]}
        echo "♻️ Reusing $IMG:$TAG"
      fi

      echo "🛡️ Deploying $IMG:$TAG to $DEP..."
      if [[ "$DEP" == *"job"* ]]; then
        kubectl set image cronjob/$DEP $CON=docker.io/library/$IMG:$TAG || echo "⚠️ Warning: Failed to set image for cronjob $DEP"
      else
        kubectl set image deployment/$DEP $CON=docker.io/library/$IMG:$TAG || echo "⚠️ Warning: Failed to set image for deployment $DEP"
        kubectl rollout restart deployment/$DEP || echo "⚠️ Warning: Failed to rollout restart $DEP"
      fi
    else
      echo "⏭️ Skipping $IMG"
    fi
  done

  echo "🧹 Cleaning up..."
  docker image prune -f
  
  echo "✅ Finished. $REDEPLOYED services touched."
  sleep 10
  kubectl get pods
EOF

echo "🚀 Check..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://api.uniz.rguktong.in/api/v1/system/health || true
echo "✅ Done!"
