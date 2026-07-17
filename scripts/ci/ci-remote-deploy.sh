#!/usr/bin/env bash
# GitHub Actions → VPS entrypoint. Sync repo, render secrets, run deploy under flock.
set -euo pipefail

export DEPLOY_CONTEXT="${DEPLOY_CONTEXT:-GITHUB_ACTIONS}"
export KUBECONFIG="${KUBECONFIG:-/etc/rancher/k3s/k3s.yaml}"

GITHUB_REF_NAME="${GITHUB_REF_NAME:-main}"
GITHUB_SHA="${GITHUB_SHA:?GITHUB_SHA is required}"
WORK_DIR="${WORK_DIR:-/root/uniz-master-${GITHUB_REF_NAME}}"
LOCK_FILE="/var/lock/uniz-deploy.lock"
LOG_FILE="/var/log/uniz-deploy.log"
EXIT_FILE="/var/run/uniz-deploy.exit"

mkdir -p "$(dirname "$LOG_FILE")" "$(dirname "$EXIT_FILE")"

echo "[CI] Triggered by ${GITHUB_ACTOR:-unknown} — sha=${GITHUB_SHA:0:7}"

if [ ! -d "$WORK_DIR/.git" ]; then
  echo "[Setup] Cloning into $WORK_DIR"
  git clone https://github.com/uniz-rguktong/uniz-master.git "$WORK_DIR"
fi

cd "$WORK_DIR"
git fetch origin "$GITHUB_REF_NAME"
# Discard manual/rsync edits on VPS so checkout never blocks CI deploys
git reset --hard "origin/$GITHUB_REF_NAME"
git clean -fd
git checkout -B "$GITHUB_REF_NAME" "origin/$GITHUB_REF_NAME"
git reset --hard "$GITHUB_SHA"
git clean -fd

if [ "$(git rev-parse HEAD)" != "$GITHUB_SHA" ]; then
  echo "[Error] VPS checkout does not match GitHub SHA $GITHUB_SHA"
  exit 1
fi

./scripts/deploy/render-vps-secrets.sh /root/uniz-secrets.env
./scripts/deploy/ensure-ghcr-pull-secret.sh

export DEPLOY_SHA="$GITHUB_SHA"
export DEPLOY_BEFORE_SHA="${GITHUB_BEFORE_SHA:-}"
export USE_GHCR="${USE_GHCR:-true}"
export IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"
export GHCR_PULL_TOKEN="${GHCR_PULL_TOKEN:-}"
export GHCR_USERNAME="${GHCR_USERNAME:-uniz-rguktong}"

COMMIT_MSG="$(git log -1 --pretty=%B)"
echo "[Log] Last commit: $(echo "$COMMIT_MSG" | head -1)"

rm -f "$EXIT_FILE"
export COMMIT_MSG LOG_FILE EXIT_FILE

echo "[Deploy] Acquiring lock (log: $LOG_FILE)..."
flock -x "$LOCK_FILE" bash -ce '
  set -o pipefail
  /bin/bash ./scripts/deploy/deploy.sh "$COMMIT_MSG" 2>&1 | tee -a "$LOG_FILE"
  ec=${PIPESTATUS[0]}
  echo "$ec" > "$EXIT_FILE"
  exit "$ec"
'

ec="$(cat "$EXIT_FILE")"
echo "[Deploy] Finished with exit code $ec"

if [ "$ec" = "0" ]; then
  echo "[Smoke] Running post-deploy smoke checks..."
  if PORTAL_URL="${PORTAL_URL:-https://uniz.rguktong.in}" \
    API_URL="${API_URL:-https://api-uniz.rguktong.in/api/v1}" \
    bash ./scripts/ops/post-deploy-smoke.sh; then
    echo "[Smoke] OK"
  else
    echo "[Smoke] WARN — smoke checks failed (deploy itself succeeded)"
  fi

  # Scale down retired always-on Deployments if they linger from prior releases
  kubectl scale deploy/uniz-mail-service --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl scale deploy/uniz-files-service --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl scale deploy/uniz-cron-service --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl scale deploy/uniz-outpass-service --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl delete hpa uniz-outpass-service-hpa --ignore-not-found=true 2>/dev/null || true
fi

exit "$ec"
