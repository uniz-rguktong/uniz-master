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
  git pull origin main

  # List of services to be built from the latest code
  SERVICES="uniz-academics:uniz-academics-service uniz-auth:uniz-auth-service uniz-cron:uniz-cron-service uniz-files:uniz-files-service uniz-gateway:uniz-gateway-api uniz-mail:uniz-mail-service uniz-notifications:uniz-notification-service uniz-outpass:uniz-outpass-service uniz-portal:uniz-portal uniz-user:uniz-user-service ../infra/core-infra/nginx:uniz-gateway"

  for s in $SERVICES; do
    DIR=${s%%:*}
    IMG=${s##*:}
    echo "🏗️  Building $IMG from apps/$DIR..."
    docker build --no-cache -t $IMG:local apps/$DIR
    echo "📦 Importing $IMG to K3s..."
    docker save $IMG:local | k3s ctr -n k8s.io images import -
  done

  echo "🛡️  Updating Kubernetes image references..."
  kubectl set image deployment/uniz-auth-service auth-service=docker.io/library/uniz-auth-service:local
  kubectl set image deployment/uniz-user-service user-service=docker.io/library/uniz-user-service:local
  kubectl set image deployment/uniz-outpass-service outpass-service=docker.io/library/uniz-outpass-service:local
  kubectl set image deployment/uniz-notification-service notification-service=docker.io/library/uniz-notification-service:local
  kubectl set image deployment/uniz-mail-service mail-service=docker.io/library/uniz-mail-service:local
  kubectl set image deployment/uniz-files-service files-service=docker.io/library/uniz-files-service:local
  kubectl set image deployment/uniz-cron-service cron-service=docker.io/library/uniz-cron-service:local
  kubectl set image deployment/uniz-academics-service academics-service=docker.io/library/uniz-academics-service:local
  kubectl set image deployment/uniz-gateway-api gateway-api=docker.io/library/uniz-gateway-api:local
  kubectl set image deployment/uniz-gateway gateway-nginx=docker.io/library/uniz-gateway:local
  kubectl set image deployment/uniz-portal portal=docker.io/library/uniz-portal:local

  echo "🔄 Restarting all deployments..."
  kubectl rollout restart deployment
  
  echo "⌛ Waiting for key services to stabilize..."
  kubectl rollout status deployment/uniz-portal --timeout=120s
  kubectl rollout status deployment/uniz-auth-service --timeout=120s

  echo "✅ VPS Deployment Complete!"
EOF
