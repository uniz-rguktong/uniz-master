#!/usr/bin/env bash
# Cloudflare Tunnel for UniZ VPS — hides origin IP, proxied DNS without Total TLS ($0).
#
# Requires ONE of:
#   CLOUDFLARE_TUNNEL_TOKEN  — from Zero Trust → Networks → Tunnels → (tunnel) → Install connector
#   OR API token with Account → Cloudflare Tunnel → Edit (+ Zone DNS Edit)
#
# Idempotent. Safe to run on every deploy when token is set.
set -euo pipefail

ZONE_NAME="${ZONE_NAME:-rguktong.in}"
ORIGIN_URL="${TUNNEL_ORIGIN_URL:-https://127.0.0.1:443}"
TUNNEL_NAME="${TUNNEL_NAME:-uniz-vps}"
CF_DIR="/etc/cloudflared"
CONFIG="$CF_DIR/config.yml"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] && [[ -f /root/uniz-secrets.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /root/uniz-secrets.env
  set +a
fi

# Nested www.* (www.uniz, www.landing-api) are NOT in the tunnel — no free edge SSL.
# Use ensure-cloudflare-www-dns.sh (grey A) + install-nginx-www-redirects.sh instead.
HOSTS=(
  "rguktong.in"
  "uniz.rguktong.in"
  "api-uniz.rguktong.in"
  "landing-api.rguktong.in"
)

install_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    return 0
  fi
  echo "[tunnel] Installing cloudflared..."
  curl -sSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb" -o /tmp/cloudflared.deb
  dpkg -i /tmp/cloudflared.deb >/dev/null
}

write_local_config() {
  local tunnel_id="$1"
  mkdir -p "$CF_DIR"
  cat >"$CONFIG" <<YAML
# Managed by scripts/setup-cloudflare-tunnel.sh
tunnel: ${tunnel_id}
credentials-file: ${CF_DIR}/${tunnel_id}.json

ingress:
YAML
  for h in "${HOSTS[@]}"; do
    echo "  - hostname: ${h}" >>"$CONFIG"
    echo "    service: ${ORIGIN_URL}" >>"$CONFIG"
    echo "    originRequest:" >>"$CONFIG"
    echo "      noTLSVerify: true" >>"$CONFIG"
  done
  cat >>"$CONFIG" <<'YAML'
  - service: http_status:404
YAML
  chmod 600 "$CONFIG" "${CF_DIR}/${tunnel_id}.json" 2>/dev/null || true
}

upsert_tunnel_dns() {
  local tunnel_id="$1"
  local zone_id="$2"
  local cname="${tunnel_id}.cfargotunnel.com"

  for h in "${HOSTS[@]}"; do
    local short="$h"
    [[ "$h" == *".$ZONE_NAME" ]] && short="${h%.$ZONE_NAME}"
    [[ "$short" == "$ZONE_NAME" ]] && short="@"

    local existing
    existing=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records?name=${h}" \
      | python3 -c 'import sys,json; r=json.load(sys.stdin).get("result",[]); print(r[0]["id"] if r else "")')

    local payload
    payload=$(python3 - <<PY
import json
print(json.dumps({"type":"CNAME","name":"$short","content":"$cname","proxied":True,"ttl":1}))
PY
)

    if [[ -n "$existing" ]]; then
      curl -sS -X PUT "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records/$existing" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "$payload" >/dev/null
      echo "[tunnel] DNS updated (proxied CNAME): $h"
    else
      curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "$payload" >/dev/null
      echo "[tunnel] DNS created (proxied CNAME): $h"
    fi
  done
}

start_token_tunnel() {
  echo "[tunnel] Installing connector via CLOUDFLARE_TUNNEL_TOKEN..."
  cloudflared service uninstall 2>/dev/null || true
  cloudflared service install "$CLOUDFLARE_TUNNEL_TOKEN"
  systemctl enable cloudflared >/dev/null 2>&1 || true
  systemctl restart cloudflared
  echo "[tunnel] cloudflared service running (token mode)"
}

create_api_tunnel() {
  local account_id zone_id
  account_id=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"][0]["account"]["id"])')
  zone_id=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"][0]["id"])')

  local resp tunnel_id tunnel_token
  resp=$(curl -sS -X POST \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/accounts/$account_id/cfd_tunnel" \
    --data "{\"name\":\"$TUNNEL_NAME\",\"config_src\":\"local\"}")

  if ! echo "$resp" | python3 -c 'import sys,json; sys.exit(0 if json.load(sys.stdin).get("success") else 1)'; then
    echo "[tunnel] API tunnel create failed (need Cloudflare Tunnel Edit on token):" >&2
    echo "$resp" | python3 -m json.tool >&2
    return 1
  fi

  tunnel_id=$(echo "$resp" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["id"])')
  tunnel_token=$(echo "$resp" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["token"])')

  mkdir -p "$CF_DIR"
  echo "$resp" | python3 -c 'import sys,json; cred=json.load(sys.stdin)["result"]["credentials_file"]; import pathlib; p=pathlib.Path(sys.argv[1]); p.write_text(__import__("json").dumps(cred))' "$CF_DIR/${tunnel_id}.json"

  write_local_config "$tunnel_id"
  upsert_tunnel_dns "$tunnel_id" "$zone_id"

  cloudflared service uninstall 2>/dev/null || true
  cloudflared service install "$tunnel_token"
  systemctl enable cloudflared >/dev/null 2>&1 || true
  systemctl restart cloudflared
  echo "[tunnel] API tunnel $tunnel_id active"
}

sync_existing_tunnel() {
  if [[ ! -f "$CONFIG" ]]; then
    return 1
  fi
  local tunnel_id zone_id
  tunnel_id=$(grep -E '^tunnel:' "$CONFIG" | head -1 | awk '{print $2}')
  [[ -z "$tunnel_id" ]] && return 1

  zone_id=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "https://api.cloudflare.com/client/v4/zones?name=$ZONE_NAME" \
    | python3 -c 'import sys,json; r=json.load(sys.stdin)["result"]; print(r[0]["id"] if r else "")')
  [[ -z "$zone_id" ]] && return 1

  write_local_config "$tunnel_id"
  upsert_tunnel_dns "$tunnel_id" "$zone_id"
  systemctl restart cloudflared 2>/dev/null || true
  echo "[tunnel] Synced existing tunnel $tunnel_id (DNS + config)"
  return 0
}

main() {
  install_cloudflared

  if [[ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
    start_token_tunnel
    echo "[tunnel] Done (token mode). Configure public hostnames in Zero Trust dashboard if not already routed."
    return 0
  fi

  if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    if sync_existing_tunnel; then
      echo "[tunnel] Done (sync mode)"
      return 0
    fi
    if create_api_tunnel; then
      echo "[tunnel] Done (API mode)"
      return 0
    fi
  fi

  echo "[tunnel] Skipped — set CLOUDFLARE_TUNNEL_TOKEN in /root/uniz-secrets.env (free, from Cloudflare Zero Trust → Tunnels)" >&2
  exit 0
}

main "$@"
