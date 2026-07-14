#!/usr/bin/env bash
# Install daily host-level storage cleanup cron on the VPS (idempotent).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLEANUP_SCRIPT="$SCRIPT_DIR/vps-storage-cleanup.sh"
CRON_LINE="0 2 * * * bash $CLEANUP_SCRIPT >> /var/log/uniz-storage-cleanup.log 2>&1"
MARKER="uniz-vps-storage-cleanup"

if [ ! -f "$CLEANUP_SCRIPT" ]; then
  echo "[install-storage-cron] Missing $CLEANUP_SCRIPT" >&2
  exit 1
fi

chmod +x "$CLEANUP_SCRIPT"

TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v "$MARKER" | grep -v "vps-storage-cleanup.sh" >"$TMP" || true
echo "$CRON_LINE # $MARKER" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "[install-storage-cron] Installed daily cleanup at 02:00 UTC"
crontab -l | grep "$MARKER" || true
