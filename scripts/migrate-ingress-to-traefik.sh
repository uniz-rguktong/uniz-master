#!/usr/bin/env bash
# Migrate K3s cluster from archived ingress-nginx to Traefik (Ingress NGINX provider).
# Ref: https://ingressnginxmigration.org/
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALUES="$ROOT_DIR/infra/core-infra/kubernetes/base/shared/traefik/values.yaml"

info() { printf '%s\n' "$*"; }
fail() { printf '❌ %s\n' "$*" >&2; exit 1; }

command -v kubectl >/dev/null || fail "kubectl required"
command -v helm >/dev/null || fail "helm required — install: curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash"

if [ -z "${KUBECONFIG:-}" ] && [ -f /etc/rancher/k3s/k3s.yaml ]; then
  export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
fi

info "=== Pre-flight ==="
kubectl get pods -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx || true
NGINX_VER=$(kubectl get deploy -n ingress-nginx ingress-nginx-controller -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "unknown")
info "Current ingress-nginx image: $NGINX_VER"

info "=== Backup ingress + TLS ==="
BACKUP_DIR="/root/ingress-migration-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
kubectl get ingress -A -o yaml > "$BACKUP_DIR/ingress.yaml"
kubectl get certificate,certificateRequest,secret -A 2>/dev/null | grep -i tls > "$BACKUP_DIR/tls-resources.txt" || true
info "Backup saved to $BACKUP_DIR"

info "=== Install Traefik (Ingress NGINX provider) ==="
helm repo add traefik https://traefik.github.io/charts 2>/dev/null || true
helm repo update traefik

helm upgrade --install traefik traefik/traefik \
  --namespace traefik --create-namespace \
  --values "$VALUES" \
  --set service.type=ClusterIP \
  --timeout 5m

kubectl rollout status deployment/traefik -n traefik --timeout=180s

info "=== Smoke test Traefik via NodePort (HTTPS) ==="
WEBSECURE_NODE=$(kubectl get svc -n traefik traefik -o jsonpath='{.spec.ports[?(@.name=="websecure")].nodePort}')
CODE=$(curl -k -s -o /dev/null -w "%{http_code}" --max-time 10 \
  --resolve "api.uniz.rguktong.in:${WEBSECURE_NODE}:127.0.0.1" \
  "https://api.uniz.rguktong.in:${WEBSECURE_NODE}/api/v1/system/health" || echo 000)
info "Internal health via NodePort ${WEBSECURE_NODE}: HTTP $CODE"
[ "$CODE" = "200" ] || fail "Traefik not routing before cutover (HTTP $CODE)"

info "=== Cutover: stop ingress-nginx ==="
kubectl scale deployment/ingress-nginx-controller -n ingress-nginx --replicas=0 || true
sleep 5
kubectl delete svc ingress-nginx-controller -n ingress-nginx --ignore-not-found --wait=false || true
kubectl patch svc ingress-nginx-controller -n ingress-nginx -p '{"metadata":{"finalizers":null}}' --type=merge 2>/dev/null || true

helm upgrade traefik traefik/traefik \
  --namespace traefik \
  --values "$VALUES" \
  --set service.type=LoadBalancer \
  --timeout 5m

kubectl rollout status deployment/traefik -n traefik --timeout=180s
WEBSECURE_NODE=$(kubectl get svc -n traefik traefik -o jsonpath='{.spec.ports[?(@.name=="websecure")].nodePort}')

if grep -rq '127.0.0.1:30596' /etc/nginx 2>/dev/null; then
  info "=== Host nginx: point edge proxy at Traefik websecure NodePort ${WEBSECURE_NODE} ==="
  for f in /etc/nginx/sites-available/uniz-api /etc/nginx/sites-available/uniz-portal; do
    [ -f "$f" ] || continue
    cp "$f" "${f}.bak-traefik-$(date +%Y%m%d-%H%M%S)"
    sed -i "s|proxy_pass http://127.0.0.1:30596;|proxy_pass https://127.0.0.1:${WEBSECURE_NODE};\n        proxy_ssl_server_name on;\n        proxy_ssl_name \$host;\n        proxy_ssl_verify off;|" "$f"
  done
  nginx -t
  systemctl reload nginx
fi

info "=== Verify HTTPS (public) ==="
for i in $(seq 1 10); do
  CODE=$(curl -k -s -o /dev/null -w "%{http_code}" --max-time 10 https://api.uniz.rguktong.in/api/v1/system/health || echo 000)
  info "Health check attempt $i: HTTP $CODE"
  [ "$CODE" = "200" ] && break
  sleep 5
done

[ "$CODE" = "200" ] || fail "Health check failed after cutover (HTTP $CODE)"

info "=== Remove ingress-nginx ==="
helm uninstall ingress-nginx -n ingress-nginx 2>/dev/null \
  || kubectl delete namespace ingress-nginx --ignore-not-found

info "✅ Migration complete. Traefik now serves ingressClassName: nginx"
info "   Verify: kubectl get pods -n traefik && curl -k -I https://uniz.rguktong.in"
