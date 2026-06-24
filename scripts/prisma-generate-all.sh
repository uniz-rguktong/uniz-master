#!/usr/bin/env bash
# Generate isolated Prisma clients per service (safe for local monorepo + Docker builds).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APPS=(
  uniz-auth
  uniz-user
  uniz-academics
  uniz-outpass
  uniz-notifications
  uniz-cron
)

for app in "${APPS[@]}"; do
  if [ -f "apps/$app/prisma/schema.prisma" ]; then
    echo "[Prisma] generate apps/$app"
    (cd "apps/$app" && npx prisma generate)
  fi
done

echo "[Prisma] All service clients generated under apps/*/src/generated/prisma"
