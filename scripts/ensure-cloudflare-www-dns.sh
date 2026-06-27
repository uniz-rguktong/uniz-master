#!/usr/bin/env bash
# Ensure www.* DNS records exist in Cloudflare (idempotent).
#
# Default: grey-cloud A → VPS IP (works with host nginx + k8s TLS for nested www hosts).
# With --proxied: CNAME → apex, proxied=true (requires Cloudflare Total TLS for nested subdomains).
#
# Requires CLOUDFLARE_API_TOKEN with Zone:DNS:Edit on rguktong.in
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROXIED=false
VPS_IP="${VPS_IP:-76.13.241.174}"
ZONE_NAME="${ZONE_NAME:-rguktong.in}"

if [[ "${1:-}" == "--proxied" ]]; then
  PROXIED=true
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] && [[ -f /root/uniz-secrets.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /root/uniz-secrets.env
  set +a
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "[cloudflare-www-dns] CLOUDFLARE_API_TOKEN not set" >&2
  exit 1
fi

ZONE_ID=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" \
  | python3 -c 'import sys,json; r=json.load(sys.stdin)["result"]; print(r[0]["id"] if r else "")')

if [[ -z "$ZONE_ID" ]]; then
  echo "[cloudflare-www-dns] Zone not found: $ZONE_NAME" >&2
  exit 1
fi

upsert_record() {
  local name="$1"
  local apex="$2"
  local fqdn="${name}.${ZONE_NAME}"

  local existing
  existing=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$fqdn" \
    | python3 -c 'import sys,json; r=json.load(sys.stdin).get("result",[]); print(r[0]["id"] if r else "")')

  local payload
  if [[ "$PROXIED" == true ]]; then
    payload=$(python3 - <<PY
import json
print(json.dumps({"type":"CNAME","name":"$name","content":"$apex","proxied":True,"ttl":1}))
PY
)
  else
    payload=$(python3 - <<PY
import json
print(json.dumps({"type":"A","name":"$name","content":"$VPS_IP","proxied":False,"ttl":1}))
PY
)
  fi

  if [[ -n "$existing" ]]; then
    curl -sS -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$existing" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$payload" >/dev/null
    echo "[cloudflare-www-dns] updated $fqdn"
  else
    curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$payload" >/dev/null
    echo "[cloudflare-www-dns] created $fqdn"
  fi
}

upsert_record "www.uniz" "uniz.rguktong.in"
upsert_record "www.api.uniz" "api.uniz.rguktong.in"
upsert_record "www.landing-api" "landing-api.rguktong.in"

echo "[cloudflare-www-dns] Done (proxied=$PROXIED, ip=$VPS_IP)"
