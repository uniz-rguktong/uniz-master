#!/usr/bin/env bash
# Refuse to run a deploy whose target is ambiguous or crosses environments.
#
# UNIZ_ENV=production  -> only allowed from refs/heads/main.
# UNIZ_ENV=staging     -> only allowed from refs/heads/staging, and every
#                         target below must be set explicitly and must differ
#                         from the production value. Nothing falls back to prod.
#
# Names only; no values are printed other than non-secret hostnames/paths.
set -euo pipefail

ENV_NAME="${UNIZ_ENV:-}"
REF="${GITHUB_REF:-refs/heads/${GITHUB_REF_NAME:-}}"

PROD_PORTAL="https://uniz.rguktong.in"
PROD_API="https://api-uniz.rguktong.in/api/v1"
PROD_LANDING_API="https://landing-api.rguktong.in"
PROD_VAULT="/root/uniz-secrets.env"
PROD_MANIFEST="/root/.uniz_k8s_image_tags.json"
PROD_WORK_DIR="/root/uniz-master-main"
PROD_OVERLAY="infra/kubernetes/overlays/production"

fail() { echo "[deploy-guard] $*" >&2; exit 1; }

case "$ENV_NAME" in
  production)
    [ "$REF" = "refs/heads/main" ] || fail "production deploys run only from main (got $REF)"
    ;;
  staging)
    [ "$REF" = "refs/heads/staging" ] || fail "staging deploys run only from staging (got $REF)"
    required=(PORTAL_URL API_URL LANDING_API_URL UNIZ_PLAIN_VAULT UNIZ_IMAGE_MANIFEST WORK_DIR UNIZ_K8S_OVERLAY NAMESPACE)
    for v in "${required[@]}"; do
      [ -n "${!v:-}" ] || fail "staging requires $v (set it as a variable on the staging environment)"
    done
    [ "$PORTAL_URL" != "$PROD_PORTAL" ] || fail "PORTAL_URL points at production"
    [ "$API_URL" != "$PROD_API" ] || fail "API_URL points at production"
    [ "$LANDING_API_URL" != "$PROD_LANDING_API" ] || fail "LANDING_API_URL points at production"
    [ "$UNIZ_PLAIN_VAULT" != "$PROD_VAULT" ] || fail "UNIZ_PLAIN_VAULT is the production vault"
    [ "$UNIZ_IMAGE_MANIFEST" != "$PROD_MANIFEST" ] || fail "UNIZ_IMAGE_MANIFEST is the production manifest"
    [ "$WORK_DIR" != "$PROD_WORK_DIR" ] || fail "WORK_DIR is the production work dir"
    [ "$UNIZ_K8S_OVERLAY" != "$PROD_OVERLAY" ] || fail "UNIZ_K8S_OVERLAY is the production overlay"
    case "$NAMESPACE" in default|kube-system|"") fail "NAMESPACE must be a dedicated staging namespace" ;; esac
    ;;
  *)
    fail "UNIZ_ENV must be 'production' or 'staging' (got '${ENV_NAME}')"
    ;;
esac

echo "[deploy-guard] OK env=$ENV_NAME ref=$REF"
