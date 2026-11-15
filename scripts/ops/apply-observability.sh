#!/usr/bin/env bash
# Apply Netdata + Uptime Kuma to the VPS cluster (free, self-hosted).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
kubectl apply -k "$ROOT/infra/kubernetes/base/observability"
echo "[obs] Waiting for rollouts..."
kubectl -n uniz-observability rollout status deploy/netdata --timeout=180s || true
kubectl -n uniz-observability rollout status deploy/uptime-kuma --timeout=180s || true
kubectl -n uniz-observability get pods,svc
echo "[obs] Port-forward examples:"
echo "  kubectl -n uniz-observability port-forward svc/netdata 19999:19999"
echo "  kubectl -n uniz-observability port-forward svc/uptime-kuma 3001:3001"
echo "Then configure Uptime Kuma monitors for uniz.rguktong.in, rguktong.in, api-uniz.rguktong.in/api/v1/system/health"
