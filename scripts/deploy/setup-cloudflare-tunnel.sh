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

# Portal + landing SPAs are on Cloudflare Pages — do NOT tunnel those hostnames
# back to the VPS (would fight Pages DNS). Tunnel APIs only.
# Nested www.* (www.landing-api) use ensure-cloudflare-www-dns.sh if needed.
HOSTS=(
  "api-uniz.rguktong.in"
  "landing-api.rguktong.in"
  "dbadmin.rguktong.in"
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
# Managed by scripts/deploy/setup-cloudflare-tunnel.sh
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

# True when secret/uniz-secrets has a non-empty CLOUDFLARE_TUNNEL_TOKEN.
# The value is never printed.
cloudflared_secret_present() {
  command -v kubectl >/dev/null 2>&1 || return 1
  local b64
  b64="$(kubectl get secret uniz-secrets -n "${NAMESPACE:-default}" -o jsonpath='{.data.CLOUDFLARE_TUNNEL_TOKEN}' 2>/dev/null || true)"
  [[ -n "$b64" ]] || return 1
  printf '%s' "$b64" | base64 -d 2>/dev/null | grep -q '[^[:space:]]'
}

# Ready when both in-cluster connectors have registered with Cloudflare.
# Pod logs are not printed. The host systemd connector is never stopped here:
# it stays up as the fallback, so the tunnel survives if the pods fail later.
# The manifest ships replicas: 0; this scales to 2 only when the token is in
# secret/uniz-secrets, so a missing token never leaves pods crash-looping.
wait_for_in_cluster_connectors() {
  command -v kubectl >/dev/null 2>&1 || return 1
  kubectl get deploy cloudflared -n "${NAMESPACE:-default}" >/dev/null 2>&1 || return 1
  if ! cloudflared_secret_present; then
    echo "[tunnel] CLOUDFLARE_TUNNEL_TOKEN is absent from secret/uniz-secrets. Leaving the host connector in place."
    kubectl scale deploy/cloudflared -n "${NAMESPACE:-default}" --replicas=0 >/dev/null 2>&1 || true
    return 1
  fi
  kubectl scale deploy/cloudflared -n "${NAMESPACE:-default}" --replicas=2 >/dev/null 2>&1 || return 1
  echo "[tunnel] Waiting for 2 in-cluster cloudflared connectors to register..."
  kubectl rollout status deploy/cloudflared -n "${NAMESPACE:-default}" --timeout=180s || return 1
  local attempt pod ready registered
  ready=0
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
    ready="$(kubectl get deploy cloudflared -n "${NAMESPACE:-default}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || true)"
    registered=0
    while IFS= read -r pod; do
      [[ -z "$pod" ]] && continue
      if kubectl logs "pod/${pod}" -n "${NAMESPACE:-default}" --tail=200 2>/dev/null | grep -q "Registered tunnel connection"; then
        registered=$((registered + 1))
      fi
    done < <(kubectl get pods -n "${NAMESPACE:-default}" -l app=cloudflared --field-selector=status.phase=Running -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)
    if [[ "${ready:-0}" -ge 2 && "$registered" -ge 2 ]]; then
      echo "[tunnel] In-cluster connectors registered: ${registered}"
      return 0
    fi
    sleep 4
  done
  echo "[tunnel] In-cluster connectors did not register (ready=${ready:-0}). Host cloudflared stays up."
  return 1
}

# Host unit reads the token from a mode-600 EnvironmentFile. ExecStart has no
# --token, so the token is not on the process command line.
install_host_connector() {
  local token="$1"
  local bin token_env tmp
  bin="$(command -v cloudflared)"
  cloudflared service uninstall >/dev/null 2>&1 || true
  mkdir -p "$CF_DIR"
  token_env="$CF_DIR/token.env"
  tmp="$(mktemp)"
  chmod 600 "$tmp"
  printf 'TUNNEL_TOKEN=%s\n' "$token" >"$tmp"
  mv "$tmp" "$token_env"
  chmod 600 "$token_env"
  cat > /etc/systemd/system/cloudflared.service <<EOF
[Unit]
Description=cloudflared
After=network-online.target
Wants=network-online.target

[Service]
TimeoutStartSec=15
Type=notify
EnvironmentFile=/etc/cloudflared/token.env
ExecStart=${bin} --no-autoupdate tunnel run
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable cloudflared >/dev/null 2>&1 || true
  systemctl restart cloudflared
}

