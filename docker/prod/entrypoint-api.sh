#!/bin/sh
set -e

# Hard stop: never auto-migrate inside Kubernetes / production pods.
if [ -n "${KUBERNETES_SERVICE_HOST:-}" ]; then
  exec "$@"
fi

# Local Compose only — push all three schemas when UNIZ_AUTO_DB_PUSH=true.
if [ "${UNIZ_AUTO_DB_PUSH:-false}" = "true" ]; then
  push_schema() {
    label="$1"
    dir="$2"
    url="$3"
    if [ -z "$url" ] || [ ! -f "$dir/prisma/schema.prisma" ]; then
      return 0
    fi
    echo "[entrypoint-api] db push ($label)..."
    i=0
    until (
      cd "$dir" && DATABASE_URL="$url" npx prisma db push --skip-generate --accept-data-loss >/dev/null 2>&1
    ); do
      i=$((i + 1))
      if [ "$i" -ge 40 ]; then
        cd "$dir" && DATABASE_URL="$url" npx prisma db push --skip-generate --accept-data-loss
        break
      fi
      sleep 2
    done
  }

  push_schema auth /app/apps/uniz-auth "${AUTH_DATABASE_URL:-$DATABASE_URL}"
  push_schema user /app/apps/uniz-user "${USER_DATABASE_URL:-$DATABASE_URL}"
  push_schema academics /app/apps/uniz-academics "${ACADEMICS_DATABASE_URL:-$DATABASE_URL}"
  echo "[entrypoint-api] Prisma schemas applied"
fi

exec "$@"
