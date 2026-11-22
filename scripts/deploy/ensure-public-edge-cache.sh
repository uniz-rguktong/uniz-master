#!/usr/bin/env bash
# Idempotent Cloudflare cache rule for anonymous public landing GETs.
# Respects origin Cache-Control. Does not print CLOUDFLARE_API_TOKEN.
set -euo pipefail

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] && [[ -f /root/uniz-secrets.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /root/uniz-secrets.env
  set +a
fi

exec python3 "$(dirname "$0")/ensure_public_edge_cache.py"
