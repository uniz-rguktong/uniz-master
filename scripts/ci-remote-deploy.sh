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
git checkout -B "$GITHUB_REF_NAME" "origin/$GITHUB_REF_NAME"
git reset --hard "$GITHUB_SHA"
git clean -fd

if [ "$(git rev-parse HEAD)" != "$GITHUB_SHA" ]; then
  echo "[Error] VPS checkout does not match GitHub SHA $GITHUB_SHA"
  exit 1
fi

./scripts/render-vps-secrets.sh /root/uniz-secrets.env
# shellcheck source=/dev/null
source /root/uniz-secrets.env
./scripts/ensure-ghcr-pull-secret.sh

export DEPLOY_SHA="$GITHUB_SHA"
export DEPLOY_BEFORE_SHA="${GITHUB_BEFORE_SHA:-}"
export USE_GHCR="${USE_GHCR:-true}"
export IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"
export USE_GHCR="${USE_GHCR:-true}"
export IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"
export GHCR_PULL_TOKEN="${GHCR_PULL_TOKEN:-}"
export GHCR_PULL_USER="${GHCR_PULL_USER:-uniz-rguktong}"

COMMIT_MSG="$(git log -1 --pretty=%B)"
echo "[Log] Last commit: $(echo "$COMMIT_MSG" | head -1)"

rm -f "$EXIT_FILE"
export COMMIT_MSG LOG_FILE EXIT_FILE

echo "[Deploy] Acquiring lock (log: $LOG_FILE)..."
flock -x "$LOCK_FILE" bash -ce '
  set -o pipefail
  /bin/bash ./scripts/deploy.sh "$COMMIT_MSG" 2>&1 | tee -a "$LOG_FILE"
  ec=${PIPESTATUS[0]}
  echo "$ec" > "$EXIT_FILE"
  exit "$ec"
'

ec="$(cat "$EXIT_FILE")"
echo "[Deploy] Finished with exit code $ec"
exit "$ec"
