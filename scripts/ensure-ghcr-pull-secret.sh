#!/usr/bin/env bash
# Ensure k3s can pull private images from ghcr.io
set -euo pipefail

if [ -z "${GHCR_PULL_TOKEN:-}" ] || [ -z "${GHCR_USERNAME:-}" ]; then
  echo "[GHCR] GHCR_PULL_TOKEN or GHCR_USERNAME unset — skipping pull secret"
  exit 0
fi

echo "[GHCR] Syncing imagePullSecret ghcr-pull..."
kubectl create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io \
  --docker-username="$GHCR_USERNAME" \
  --docker-password="$GHCR_PULL_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -

patch_pull_secret() {
  local kind="$1" name="$2"
  if ! kubectl get "$kind/$name" &>/dev/null; then
    return 0
  fi
  if kubectl get "$kind/$name" -o jsonpath='{.spec.template.spec.imagePullSecrets[*].name}' 2>/dev/null | grep -qw ghcr-pull; then
    return 0
  fi
  kubectl patch "$kind/$name" --type=json \
    -p='[{"op":"add","path":"/spec/template/spec/imagePullSecrets","value":[{"name":"ghcr-pull"}]}]' 2>/dev/null \
    || kubectl patch "$kind/$name" --type=json \
    -p='[{"op":"add","path":"/spec/template/spec/imagePullSecrets/-","value":{"name":"ghcr-pull"}}]' 2>/dev/null \
    || true
}

while IFS= read -r dep; do
  [ -z "$dep" ] && continue
  patch_pull_secret deployment "${dep#deployment/}"
done < <(kubectl get deployments -o name 2>/dev/null || true)

while IFS= read -r cj; do
  [ -z "$cj" ] && continue
  patch_pull_secret cronjob "${cj#cronjob/}"
done < <(kubectl get cronjobs -o name 2>/dev/null || true)

echo "[GHCR] Pull secret ready"
