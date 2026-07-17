#!/usr/bin/env bash
# Point portal + landing hostnames at Cloudflare Pages (not the VPS).
# Leaves api-uniz / landing-api DNS alone.
#
# Requires: CLOUDFLARE_API_TOKEN with Zone:DNS:Edit on rguktong.in
set -euo pipefail

ZONE_NAME="${ZONE_NAME:-rguktong.in}"
PORTAL_PAGES="${PORTAL_PAGES_TARGET:-uniz-portal.pages.dev}"
LANDING_PAGES="${LANDING_PAGES_TARGET:-uniz-landing.pages.dev}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] && [[ -f /root/uniz-secrets.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /root/uniz-secrets.env
  set +a
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "[pages-dns] CLOUDFLARE_API_TOKEN required" >&2
  exit 1
fi

CF_AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" -H "Content-Type: application/json")

ZONE_ID=$(curl -sS "${CF_AUTH[@]}" \
  "https://api.cloudflare.com/client/v4/zones?name=${ZONE_NAME}" \
  | python3 -c 'import sys,json; r=json.load(sys.stdin).get("result") or []; print(r[0]["id"] if r else "")')

if [[ -z "$ZONE_ID" ]]; then
  echo "[pages-dns] Zone not found: $ZONE_NAME" >&2
  exit 1
fi

echo "[pages-dns] Zone $ZONE_NAME ($ZONE_ID)"

point_to_pages() {
  local fqdn="$1"
  local target="$2"
  python3 - "$ZONE_ID" "$fqdn" "$target" "$CLOUDFLARE_API_TOKEN" <<'PY'
import json, sys, urllib.request, urllib.error

zone_id, fqdn, target, token = sys.argv[1:5]
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
}

def cf(method, url, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode() or "{}")

listed = cf("GET", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records?name={fqdn}")
recs = listed.get("result") or []

# Remove non-Pages origins (A/AAAA to VPS, old tunnel CNAMEs, etc.)
kept_cname = None
for rec in recs:
    rtype = rec.get("type")
    content = (rec.get("content") or "").rstrip(".")
    if rtype == "CNAME" and content.lower() == target.lower():
        kept_cname = rec
        continue
    # Drop conflicting records so Pages becomes origin
    if rtype in ("A", "AAAA", "CNAME"):
        out = cf("DELETE", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{rec['id']}")
        print(f"[pages-dns] deleted {rtype} {fqdn} → {content} ok={out.get('success')}")

body = {
    "type": "CNAME",
    "name": fqdn,
    "content": target,
    "proxied": True,
    "ttl": 1,
}
if kept_cname:
    if kept_cname.get("proxied") is True and (kept_cname.get("content") or "").rstrip(".").lower() == target.lower():
        print(f"[pages-dns] {fqdn} already → {target} (proxied)")
        sys.exit(0)
    out = cf("PUT", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{kept_cname['id']}", body)
else:
    out = cf("POST", f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records", body)

ok = out.get("success")
result = out.get("result") or {}
print(f"[pages-dns] {fqdn} → {target} proxied={result.get('proxied')} ok={ok}")
if not ok:
    print("[pages-dns] errors:", out.get("errors") or out)
    sys.exit(1)
PY
}

point_to_pages "uniz.rguktong.in" "$PORTAL_PAGES"
point_to_pages "www.uniz.rguktong.in" "$PORTAL_PAGES"
point_to_pages "rguktong.in" "$LANDING_PAGES"
point_to_pages "www.rguktong.in" "$LANDING_PAGES"

echo "[pages-dns] Frontends now resolve to Cloudflare Pages. API hosts unchanged."
