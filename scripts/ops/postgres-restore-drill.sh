#!/usr/bin/env bash
# Restore-drill: load the newest local Postgres dump into a side database and sanity-check.
# Runs on the VPS (needs psql + dumps under /var/backups/uniz).
#
# Usage:
#   CONFIRM=1 bash scripts/ops/postgres-restore-drill.sh
#   CONFIRM=1 SERVICE=auth bash scripts/ops/postgres-restore-drill.sh
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/uniz}"
SERVICE="${SERVICE:-auth}"
DRILL_DB="${DRILL_DB:-uniz_restore_drill}"
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-${POSTGRES_USER:-postgres}}"

if [[ "${CONFIRM:-}" != "1" ]]; then
  cat >&2 <<MSG
This creates/replaces database '$DRILL_DB' from the newest ${SERVICE} dump.
Re-run with CONFIRM=1 after checking disk and that production traffic is quiet.
MSG
  exit 2
fi

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1" >&2; exit 1; }; }
need psql
need gunzip

DUMP=$(ls -1t "$BACKUP_DIR"/uniz-"${SERVICE}"_*.sql.gz 2>/dev/null | head -1 || true)
if [[ -z "$DUMP" ]]; then
  echo "No dump matching $BACKUP_DIR/uniz-${SERVICE}_*.sql.gz" >&2
  exit 1
fi

echo "[drill] Using dump: $DUMP"
export PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-}}"

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DRILL_DB' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS $DRILL_DB;
CREATE DATABASE $DRILL_DB;
SQL

echo "[drill] Restoring..."
gunzip -c "$DUMP" | psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DRILL_DB" -v ON_ERROR_STOP=1 >/tmp/uniz-restore-drill.log

echo "[drill] Sanity checks..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DRILL_DB" -v ON_ERROR_STOP=1 <<'SQL'
SELECT 1 AS ok;
SELECT COUNT(*) AS schema_tables
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
SQL

echo "[drill] OK — database $DRILL_DB restored from $(basename "$DUMP")"
echo "[drill] Drop when finished: dropdb -h $PGHOST -p $PGPORT -U $PGUSER $DRILL_DB"
