#!/usr/bin/env bash
# Postgres backup helper for UniZ VPS (Dockerized postgres preferred).
#
# Example (on VPS):
#   BACKUP_DIR=/var/backups/uniz bash scripts/ops/backup-postgres.sh
#
# Restore drill (manual):
#   gunzip -c $BACKUP_DIR/uniz_YYYYMMDD.sql.gz | docker exec -i uniz-postgres psql -U $POSTGRES_USER $POSTGRES_DB
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
CONTAINER="${POSTGRES_CONTAINER:-uniz-postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-uniz_db}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/uniz_${STAMP}.sql.gz"

if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "[backup] dumping via docker container $CONTAINER → $OUT"
  docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip -c >"$OUT"
else
  echo "[backup] container $CONTAINER not found; using local pg_dump"
  : "${DATABASE_URL:?Set DATABASE_URL or run against docker container}"
  pg_dump "$DATABASE_URL" | gzip -c >"$OUT"
fi

ls -lh "$OUT"
find "$BACKUP_DIR" -name 'uniz_*.sql.gz' -mtime +"$KEEP_DAYS" -delete 2>/dev/null || true
echo "[backup] done (retention ${KEEP_DAYS}d)"
