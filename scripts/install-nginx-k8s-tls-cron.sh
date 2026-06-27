#!/usr/bin/env bash
# Daily sync of k8s TLS secret to host nginx (cert-manager renewals).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SYNC_SCRIPT="$ROOT/scripts/sync-nginx-k8s-tls.sh"
MARKER="uniz-sync-nginx-k8s-tls"
CRON_LINE="15 3 * * * bash $SYNC_SCRIPT >> /var/log/uniz-sync-nginx-k8s-tls.log 2>&1"

if [[ ! -f "$SYNC_SCRIPT" ]]; then
  echo "[install-nginx-k8s-tls-cron] Missing $SYNC_SCRIPT" >&2
  exit 1
fi

chmod +x "$SYNC_SCRIPT"

TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v "$MARKER" | grep -v "sync-nginx-k8s-tls.sh" >"$TMP" || true
echo "$CRON_LINE # $MARKER" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "[install-nginx-k8s-tls-cron] Installed daily TLS sync at 03:15 UTC"
crontab -l | grep "$MARKER" || true
