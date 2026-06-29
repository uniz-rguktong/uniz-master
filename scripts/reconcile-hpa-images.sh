#!/usr/bin/env bash
# After apply/scale: ensure HPA workloads use GHCR images and drop broken pods.
set -euo pipefail

# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

MANIFEST="${1:-/root/.uniz_k8s_image_tags.json}"

if [ -f "$MANIFEST" ]; then
  bash "$(dirname "$0")/restore-ghcr-images-from-manifest.sh" "$MANIFEST"
fi

CRITICAL=(
  "uniz-gateway:gateway-nginx"
  "uniz-gateway-api:gateway-api"
  "uniz-auth-service:auth-service"
  "uniz-portal:portal"
  "uniz-landing:landing"
)

for pair in "${CRITICAL[@]}"; do
  IFS=':' read -r DEP CON <<< "$pair"
  kubectl get deployment "$DEP" &>/dev/null || continue
  kubectl patch "deployment/$DEP" --type=json \
    -p '[{"op":"replace","path":"/spec/template/spec/containers/0/imagePullPolicy","value":"IfNotPresent"}]' \
    2>/dev/null || true
done

# Remove pods stuck pulling docker.io/library/uniz-*:local
kubectl get pods -A -o json 2>/dev/null | node -e "
const pods = JSON.parse(require('fs').readFileSync(0, 'utf8')).items || [];
for (const p of pods) {
  const st = (p.status.containerStatuses || [])[0]?.state?.waiting;
  if (!st) continue;
  if (st.reason !== 'ImagePullBackOff' && st.reason !== 'ErrImagePull') continue;
  const img = (p.spec.containers || [])[0]?.image || '';
  if (img.includes(':local') && !img.includes('ghcr.io')) {
    console.log(p.metadata.namespace + '/' + p.metadata.name);
  }
}
" | while read -r pod; do
  [ -z "$pod" ] && continue
  ns="${pod%%/*}"
  name="${pod#*/}"
  echo "[Reconcile] Deleting broken pod $name"
  kubectl delete pod -n "$ns" "$name" --grace-period=0 --force 2>/dev/null || true
done

echo "[Reconcile] HPA image reconciliation complete."
