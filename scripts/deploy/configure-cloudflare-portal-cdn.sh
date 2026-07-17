#!/usr/bin/env bash
# Configure free Cloudflare CDN for UniZ portal (and landing) static assets.
#
# Uses CLOUDFLARE_API_TOKEN already in secrets (Zone DNS + Cache Rules / Zone edit).
# Origin stays on the VPS — Cloudflare only proxies + caches. $0.
#
# Idempotent. Safe to run from deploy.sh on the VPS.
set -euo pipefail

ZONE_NAME="${ZONE_NAME:-rguktong.in}"
VPS_IP="${VPS_IP:-76.13.241.174}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] && [[ -f /root/uniz-secrets.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /root/uniz-secrets.env
  set +a
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "[cf-cdn] CLOUDFLARE_API_TOKEN not set — skip" >&2
  exit 0
fi

CF_AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")

ZONE_ID=$(curl -sS "${CF_AUTH[@]}" \
  "https://api.cloudflare.com/client/v4/zones?name=${ZONE_NAME}" \
  | python3 -c 'import sys,json; r=json.load(sys.stdin).get("result") or []; print(r[0]["id"] if r else "")')

if [[ -z "$ZONE_ID" ]]; then
  echo "[cf-cdn] Zone not found: $ZONE_NAME" >&2
  exit 1
fi

echo "[cf-cdn] Zone $ZONE_NAME ($ZONE_ID)"

# Orange-cloud (proxied) for portal + apex. Leaves record type/content intact when possible.
ensure_proxied() {
  local fqdn="$1"
  python3 - "$ZONE_ID" "$fqdn" "$VPS_IP" "$CLOUDFLARE_API_TOKEN" <<'PY'
import json, sys, urllib.request

zone_id, fqdn, vps_ip, token = sys.argv[1:5]
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

def cf(method, url, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)

listed = cf("GET", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?name={fqdn}")
recs = listed.get("result") or []
if recs:
    rec = recs[0]
    body = {
        "type": rec["type"],
        "name": rec["name"],
        "content": rec["content"],
        "proxied": True,
        "ttl": 1,
    }
    if rec["type"] not in ("A", "AAAA", "CNAME"):
        print(f"[cf-cdn] skip {fqdn} type={rec['type']}")
        sys.exit(0)
    out = cf("PUT", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{rec['id']}", body)
    print(f"[cf-cdn] DNS {fqdn} proxied={out.get('result',{}).get('proxied')} ok={out.get('success')}")
else:
    body = {
        "type": "A",
        "name": fqdn,
        "content": vps_ip,
        "proxied": True,
        "ttl": 1,
    }
    out = cf("POST", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", body)
    print(f"[cf-cdn] DNS created {fqdn} proxied A ok={out.get('success')}")
PY
}

ensure_proxied "uniz.rguktong.in"
ensure_proxied "rguktong.in"

# Cache Rules entrypoint for static assets (free). Bypass HTML / SW / API.
RULESET_PAYLOAD=$(python3 - <<'PY'
import json

hosts = (
    '(http.host eq "uniz.rguktong.in" or http.host eq "www.uniz.rguktong.in" '
    'or http.host eq "rguktong.in" or http.host eq "www.rguktong.in")'
)
static_ext = (
    'http.request.uri.path.extension in '
    '{"js" "css" "woff" "woff2" "ttf" "eot" "png" "jpg" "jpeg" "gif" "svg" "ico" "webp" "avif" "map"}'
)

rules = [
    {
        "ref": "uniz_bypass_html_sw_api",
        "description": "UniZ: never edge-cache HTML, SW, or API",
        "expression": (
            f"{hosts} and ("
            'http.request.uri.path eq "/" or '
            'http.request.uri.path eq "/index.html" or '
            'http.request.uri.path eq "/sw.js" or '
            'starts_with(http.request.uri.path, "/api/") or '
            'http.request.uri.path.extension in {"html" "json"}'
            ")"
        ),
        "action": "set_cache_settings",
        "action_parameters": {"cache": False},
        "enabled": True,
    },
    {
        "ref": "uniz_cache_static_assets",
        "description": "UniZ: long-cache static assets at edge (free CDN)",
        "expression": f"{hosts} and {static_ext}",
        "action": "set_cache_settings",
        "action_parameters": {
            "cache": True,
            "edge_ttl": {"mode": "override_origin", "default": 2592000},
            "browser_ttl": {"mode": "override_origin", "default": 604800},
        },
        "enabled": True,
    },
]

print(json.dumps({
    "description": "UniZ portal/landing CDN cache (configure-cloudflare-portal-cdn.sh)",
    "rules": rules,
}))
PY
)

EXISTING=$(curl -sS "${CF_AUTH[@]}" \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint" \
  || echo '{}')

entrant_id=$(echo "$EXISTING" | python3 -c 'import sys,json
try:
 d=json.load(sys.stdin); print((d.get("result") or {}).get("id") or "")
except Exception:
 print("")')

if [[ -n "$entrant_id" ]]; then
  RESP=$(curl -sS -X PUT "${CF_AUTH[@]}" \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/${entrant_id}" \
    --data "$RULESET_PAYLOAD")
else
  RESP=$(curl -sS -X PUT "${CF_AUTH[@]}" \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets/phases/http_request_cache_settings/entrypoint" \
    --data "$RULESET_PAYLOAD")
fi

echo "$RESP" | python3 -c '
import sys, json
d = json.load(sys.stdin)
if d.get("success"):
  rules = (d.get("result") or {}).get("rules") or []
  print(f"[cf-cdn] Cache rules OK ({len(rules)} rules)")
  for r in rules:
    print("  -", r.get("description") or r.get("ref"))
else:
  print("[cf-cdn] Cache rules not applied (token may lack Cache Rules edit). Orange-cloud DNS still helps.")
  print("  errors:", d.get("errors") or d)
'

echo "[cf-cdn] Done — free CDN for portal/landing static assets (origin remains VPS)"
