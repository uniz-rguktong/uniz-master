#!/usr/bin/env bash
# Create or update the uniz_dbadmin login and re-apply its table grants.
# Safe to run more than once. Prints no passwords and no connection strings.
set -euo pipefail

if [ -z "${DBADMIN_DB_PASSWORD:-}" ]; then
  echo "[dbadmin] DBADMIN_DB_PASSWORD is not set. Skipping role setup."
  exit 0
fi

BOOTSTRAP="${DBADMIN_BOOTSTRAP_DATABASE_URL:-${USER_DATABASE_URL:-}}"
if [ -z "$BOOTSTRAP" ]; then
  echo "[dbadmin] USER_DATABASE_URL is not set, so the role cannot be created." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "[dbadmin] psql is not installed here. After the manifests are applied, run:"
  echo "[dbadmin]   kubectl create job --from=cronjob/uniz-dbadmin-role uniz-dbadmin-role-manual"
  exit 0
fi

SQL="${DBADMIN_ROLE_SQL:-$(cd "$(dirname "$0")" && pwd)/ensure-dbadmin-role.sql}"
CLEAN=$(printf '%s' "$BOOTSTRAP" | sed -E 's/([?&])(schema|connection_limit|pgbouncer|connect_timeout|pool_timeout)=[^&]*//g; s/\?&/?/; s/&&/\&/g; s/[?&]$//')
unset BOOTSTRAP

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
set +e
# Do not pass -e or -a. Those echo statements, including the password.
psql "$CLEAN" -v ON_ERROR_STOP=1 -f "$SQL" >"$TMP" 2>&1
rc=$?
set -e
unset CLEAN
rm -f "$TMP"
if [ "$rc" -ne 0 ]; then
  echo "[dbadmin] role setup failed" >&2
  exit "$rc"
fi
echo "[dbadmin] role ensured"
