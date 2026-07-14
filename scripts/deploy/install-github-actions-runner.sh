#!/usr/bin/env bash
# Install GitHub Actions self-hosted runner on the VPS (one-time).
# Usage: GITHUB_RUNNER_TOKEN=<token from GitHub UI> bash scripts/install-github-actions-runner.sh
#
# GitHub → repo Settings → Actions → Runners → New self-hosted runner → copy token.
set -euo pipefail

RUNNER_VERSION="${RUNNER_VERSION:-2.323.0}"
RUNNER_DIR="${RUNNER_DIR:-/opt/actions-runner}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,linux,uniz-vps}"
REPO="${GITHUB_REPOSITORY:-uniz-rguktong/uniz-master}"

if [[ -z "${GITHUB_RUNNER_TOKEN:-}" ]]; then
  echo "Set GITHUB_RUNNER_TOKEN from GitHub → Settings → Actions → Runners → New self-hosted runner" >&2
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "Run as root on the VPS" >&2
  exit 1
fi

apt-get update -qq
apt-get install -y -qq curl jq libicu-dev >/dev/null

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [[ ! -f ./config.sh ]]; then
  curl -sSL -o actions-runner.tar.gz \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  tar xzf actions-runner.tar.gz
  rm -f actions-runner.tar.gz
fi

# GitHub runner blocks root unless explicitly allowed (VPS deploy runs as root today).
export RUNNER_ALLOW_RUNASROOT=1

./config.sh \
  --url "https://github.com/${REPO}" \
  --token "$GITHUB_RUNNER_TOKEN" \
  --name "$(hostname)-uniz" \
  --labels "$RUNNER_LABELS" \
  --unattended \
  --replace

./svc.sh install
./svc.sh start
./svc.sh status

echo "[runner] Installed at $RUNNER_DIR with labels: $RUNNER_LABELS"
