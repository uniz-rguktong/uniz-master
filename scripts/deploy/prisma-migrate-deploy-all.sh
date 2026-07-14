#!/usr/bin/env bash
# Apply Prisma migrations for every service schema on deploy.
# Safe to run repeatedly — no-op when already up to date.
#
# Usage (VPS / CI after secrets are loaded):
#   ./scripts/deploy/prisma-migrate-deploy-all.sh
#
# Requires per-service *_DATABASE_URL vars (see render-vps-secrets.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

# Load VPS secrets the same way deploy.sh does (values are shell-quoted).
if [ -f "/root/uniz-secrets.env" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    [[ "$line" != *"="* ]] && continue
    eval "export $line"
  done < /root/uniz-secrets.env
fi

PRISMA_VERSION="${PRISMA_MIGRATE_VERSION:-6.19.3}"
PRISMA="npx --yes prisma@${PRISMA_VERSION}"

# app directory -> secrets env var for DATABASE_URL
SERVICES=(
  "uniz-auth:AUTH_DATABASE_URL"
  "uniz-user:USER_DATABASE_URL"
  "uniz-academics:ACADEMICS_DATABASE_URL"
  "uniz-outpass:OUTPASS_DATABASE_URL"
  "uniz-notifications:NOTIFICATION_DATABASE_URL"
  "uniz-cron:CRON_DATABASE_URL"
)

list_migrations() {
  local dir
  for dir in prisma/migrations/*/; do
    [ -d "$dir" ] || continue
    basename "$dir"
  done | sort
}

migrate_one() {
  local app="$1"
  local url_var="$2"
  local url="${!url_var:-}"

  if [ ! -f "apps/$app/prisma/schema.prisma" ]; then
    echo "[Prisma] skip $app — no schema"
    return 0
  fi

  if [ ! -d "apps/$app/prisma/migrations" ]; then
    echo "[Prisma] skip $app — no migrations folder"
    return 0
  fi

  if [ -z "$url" ]; then
    echo "[Prisma] skip $app — $url_var not set"
    return 0
  fi

  echo "[Prisma] migrate deploy → apps/$app"
  cd "$ROOT/apps/$app"
  export DATABASE_URL="$url"

  local out rc=0
  set +e
  out=$($PRISMA migrate deploy 2>&1)
  rc=$?
  set -e
  echo "$out"

  if [ "$rc" -eq 0 ]; then
    echo "[Prisma] $app OK"
    return 0
  fi

  if echo "$out" | grep -q "P3005"; then
    echo "[Prisma] $app: existing database without migration history — baselining..."
    local name
    while IFS= read -r name; do
      [ -n "$name" ] || continue
      $PRISMA migrate resolve --applied "$name" || true
    done < <(list_migrations)

    $PRISMA migrate deploy
    echo "[Prisma] $app OK (after baseline)"
    return 0
  fi

  echo "[Prisma] $app FAILED (exit $rc)" >&2
  return "$rc"
}

failed=0
for entry in "${SERVICES[@]}"; do
  IFS=':' read -r app url_var <<< "$entry"
  if ! migrate_one "$app" "$url_var"; then
    failed=$((failed + 1))
  fi
  cd "$ROOT"
done

if [ "$failed" -gt 0 ]; then
  echo "[Prisma] $failed service(s) failed migration" >&2
  exit 1
fi

echo "[Prisma] All service databases are in sync"
