#!/bin/sh
set -e

# Hard stop: never auto-migrate inside Kubernetes / production pods.
if [ -n "${KUBERNETES_SERVICE_HOST:-}" ]; then
  exec "$@"
fi

# Local Compose only. Production VPS uses scripts/deploy/prisma-migrate-deploy-all.sh
# and must NEVER run `db push --accept-data-loss` on container start.
if [ "${UNIZ_AUTO_DB_PUSH:-false}" = "true" ] \
  && [ -f "prisma/schema.prisma" ] \
  && [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] UNIZ_AUTO_DB_PUSH=true — applying Prisma schema (local Docker)..."
  i=0
  until npx prisma db push --skip-generate --accept-data-loss >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "$i" -ge 40 ]; then
      echo "[entrypoint] Database not ready after retries — trying once more with output:"
      npx prisma db push --skip-generate --accept-data-loss
      break
    fi
    sleep 2
  done
  echo "[entrypoint] Prisma schema applied"
fi

exec "$@"
