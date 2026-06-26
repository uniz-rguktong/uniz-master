#!/usr/bin/env bash
# Host-level VPS disk cleanup (K3s + optional Docker). Safe to run manually or from cron on the VPS.
set -euo pipefail

echo "[STORAGE] Starting VPS storage cleanup ($(date -Is))..."

run_if() {
  local tool="$1"
  local name="$2"
  local cmd="$3"
  if command -v "$tool" >/dev/null 2>&1; then
    echo "[STORAGE] $name..."
    eval "$cmd" || echo "[STORAGE] Warning: $name failed (non-fatal)"
  else
    echo "[STORAGE] Skipping $name — '$tool' not found"
  fi
}

run_if docker "Docker system prune" \
  'docker system prune -af --volumes --filter "until=24h" 2>/dev/null || true'
run_if docker "Docker image prune" \
  'docker image prune -af --filter "until=24h" 2>/dev/null || true'
run_if docker "Docker build cache prune" \
  'docker builder prune -af --filter "until=24h" 2>/dev/null || true'

if [ -d /var/lib/docker/containers ]; then
  echo "[STORAGE] Truncating container JSON logs..."
  find /var/lib/docker/containers/ -name '*-json.log' -exec truncate -s 0 {} \; 2>/dev/null || true
fi

CRI_SOCK="/run/k3s/containerd/containerd.sock"
if [ -S "$CRI_SOCK" ]; then
  echo "[STORAGE] K3s image prune (crictl)..."
  crictl --runtime-endpoint "unix://$CRI_SOCK" rmi --prune 2>/dev/null || true
  if command -v k3s >/dev/null 2>&1; then
    k3s crictl rmi --prune 2>/dev/null || true
  fi
fi

run_if journalctl "Journal vacuum (1 day)" "journalctl --vacuum-time=1d"
run_if apt-get "APT clean" "apt-get clean && apt-get autoremove -y"

echo "[STORAGE] Clearing temp directories..."
rm -rf /tmp/* /var/tmp/* 2>/dev/null || true

echo "[STORAGE] Disk usage after cleanup:"
df -h / /var 2>/dev/null || df -h /
echo "[STORAGE] Done."
