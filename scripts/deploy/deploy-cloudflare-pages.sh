#!/usr/bin/env bash
# Deploy UniZ portal + landing static sites to Cloudflare Pages (free).
# Backend / Redis / Postgres stay on the VPS.
#
# Requires:
#   CLOUDFLARE_API_TOKEN  (Account:Cloudflare Pages:Edit + Zone:DNS:Edit)
# Optional:
#   VITE_* build vars (defaults match production hosts)
#
# Usage:
#   bash scripts/deploy/deploy-cloudflare-pages.sh
#   bash scripts/deploy/deploy-cloudflare-pages.sh portal
#   bash scripts/deploy/deploy-cloudflare-pages.sh landing
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

TARGET="${1:-all}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "[pages] CLOUDFLARE_API_TOKEN required" >&2
  exit 1
fi

export CLOUDFLARE_API_TOKEN

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-}"
if [[ -z "$ACCOUNT_ID" ]]; then
  ACCOUNT_ID=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/accounts?per_page=1" \
    | python3 -c 'import sys,json; r=json.load(sys.stdin).get("result") or []; print(r[0]["id"] if r else "")')
fi
if [[ -z "$ACCOUNT_ID" ]]; then
  echo "[pages] Could not resolve Cloudflare account id" >&2
  exit 1
fi
export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"
echo "[pages] Account $ACCOUNT_ID"

ensure_project() {
  local name="$1"
  if npx --yes wrangler@4 pages project list 2>/dev/null | grep -q "$name"; then
    echo "[pages] project $name exists"
    return 0
  fi
  echo "[pages] creating project $name"
  npx --yes wrangler@4 pages project create "$name" --production-branch=main || true
}

attach_domain() {
  local project="$1"
  local domain="$2"
  echo "[pages] ensure custom domain $domain → $project"
  curl -sS -X POST \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${project}/domains" \
    --data "{\"name\":\"${domain}\"}" \
    | python3 -c 'import sys,json; d=json.load(sys.stdin); print("[pages]", "domain ok" if d.get("success") or "already" in str(d).lower() else d.get("errors") or d)'
}

deploy_portal() {
  ensure_project "uniz-portal"
  echo "[pages] building portal..."
  export VITE_API_URL="${VITE_API_URL:-https://api-uniz.rguktong.in/api/v1}"
  export VITE_MAINTENANCE_MODE="${VITE_MAINTENANCE_MODE:-false}"
  export VITE_ENABLE_OUTPASS_OUTING="${VITE_ENABLE_OUTPASS_OUTING:-false}"
  export VITE_CLOUDINARY_CLOUD_NAME="${VITE_CLOUDINARY_CLOUD_NAME:-${CLOUDINARY_CLOUD_NAME:-}}"
  export VITE_CLOUDINARY_UPLOAD_PRESET="${VITE_CLOUDINARY_UPLOAD_PRESET:-${CLOUDINARY_UPLOAD_PRESET:-}}"
  export VITE_TURNSTILE_SITE_KEY="${VITE_TURNSTILE_SITE_KEY:-}"
  export VITE_ANALYTICS_URL="${VITE_ANALYTICS_URL:-}"
  export VITE_ANALYTICS_KEY="${VITE_ANALYTICS_API_KEY:-}"
  npm run build -w uniz
  npx --yes wrangler@4 pages deploy apps/uniz-portal/dist \
    --project-name=uniz-portal \
    --branch=main \
    --commit-dirty=true
  attach_domain "uniz-portal" "uniz.rguktong.in"
  attach_domain "uniz-portal" "www.uniz.rguktong.in"
}

deploy_landing() {
  ensure_project "uniz-landing"
  echo "[pages] building landing..."
  # Landing CMS API stays on VPS (landing-api host)
  export VITE_LANDING_API_URL="${VITE_LANDING_API_URL:-https://landing-api.rguktong.in}"
  npm run build -w uniz-landing
  npx --yes wrangler@4 pages deploy apps/uniz-landing/dist \
    --project-name=uniz-landing \
    --branch=main \
    --commit-dirty=true
  attach_domain "uniz-landing" "rguktong.in"
  attach_domain "uniz-landing" "www.rguktong.in"
}

case "$TARGET" in
  portal) deploy_portal ;;
  landing) deploy_landing ;;
  all)
    deploy_portal
    deploy_landing
    ;;
  *)
    echo "Usage: $0 [all|portal|landing]" >&2
    exit 1
    ;;
esac

echo "[pages] Frontend on Cloudflare Pages. Backend/DB/Redis remain on VPS."
