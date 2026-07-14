#!/usr/bin/env bash
# Shared deploy env block for GitHub Actions (self-hosted VPS runner).
# Sourced by workflow — not run directly.
set -euo pipefail

export DEPLOY_CONTEXT="${DEPLOY_CONTEXT:-GITHUB_ACTIONS}"
export KUBECONFIG="${KUBECONFIG:-/etc/rancher/k3s/k3s.yaml}"
export USE_GHCR="${USE_GHCR:-true}"
export IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"
export GITHUB_SHA="${GITHUB_SHA:?GITHUB_SHA required}"
export GITHUB_REF_NAME="${GITHUB_REF_NAME:-main}"
export GITHUB_BEFORE_SHA="${GITHUB_BEFORE_SHA:-}"
export GITHUB_ACTOR="${GITHUB_ACTOR:-github-actions}"

bash "$(dirname "$0")/ci-remote-deploy.sh"
