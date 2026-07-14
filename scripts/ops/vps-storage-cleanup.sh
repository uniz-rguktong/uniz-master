#!/usr/bin/env bash
# Host-level VPS disk cleanup (K3s/containerd + optional Docker).
# Run manually, from root cron, or after deploy on the VPS.
set -euo pipefail

LOG_TAG="[STORAGE]"
echo "$LOG_TAG Starting VPS storage cleanup ($(date -Is))..."

run_if() {
  local tool="$1"
  local name="$2"
  local cmd="$3"
  if command -v "$tool" >/dev/null 2>&1; then
    echo "$LOG_TAG $name..."
    eval "$cmd" || echo "$LOG_TAG Warning: $name failed (non-fatal)"
  else
    echo "$LOG_TAG Skipping $name — '$tool' not found"
  fi
}

echo "$LOG_TAG Disk before:"
df -h / | tail -1

# --- K3s / containerd (primary consumer on UniZ VPS) ---
CRI_SOCK="/run/k3s/containerd/containerd.sock"
export CRICTL_TIMEOUT="${CRICTL_TIMEOUT:-10m}"

if command -v k3s >/dev/null 2>&1; then
  echo "$LOG_TAG K3s image prune (crictl, timeout=$CRICTL_TIMEOUT)..."
  k3s crictl rmi --prune 2>/dev/null || true
  echo "$LOG_TAG K3s containerd prune (ctr --all)..."
  k3s ctr -n k8s.io images prune --all 2>/dev/null || true
elif [ -S "$CRI_SOCK" ] && command -v crictl >/dev/null 2>&1; then
  echo "$LOG_TAG crictl image prune..."
  crictl --runtime-endpoint "unix://$CRI_SOCK" rmi --prune 2>/dev/null || true
fi

# --- Docker (landing backend compose, legacy) ---
run_if docker "Docker system prune" \
  'docker system prune -af --volumes --filter "until=24h" 2>/dev/null || true'
run_if docker "Docker image prune" \
  'docker image prune -af --filter "until=24h" 2>/dev/null || true'
run_if docker "Docker build cache prune" \
  'docker builder prune -af --filter "until=24h" 2>/dev/null || true'

if [ -d /var/lib/docker/containers ]; then
  echo "$LOG_TAG Truncating Docker container JSON logs..."
  find /var/lib/docker/containers/ -name '*-json.log' -exec truncate -s 0 {} \; 2>/dev/null || true
fi

# K3s / containerd pod logs on host
if [ -d /var/lib/rancher/k3s/agent/containerd ]; then
  echo "$LOG_TAG Truncating large containerd logs..."
  find /var/lib/rancher/k3s/agent/containerd -name '*.log' -size +10M -exec truncate -s 0 {} \; 2>/dev/null || true
fi

run_if journalctl "Journal vacuum (2 days)" "journalctl --vacuum-time=2d"
run_if apt-get "APT clean" "apt-get clean && apt-get autoremove -y"

echo "$LOG_TAG Clearing temp directories..."
rm -rf /tmp/* /var/tmp/* 2>/dev/null || true

echo "$LOG_TAG Disk after:"
df -h / /var/lib/rancher 2>/dev/null || df -h /
if [ -d /var/lib/rancher ]; then
  du -sh /var/lib/rancher 2>/dev/null || true
fi
echo "$LOG_TAG Done."
