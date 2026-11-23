#!/usr/bin/env bash
# Render / update the uniz-secrets Kubernetes Secret from the VPS vault file.
# Usage: bash scripts/deploy/sync-k8s-secret-from-vault.sh [/root/uniz-secrets.env]
#
# When /root/uniz-secrets.env.sops exists and sops is installed, that file is
# decrypted to a mode-600 temp file, synced, and shredded. /root/uniz-secrets.env
# is the fallback when the SOPS file or the sops binary is missing.
# CLOUDFLARE_TUNNEL_TOKEN is intentionally empty. Do not invent a value; an
# empty line stays empty so in-cluster cloudflared is not scaled up.
#
# Unescapes shell-quoted vault values (%q) and rewrites Postgres hosts that
# only listen on loopback/cni0 (not the public NIC) so pods can connect.
set -euo pipefail

SOPS_VAULT="${UNIZ_SOPS_VAULT:-/root/uniz-secrets.env.sops}"
PLAIN_VAULT="${1:-${UNIZ_PLAIN_VAULT:-/root/uniz-secrets.env}}"
SECRET_NAME="${SECRET_NAME:-uniz-secrets}"
NAMESPACE="${NAMESPACE:-default}"
# Host Postgres publishes: 127.0.0.1 + 10.42.0.1 (cni0). Pods must use cni0.
POD_PG_HOST="${POD_PG_HOST:-10.42.0.1}"
PUBLIC_IP="${VPS_IP:-76.13.241.174}"

DECRYPTED=""
TMP=""
cleanup() {
  if [ -n "${DECRYPTED:-}" ] && [ -f "$DECRYPTED" ]; then
    shred -u "$DECRYPTED" 2>/dev/null || rm -f "$DECRYPTED"
  fi
  if [ -n "${TMP:-}" ] && [ -f "$TMP" ]; then
    shred -u "$TMP" 2>/dev/null || rm -f "$TMP"
  fi
}
trap cleanup EXIT

VAULT=""
if [ -f "$SOPS_VAULT" ] && command -v sops >/dev/null 2>&1; then
  DECRYPTED="$(mktemp)"
  chmod 600 "$DECRYPTED"
  if SOPS_AGE_KEY_FILE=/root/age/uniz-vault.key \
    sops --input-type dotenv --output-type dotenv -d "$SOPS_VAULT" >"$DECRYPTED"; then
    VAULT="$DECRYPTED"
    echo "[k8s-secret] Decrypted SOPS vault"
  else
    echo "[k8s-secret] ERROR: sops decrypt failed" >&2
    shred -u "$DECRYPTED" 2>/dev/null || rm -f "$DECRYPTED"
    DECRYPTED=""
    exit 1
  fi
elif [ -f "$SOPS_VAULT" ]; then
  echo "[k8s-secret] sops binary missing; using plaintext vault" >&2
fi

if [ -z "$VAULT" ]; then
  if [ -f "$PLAIN_VAULT" ]; then
    VAULT="$PLAIN_VAULT"
  else
    echo "[k8s-secret] Missing vault $PLAIN_VAULT" >&2
    exit 1
  fi
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "[k8s-secret] kubectl not found — skip" >&2
  exit 0
fi

TMP="$(mktemp)"
chmod 600 "$TMP"

POD_PG_HOST="$POD_PG_HOST" PUBLIC_IP="$PUBLIC_IP" VAULT="$VAULT" TMP="$TMP" python3 <<'PY'
import os, re, shlex
from pathlib import Path

vault = Path(os.environ["VAULT"])
out = Path(os.environ["TMP"])
pod_host = os.environ["POD_PG_HOST"]
public_ip = os.environ["PUBLIC_IP"]

def rewrite_db(val: str) -> str:
    if "DATABASE_URL" in val or val.startswith("postgresql"):
        pass
    # Always rewrite common PG hosts in any value that looks like a PG URL
    if "postgresql" in val or val.startswith("postgres"):
        val = re.sub(rf"@(?:{re.escape(public_ip)}|127\.0\.0\.1)(?::\d+)?", f"@{pod_host}:5432", val)
        val = re.sub(rf"@{re.escape(pod_host)}:5432:5432", f"@{pod_host}:5432", val)
    return val

lines_out = []
for raw in vault.read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, _, val = line.partition("=")
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", key):
        continue
    # Unescape bash %q / eval-style quoting when present
    try:
        parts = shlex.split(val, posix=True)
        if len(parts) == 1:
            val = parts[0]
    except ValueError:
        val = val.replace("\\?", "?").replace("\\&", "&").replace("\\$", "$")
    if key.endswith("DATABASE_URL") or key in {"DATABASE_URL", "LANDING_DATABASE_URL"}:
        val = rewrite_db(val)
    if key == "DB_HOST" and val in {public_ip, "127.0.0.1", "api.uniz.rguktong.in"}:
        val = pod_host
    # CLOUDFLARE_TUNNEL_TOKEN stays as stored. Empty stays empty.
    # env-file format: no quotes
    lines_out.append(f"{key}={val}")

out.write_text("\n".join(lines_out) + "\n")
print(f"[k8s-secret] prepared {len(lines_out)} keys (pg host → {pod_host})")
PY

if [ ! -s "$TMP" ]; then
  echo "[k8s-secret] No key=value lines in vault" >&2
  exit 1
fi

kubectl create secret generic "$SECRET_NAME" \
  --namespace="$NAMESPACE" \
  --from-env-file="$TMP" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "[k8s-secret] Applied Secret/$SECRET_NAME ($(wc -l <"$TMP") keys)"
