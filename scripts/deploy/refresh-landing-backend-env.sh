#!/usr/bin/env bash
# Regenerate landing-backend .env (analytics DB_HOST fix) and restart compose on VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [ -f /root/uniz-secrets.env ]; then
  set -a
  # shellcheck disable=SC1091
  source /root/uniz-secrets.env
  set +a
elif [ -f "$ROOT/secrets.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/secrets.env"
  set +a
else
  echo "[refresh-landing] No secrets file found (/root/uniz-secrets.env or secrets.env)" >&2
  exit 1
fi

LANDING_BACKEND_DIR="apps/uniz-landing-backend"
LANDING_ANALYTICS_DB_HOST="${LANDING_ANALYTICS_DB_HOST:-172.17.0.1}"

cd "$ROOT/$LANDING_BACKEND_DIR"

{
  echo "DATABASE_URL=$LANDING_DATABASE_URL"
  echo "JWT_SECURITY_KEY=$LANDING_JWT_SECURITY_KEY"
  echo "JWT_ALGORITHM=$LANDING_JWT_ALGORITHM"
  echo "DUMMY_TOKEN=$DUMMY_TOKEN"
  echo "POSTGRES_USER=$LANDING_POSTGRES_USER"
  echo "POSTGRES_PASSWORD=$LANDING_POSTGRES_PASSWORD"
  echo "POSTGRES_DB=$LANDING_POSTGRES_DB"
  echo "DB_USER=${DB_USER:-uniz_admin}"
  echo "DB_PASS=${DB_PASS:-$POSTGRES_PASSWORD}"
  echo "DB_HOST=${LANDING_ANALYTICS_DB_HOST}"
  echo "DB_PORT=${DB_PORT:-5432}"
  echo "DB_NAME=${DB_NAME:-uniz_db}"
} > .env

echo "[refresh-landing] Wrote .env with DB_HOST=${LANDING_ANALYTICS_DB_HOST}"
docker compose -f docker-compose.yml.vps up -d --build
echo "[refresh-landing] landing-backend restarted"