start_token_tunnel() {
  echo "[tunnel] Installing host connector (EnvironmentFile=/etc/cloudflared/token.env, mode 600)..."
  install_host_connector "$CLOUDFLARE_TUNNEL_TOKEN"
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

  install_host_connector "$tunnel_token"
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

# Token-mode tunnels keep ingress in Cloudflare, not in the local file.
# Add dbadmin.rguktong.in when it is missing. Never print the API body.
ensure_dbadmin_tunnel_ingress() {
  [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] && return 0
  local account_id tunnel_id cfg result
  account_id=$(curl -fsS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/zones?name=${ZONE_NAME}" \
    | python3 -c 'import json,sys
try:
    print(json.load(sys.stdin)["result"][0]["account"]["id"])
except Exception:
    raise SystemExit(1)') || {
    echo "[tunnel] WARN: could not read the Cloudflare account; dbadmin ingress was not checked" >&2
    return 0
  }
  tunnel_id=$(curl -fsS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/accounts/${account_id}/cfd_tunnel?name=${TUNNEL_NAME}&is_deleted=false" \
    | python3 -c 'import json,sys
try:
    rows = json.load(sys.stdin).get("result") or []
    print(rows[0]["id"] if rows else "")
except Exception:
    raise SystemExit(1)') || {
    echo "[tunnel] WARN: could not list tunnels; dbadmin ingress was not checked" >&2
    return 0
  }
  [[ -n "$tunnel_id" ]] || return 0

  cfg=$(curl -fsS -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/accounts/${account_id}/cfd_tunnel/${tunnel_id}/configurations") || {
    echo "[tunnel] WARN: could not read tunnel ingress" >&2
    return 0
  }

  result=$(printf '%s' "$cfg" | TUNNEL_ORIGIN_URL="$ORIGIN_URL" python3 -c '
import json, os, sys
raw = json.load(sys.stdin)
if not raw.get("success"):
    print("skip")
    raise SystemExit(0)
config = (raw.get("result") or {}).get("config") or {}
ingress = list(config.get("ingress") or [])
if not ingress:
    print("skip")
    raise SystemExit(0)
host = "dbadmin.rguktong.in"
for rule in ingress:
    if rule.get("hostname") == host:
        print("present")
        raise SystemExit(0)
rule = {
    "hostname": host,
    "service": os.environ["TUNNEL_ORIGIN_URL"],
    "originRequest": {"noTLSVerify": True},
}
if ingress and "hostname" not in ingress[-1]:
    ingress.insert(-1, rule)
else:
    ingress.append(rule)
    ingress.append({"service": "http_status:404"})
config["ingress"] = ingress
print(json.dumps({"config": config}))
') || {
    echo "[tunnel] WARN: could not prepare dbadmin ingress" >&2
    return 0
  }

  if [[ "$result" == "present" ]]; then
    echo "[tunnel] dbadmin.rguktong.in already in tunnel ingress → ${ORIGIN_URL}"
    return 0
  fi
  if [[ "$result" == "skip" || -z "$result" ]]; then
    echo "[tunnel] WARN: tunnel ingress was not updated" >&2
    return 0
  fi

  curl -fsS -X PUT \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4/accounts/${account_id}/cfd_tunnel/${tunnel_id}/configurations" \
    --data "$result" >/dev/null || {
    echo "[tunnel] WARN: could not add dbadmin.rguktong.in to tunnel ingress" >&2
    return 0
  }
  echo "[tunnel] Added dbadmin.rguktong.in ingress → ${ORIGIN_URL}"
}

main() {
  install_cloudflared

  # In-cluster connectors are extra capacity next to the host connector.
  # Runs in every mode; a missing token keeps them at 0 replicas.
  if wait_for_in_cluster_connectors; then
    echo "[tunnel] 2 in-cluster connectors registered. Host cloudflared stays up as the fallback."
  fi

  if [[ -n "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
    start_token_tunnel
    echo "[tunnel] Done (token mode). Configure public hostnames in Zero Trust dashboard if not already routed."
  elif [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    if sync_existing_tunnel; then
      echo "[tunnel] Done (sync mode)"
    elif create_api_tunnel; then
      echo "[tunnel] Done (API mode)"
    fi
  else
    echo "[tunnel] Skipped — set CLOUDFLARE_TUNNEL_TOKEN in /root/uniz-secrets.env (free, from Cloudflare Zero Trust → Tunnels)" >&2
    exit 0
  fi

  ensure_dbadmin_tunnel_ingress || true
  return 0
}

main "$@"
