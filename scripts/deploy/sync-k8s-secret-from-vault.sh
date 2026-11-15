#!/usr/bin/env bash
# Render / update the uniz-secrets Kubernetes Secret from the VPS vault file.
# Usage: bash scripts/deploy/sync-k8s-secret-from-vault.sh [/root/uniz-secrets.env]
set -euo pipefail

VAULT="${1:-/root/uniz-secrets.env}"
SECRET_NAME="${SECRET_NAME:-uniz-secrets}"
NAMESPACE="${NAMESPACE:-default}"

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

# Keep only KEY=VALUE lines; strip comments/blank.
grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$VAULT" >"$TMP" || true
if [ ! -s "$TMP" ]; then
  echo "[k8s-secret] No key=value lines in $VAULT" >&2
  exit 1
fi

kubectl create secret generic "$SECRET_NAME" \
  --namespace="$NAMESPACE" \
  --from-env-file="$TMP" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "[k8s-secret] Applied Secret/$SECRET_NAME from $VAULT ($(wc -l <"$TMP") keys)"
