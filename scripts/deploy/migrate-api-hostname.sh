#!/usr/bin/env bash
# Migrate production API from nested api-uniz.rguktong.in → api-uniz.rguktong.in
# (free Universal SSL + Cloudflare Tunnel — no $10/mo Total TLS).
#
# Run on VPS as root after pulling latest repo:
#   bash /root/uniz-master-main/scripts/migrate-api-hostname.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NEW_API="api-uniz.rguktong.in"
NEW_API_URL="https://${NEW_API}/api/v1"
SECRETS="/root/uniz-secrets.env"

if [[ -f "$SECRETS" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$SECRETS"
  set +a
fi

echo "[migrate-api] Updating VITE_API_URL in $SECRETS..."
if [[ -f "$SECRETS" ]]; then
  if grep -q '^VITE_API_URL=' "$SECRETS"; then
    sed -i "s|^VITE_API_URL=.*|VITE_API_URL=\"${NEW_API_URL}\"|" "$SECRETS"
  else
    echo "VITE_API_URL=\"${NEW_API_URL}\"" >>"$SECRETS"
  fi
fi

echo "[migrate-api] Syncing Cloudflare tunnel + DNS..."
bash "$ROOT/scripts/deploy/setup-cloudflare-tunnel.sh"

echo "[migrate-api] Updating host nginx api vhost..."
if [[ -f /etc/nginx/sites-available/uniz-api ]]; then
  sed -i 's/server_name api-uniz.rguktong.in www.api-uniz.rguktong.in;/server_name api-uniz.rguktong.in;/' /etc/nginx/sites-available/uniz-api
  sed -i 's/server_name api-uniz.rguktong.in;/server_name api-uniz.rguktong.in;/' /etc/nginx/sites-available/uniz-api
  rm -f /etc/nginx/sites-enabled/uniz-api-www 2>/dev/null || true
  nginx -t && systemctl reload nginx
fi

echo "[migrate-api] Applying k8s ingress + configmap..."
kubectl apply -f "$ROOT/infra/core-infra/kubernetes/base/shared/configmap.yaml"
kubectl apply -f "$ROOT/infra/core-infra/kubernetes/base/shared/ingress.yaml"
kubectl rollout restart deployment/uniz-gateway deployment/uniz-gateway-api 2>/dev/null || true

echo "[migrate-api] Rebuilding portal (embeds VITE_API_URL at build time)..."
set -a
# shellcheck disable=SC1091
source "$SECRETS"
set +a
export DEPLOY_CONTEXT=VPS
bash "$ROOT/scripts/deploy/deploy.sh" "[rebuild portal]" || {
  echo "[migrate-api] deploy.sh skipped — forcing portal docker build..."
  TAG="local-$(date +%s)"
  docker build --platform linux/amd64 \
    --build-arg VITE_TURNSTILE_SITE_KEY="${VITE_TURNSTILE_SITE_KEY:-}" \
    --build-arg VITE_API_URL="${VITE_API_URL}" \
    --build-arg VITE_CLOUDINARY_CLOUD_NAME="${CLOUDINARY_CLOUD_NAME:-}" \
    --build-arg VITE_CLOUDINARY_UPLOAD_PRESET="${CLOUDINARY_UPLOAD_PRESET:-}" \
    --build-arg VITE_ANALYTICS_URL="${VITE_ANALYTICS_URL:-}" \
    --build-arg VITE_ANALYTICS_KEY="${VITE_ANALYTICS_API_KEY:-}" \
    -t "uniz-portal:$TAG" -f "$ROOT/apps/uniz-portal/Dockerfile" "$ROOT/apps/uniz-portal"
  docker save "uniz-portal:$TAG" | k3s ctr -n k8s.io images import -
  kubectl set image deployment/uniz-portal portal="docker.io/library/uniz-portal:$TAG"
  kubectl rollout status deployment/uniz-portal --timeout=180s
}

echo "[migrate-api] Waiting 45s for edge SSL provisioning..."
sleep 45

echo "[migrate-api] Health checks:"
curl -sf -o /dev/null -w "  external auth/health → %{http_code} (%{time_total}s)\n" \
  "https://${NEW_API}/api/v1/auth/health" || echo "  external: FAILED (DNS/SSL still propagating)"
curl -sk -o /dev/null -w "  local auth/health → %{http_code} (%{time_total}s)\n" \
  -H "Host: ${NEW_API}" "https://127.0.0.1/api/v1/auth/health" || true

echo "[migrate-api] Done."
echo "[migrate-api] Update GitHub Actions secret: VITE_API_URL=${NEW_API_URL}"
