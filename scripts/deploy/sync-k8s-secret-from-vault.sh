#!/usr/bin/env bash
# Render / update the uniz-secrets Kubernetes Secret from the VPS vault file.
# Usage: bash scripts/deploy/sync-k8s-secret-from-vault.sh [/root/uniz-secrets.env]
#
# Unescapes shell-quoted vault values (%q) and rewrites Postgres hosts that
# only listen on loopback/cni0 (not the public NIC) so pods can connect.
set -euo pipefail

VAULT="${1:-/root/uniz-secrets.env}"
SECRET_NAME="${SECRET_NAME:-uniz-secrets}"
NAMESPACE="${NAMESPACE:-default}"
# Host Postgres publishes: 127.0.0.1 + 10.42.0.1 (cni0). Pods must use cni0.
POD_PG_HOST="${POD_PG_HOST:-10.42.0.1}"
PUBLIC_IP="${VPS_IP:-76.13.241.174}"

if [ ! -f "$VAULT" ]; then
  echo "[k8s-secret] Missing vault $VAULT" >&2
  exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "[k8s-secret] kubectl not found — skip" >&2
  exit 0
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

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
    # env-file format: no quotes
    lines_out.append(f"{key}={val}")

out.write_text("\n".join(lines_out) + "\n")
print(f"[k8s-secret] prepared {len(lines_out)} keys (pg host → {pod_host})")
PY

if [ ! -s "$TMP" ]; then
  echo "[k8s-secret] No key=value lines in $VAULT" >&2
  exit 1
fi

kubectl create secret generic "$SECRET_NAME" \
  --namespace="$NAMESPACE" \
  --from-env-file="$TMP" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "[k8s-secret] Applied Secret/$SECRET_NAME from $VAULT ($(wc -l <"$TMP") keys)"
