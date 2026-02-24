#!/bin/bash

# 1. Push code to GitHub
echo "🚀 Pushing code to GitHub..."
git add .
git commit -m "chore: deployment update $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
git push origin main

# 2. Deploy to VPS
echo "🌐 Starting VPS Deployment..."
ssh -o StrictHostKeyChecking=no root@76.13.241.174 << 'EOF'
  cd /root/uniz-master
  
  ORIG_HEAD=$(git rev-parse HEAD)
  echo "📥 Force pulling latest code..."
  git fetch origin main
  # Stash any local changes (like .env files if they are accidentally tracked) to avoid merge conflicts
  git stash
  git reset --hard origin/main
  NEW_HEAD=$(git rev-parse HEAD)

  # Detect changed files
  CHANGED_FILES=$(git diff --name-only $ORIG_HEAD $NEW_HEAD)
  
  # Global rebuild detection (if root config files changed or force requested)
  COMMIT_MSG=$(git log -1 --pretty=%B)
  GLOBAL_REBUILD=false
  if echo "$CHANGED_FILES" | grep -q "^package.json\|^package-lock.json\|^Dockerfile\|^.dockerignore\|^scripts/deploy.sh"; then
    echo "🚨 Root configuration changed. Triggering global rebuild..."
    GLOBAL_REBUILD=true
  elif [[ "$COMMIT_MSG" == *"[force build]"* ]] || [[ "$COMMIT_MSG" == *"[rebuild all]"* ]]; then
    echo "💪 Force rebuild requested via commit message. Triggering global rebuild..."
    GLOBAL_REBUILD=true
  fi

  if [ -z "$CHANGED_FILES" ]; then
    echo "ℹ️  No changes detected in Git. Skipping builds."
  fi

  # Service mapping: "folder_name:image_name:deployment_name:container_name"
  # Note: uniz-gateway is in infra/core-infra/nginx
  ALL_SERVICES=(
    "uniz-academics:uniz-academics-service:uniz-academics-service:academics-service"
    "uniz-auth:uniz-auth-service:uniz-auth-service:auth-service"
    "uniz-cron:uniz-cron-service:uniz-maintenance-job:cron-worker"
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

  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    echo "🎯 Checking for changes in $DIR..."
    SHOULD_BUILD=false
    
    # Check if any changed file is within this service directory or its app/ equivalent
    if [ "$GLOBAL_REBUILD" == "true" ]; then
       SHOULD_BUILD=true
    elif echo "$CHANGED_FILES" | grep -q "^apps/$DIR/\|^$DIR/"; then
      echo "🎯 Change detected in $DIR"
      SHOULD_BUILD=true
    fi

    if [ "$SHOULD_BUILD" == "true" ]; then
      echo "🏗️  Rebuilding $IMG..."
      
      # Determine build context correctly
      BUILD_CONTEXT="apps/$DIR"
      if [[ "$DIR" == *"infra"* ]]; then
        BUILD_CONTEXT="$DIR"
      fi

      TAG="local-$(date +%s)"
      docker build --no-cache -t $IMG:$TAG $BUILD_CONTEXT
      echo "📦 Importing $IMG to K3s..."
      docker save $IMG:$TAG | k3s ctr -n k8s.io images import -
      
      # Verify image exists in K3s
      if ! k3s crictl images | grep -q "$IMG.*$TAG"; then
        echo "❌ Failed to import $IMG:$TAG to K3s. Retrying..."
        docker save $IMG:$TAG | k3s ctr -n k8s.io images import -
      fi

      if [[ "$DEP" == *"job"* ]]; then
        echo "🛡️  Updating Kubernetes CronJob $DEP..."
        kubectl set image cronjob/$DEP cron-worker=docker.io/library/$IMG:$TAG
      else
        echo "🛡️  Updating Kubernetes deployment $DEP..."
        kubectl set image deployment/$DEP $CON=docker.io/library/$IMG:$TAG
        kubectl patch deployment $DEP -p '{"spec":{"template":{"spec":{"containers":[{"name":"'$CON'","imagePullPolicy":"IfNotPresent"}]}}}}'
        kubectl rollout restart deployment/$DEP
      fi
      
      ((REBUILT_COUNT++))
    else
      echo "⏭️  Skipping $IMG (No changes)."
    fi
  done

  if [ $REBUILT_COUNT -gt 0 ]; then
    echo "✅ Successfully redeployed $REBUILT_COUNT services."
  else
    echo "✨ Everything is up to date."
  fi
  
  echo "⌛ Stabilization check..."
  kubectl get pods
EOF

echo "🚀 Quick check on API health..."
curl -s -o /dev/null -w "%{http_code}" https://api.uniz.rguktong.in/api/v1/system/health || true
echo -e "\n✅ Deployment Pipeline Complete!"
