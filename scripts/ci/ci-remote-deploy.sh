#!/usr/bin/env bash
# GitHub Actions → VPS entrypoint. Sync repo, render secrets, run deploy under flock.
set -euo pipefail

export DEPLOY_CONTEXT="${DEPLOY_CONTEXT:-GITHUB_ACTIONS}"
export KUBECONFIG="${KUBECONFIG:-/etc/rancher/k3s/k3s.yaml}"

GITHUB_REF_NAME="${GITHUB_REF_NAME:-main}"
GITHUB_SHA="${GITHUB_SHA:?GITHUB_SHA is required}"
WORK_DIR="${WORK_DIR:-/root/uniz-master-${GITHUB_REF_NAME}}"
export UNIZ_PLAIN_VAULT="${UNIZ_PLAIN_VAULT:-/root/uniz-secrets.env}"
export UNIZ_IMAGE_MANIFEST="${UNIZ_IMAGE_MANIFEST:-/root/.uniz_k8s_image_tags.json}"
export UNIZ_K8S_OVERLAY="${UNIZ_K8S_OVERLAY:-infra/kubernetes/overlays/production}"
export NAMESPACE="${NAMESPACE:-default}"
if [ -n "${UNIZ_ENV:-}" ]; then
  bash "$(dirname "$0")/assert-deploy-env.sh"
fi
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

# Prefer the on-box vault when present (narrows GH secret blast radius).
# The encrypted SOPS file wins. Plaintext is the fallback when that file or
# the sops binary is missing. CLOUDFLARE_TUNNEL_TOKEN stays empty.
# Set UNIZ_USE_EXISTING_VAULT=false to force re-render from the Actions env.
if [ -f "${UNIZ_SOPS_VAULT:-/root/uniz-secrets.env.sops}" ] && command -v sops >/dev/null 2>&1; then
  echo "[Secrets] Using /root/uniz-secrets.env.sops (decrypted at sync time)"
elif [ "${UNIZ_USE_EXISTING_VAULT:-true}" = "true" ] \
  && [ -f "$UNIZ_PLAIN_VAULT" ] \
  && grep -qE '^[A-Za-z_][A-Za-z0-9_]*=' "$UNIZ_PLAIN_VAULT"; then
  echo "[Secrets] Reusing existing $UNIZ_PLAIN_VAULT (UNIZ_USE_EXISTING_VAULT=true)"
else
  ./scripts/deploy/render-vps-secrets.sh "$UNIZ_PLAIN_VAULT"
fi
# Fill DBADMIN_DB_PASSWORD before the secret sync. Skip when SOPS is the
# source: that write only updates the plaintext file, which sync would ignore.
if [ -f "${UNIZ_SOPS_VAULT:-/root/uniz-secrets.env.sops}" ] && command -v sops >/dev/null 2>&1; then
  echo "[Secrets] Leaving the SOPS vault unchanged (no plaintext password write)"
else
  dbadmin_pw_status="$(./scripts/deploy/ensure-dbadmin-password.sh "$UNIZ_PLAIN_VAULT")"
  printf '%s\n' "$dbadmin_pw_status"
  if [ "$dbadmin_pw_status" = "generated DBADMIN_DB_PASSWORD (new)" ]; then
    export DBADMIN_PASSWORD_JUST_SET=1
  fi
fi
./scripts/deploy/ensure-ghcr-pull-secret.sh
# Keep k8s Secret in sync with the vault file used by pods.
./scripts/deploy/sync-k8s-secret-from-vault.sh "$UNIZ_PLAIN_VAULT" || true

export DEPLOY_SHA="$GITHUB_SHA"
export DEPLOY_BEFORE_SHA="${GITHUB_BEFORE_SHA:-}"
export USE_GHCR="${USE_GHCR:-true}"
export IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"
export GHCR_PULL_TOKEN="${GHCR_PULL_TOKEN:-}"
export GHCR_USERNAME="${GHCR_USERNAME:-uniz-rguktong}"

COMMIT_MSG="$(git log -1 --pretty=%B)"
if [ "${FORCE_REBUILD:-}" = "true" ]; then
  COMMIT_MSG="[rebuild all] $COMMIT_MSG"
fi
if [ -n "${SERVICES:-}" ]; then
  for tag in $SERVICES; do
    COMMIT_MSG="$COMMIT_MSG [rebuild $tag]"
  done
fi
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
  # Scale down retired always-on Deployments if they linger from prior releases.
  # Portal/landing are served from Cloudflare Pages — keep k8s replicas at 0.
  kubectl scale deploy/uniz-mail-service --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl scale deploy/uniz-files-service --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl scale deploy/uniz-cron-service --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl scale deploy/uniz-outpass-service --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl delete hpa uniz-outpass-service-hpa --ignore-not-found=true 2>/dev/null || true
  kubectl scale deploy/uniz-portal --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl delete hpa uniz-portal --ignore-not-found=true 2>/dev/null || true
  kubectl scale deploy/uniz-landing --replicas=0 --ignore-not-found=true 2>/dev/null || true
  # nginx hop removed: Traefik → gateway-api
  kubectl scale deploy/uniz-gateway --replicas=0 --ignore-not-found=true 2>/dev/null || true
  kubectl delete hpa uniz-gateway-hpa --ignore-not-found=true 2>/dev/null || true

  echo "[Smoke] Running post-deploy smoke checks (required)..."
  if ! PORTAL_URL="${PORTAL_URL:-https://uniz.rguktong.in}" \
    API_URL="${API_URL:-https://api-uniz.rguktong.in/api/v1}" \
    LANDING_API_URL="${LANDING_API_URL:-https://landing-api.rguktong.in}" \
    bash ./scripts/ops/post-deploy-smoke.sh; then
    echo "[Smoke] FAILED — marking deploy unsuccessful"
    ec=1
  else
    echo "[Smoke] OK"
  fi

  if [ -x ./scripts/ops/vps-vault-remote.sh ] || [ -f ./scripts/ops/vps-vault-remote.sh ]; then
    echo "[Vault] Auditing required keys on VPS..."
    bash ./scripts/ops/vps-vault-remote.sh audit || echo "[Vault] WARN — vault audit reported missing keys"
  fi
fi

exit "$ec"
