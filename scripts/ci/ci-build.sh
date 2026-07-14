#!/bin/bash
# Build backend services sequentially so each Prisma schema generates before tsc.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SERVICES=(
  uniz-auth
  uniz-user
  uniz-academics
  uniz-outpass
  uniz-files
  uniz-mail
  uniz-notifications
  uniz-gateway
  uniz-cron
)

for dir in "${SERVICES[@]}"; do
  path="apps/$dir"
  name=$(node -p "require('./$path/package.json').name")
  echo "[ci-build] $name"

  if [ -f "$path/prisma/schema.prisma" ]; then
    (cd "$path" && npx prisma generate)
  fi

  npm run build -w "$name"
done
