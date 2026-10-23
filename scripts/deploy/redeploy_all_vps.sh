#!/usr/bin/env bash
# Emergency: rebuild core images on VPS. Prefer GitHub Actions + GHCR.
set -euo pipefail

SERVICES=(
  "uniz-api:uniz-api:uniz-api"
  "uniz-gateway-api:uniz-gateway:uniz-gateway-api"
  "uniz-notification-service:uniz-notifications:uniz-notification-service"
  "uniz-docs-service:uniz-docs:uniz-docs-service"
)

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [ ! -f /root/uniz-secrets.env ]; then
  echo "Run on VPS with /root/uniz-secrets.env present." >&2
  exit 1
fi

for s in "${SERVICES[@]}"; do
  IFS=':' read -r IMG DIR DEP <<< "$s"
  echo "[redeploy] $IMG"
  if [ "$DIR" = "uniz-api" ]; then
    docker build -f docker/prod/Dockerfile.api -t "${IMG}:local" .
  else
    docker build -f docker/prod/Dockerfile.service \
      --build-arg "SERVICE_DIR=apps/${DIR}" \
      --build-arg "WORKSPACE_NAME=$(node -p "require('./apps/${DIR}/package.json').name")" \
      -t "${IMG}:local" .
  fi
  docker save "${IMG}:local" | sudo k3s ctr images import -
  kubectl set image "deployment/${DEP}" "*=${IMG}:local" 2>/dev/null || \
    kubectl set image "deployment/${DEP}" "${DEP#uniz-}=${IMG}:local" 2>/dev/null || true
  kubectl rollout status "deployment/${DEP}" --timeout=180s || true
done
