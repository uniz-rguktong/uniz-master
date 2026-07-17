#!/usr/bin/env bash
# Post-deploy smoke checks for lean UniZ production.
# Usage:
#   PORTAL_URL=https://uniz.rguktong.in API_URL=https://api-uniz.rguktong.in/api/v1 \
#     bash scripts/ops/post-deploy-smoke.sh
set -euo pipefail

PORTAL_URL="${PORTAL_URL:-https://uniz.rguktong.in}"
API_URL="${API_URL:-https://api-uniz.rguktong.in/api/v1}"
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expect="${3:-200}"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 "$url" || echo "000")
  if [[ "$code" == "$expect" ]] || [[ "$expect" == "*" && "$code" != "000" ]]; then
    echo "OK  $name ($code) $url"
  else
    echo "FAIL $name (got $code, want $expect) $url"
    FAIL=1
  fi
}

echo "== UniZ post-deploy smoke =="
echo "Portal: $PORTAL_URL"
echo "API:    $API_URL"
echo

check "portal home" "$PORTAL_URL/"
check "gateway root" "${API_URL%/api/v1}/" "*"
check "auth health" "$API_URL/auth/health" "*"
# Some auth builds expose /health on the service directly via gateway path variants
check "cms notifications" "$API_URL/cms/notifications" "*"
check "outpass gated" "$API_URL/requests/outpass/all" "503"

if [[ "$FAIL" -ne 0 ]]; then
  echo
  echo "Smoke FAILED"
  exit 1
fi

echo
echo "Smoke OK"
