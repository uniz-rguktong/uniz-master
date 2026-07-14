#!/usr/bin/env bash
# Sync cert-manager TLS secret from k8s to host nginx (www.* SANs for grey-cloud DNS).
set -euo pipefail

DEST_DIR="/etc/nginx/uniz-k8s-tls"
SECRET_NAME="${TLS_SECRET_NAME:-uniz-tls-cert}"
NAMESPACE="${TLS_NAMESPACE:-default}"

mkdir -p "$DEST_DIR"
kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath='{.data.tls\.crt}' | base64 -d >"$DEST_DIR/fullchain.pem"
kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath='{.data.tls\.key}' | base64 -d >"$DEST_DIR/privkey.pem"
chmod 600 "$DEST_DIR/privkey.pem"

nginx -t
systemctl reload nginx
echo "[sync-nginx-k8s-tls] Updated $DEST_DIR from secret/$SECRET_NAME"
