#!/bin/bash

SERVICES=(
  "uniz-gateway:uniz-gateway:uniz-gateway"
  "uniz-gateway-api:uniz-gateway:uniz-gateway-api"
  "uniz-auth-service:uniz-auth:uniz-auth-service"
  "uniz-user-service:uniz-user:uniz-user-service"
  "uniz-academics-service:uniz-academics:uniz-academics-service"
  "uniz-outpass-service:uniz-outpass:uniz-outpass-service"
  "uniz-files-service:uniz-files:uniz-files-service"
  "uniz-mail-service:uniz-mail:uniz-mail-service"
  "uniz-notification-service:uniz-notifications:uniz-notification-service"
  "uniz-cron-service:uniz-cron:uniz-cron-service"
  "uniz-portal:uniz-portal:uniz-portal"
)

echo "[Push] Starting Full System Redeploy on VPS..."

for item in "${SERVICES[@]}"; do
  IFS=':' read -r IMAGE DIR DEPLOY <<< "$item"
  echo "[Build] Building and Deploying $DEPLOY..."
  ssh -o StrictHostKeyChecking=no root@76.13.241.174 "cd /root/uniz-master && docker build -t $IMAGE:local apps/$DIR && docker save $IMAGE:local | /usr/local/bin/k3s ctr images import - && kubectl rollout restart deployment $DEPLOY"
done

echo "[OK] All services successfully rolled out!"
