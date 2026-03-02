#!/bin/bash

# 1. Push code to GitHub
echo "🚀 Pushing code to GitHub..."
git add .
git commit -m "chore: deployment update $(date +'%Y-%m-%d %H:%M:%S') [force build]" || echo "No changes to commit"
git push origin main

# 2. Deploy to VPS
echo "🌐 Starting VPS Deployment..."
ssh -o StrictHostKeyChecking=no root@76.13.241.174 << 'EOF'
  cd /root/uniz-master
  
  ORIG_HEAD=$(git rev-parse HEAD)
  echo "📥 Force pulling latest code..."
  git fetch origin main
  git stash
  git reset --hard origin/main
  NEW_HEAD=$(git rev-parse HEAD)

  # Detect changed files
  CHANGED_FILES=$(git diff --name-only $ORIG_HEAD $NEW_HEAD)
  
  # Global rebuild detection
  COMMIT_MSG=$(git log -1 --pretty=%B)
  GLOBAL_REBUILD=true # FORCE REBUILD for this fix
  
  echo "💪 Force rebuild requested for deployment fix..."

  # Service mapping: "folder_name:image_name:deployment_name:container_name"
  ALL_SERVICES=(
    "uniz-mail:uniz-mail-service:uniz-mail-service:mail-service"
  )

  REBUILT_COUNT=0
  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    echo "🏗️  Rebuilding $IMG for linux/amd64..."
    
    TAG="local-$(date +%s)"
    BUILD_CONTEXT="apps/$DIR"
    
    # Robust Build & Import
    docker build --no-cache --platform linux/amd64 -t $IMG:$TAG $BUILD_CONTEXT
    echo "📦 Exporting $IMG to tarball..."
    docker save $IMG:$TAG -o /tmp/$IMG.tar
    
    echo "📥 Importing $IMG to K3s..."
    k3s ctr -n k8s.io images import /tmp/$IMG.tar
    rm /tmp/$IMG.tar
    
    echo "🛡️  Updating Kubernetes deployment $DEP..."
    kubectl set image deployment/$DEP $CON=docker.io/library/$IMG:$TAG
    kubectl rollout restart deployment/$DEP
    
    ((REBUILT_COUNT++))
  done

  echo "⌛ Waiting for stabilization (30s)..."
  sleep 30
  kubectl get pods | grep mail
EOF

echo "✅ Forced Deployment Complete!"
