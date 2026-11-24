#!/usr/bin/env bash
# Post-deploy smoke checks for lean UniZ production.
# Usage:
#   PORTAL_URL=https://uniz.rguktong.in API_URL=https://api-uniz.rguktong.in/api/v1 \
#     bash scripts/ops/post-deploy-smoke.sh
set -euo pipefail

PORTAL_URL="${PORTAL_URL:-https://uniz.rguktong.in}"
LANDING_URL="${LANDING_URL:-https://rguktong.in}"
API_URL="${API_URL:-https://api-uniz.rguktong.in/api/v1}"
LANDING_API_URL="${LANDING_API_URL:-https://landing-api.rguktong.in}"
FAIL=0

# Staging must never smoke production hosts, nor fall back to them.
if [[ "${UNIZ_ENV:-}" == "staging" ]]; then
  for pair in "PORTAL_URL=https://uniz.rguktong.in" "API_URL=https://api-uniz.rguktong.in/api/v1" "LANDING_API_URL=https://landing-api.rguktong.in" "LANDING_URL=https://rguktong.in"; do
    n="${pair%%=*}"; prod="${pair#*=}"
    if [[ "${!n}" == "$prod" ]]; then
      echo "[smoke] staging run is pointed at production ($n); refusing" >&2
      exit 1
    fi
  done
fi

check() {
  local name="$1"
  local url="$2"
  local expect="${3:-200}"
  local method="${4:-GET}"
  local body="${5:-}"
  local code
  if [[ -n "$body" ]]; then
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 \
      -X "$method" -H "Content-Type: application/json" -d "$body" "$url" || echo "000")
  else
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 20 \
      -X "$method" "$url" || echo "000")
  fi
  # A 5xx is a broken origin. Do not let expect='*' treat it as success.
  # An explicit expected 5xx (outpass gated = 503) still passes.
  if [[ "$code" =~ ^[0-9]+$ ]] && (( 10#$code >= 500 )) && [[ "$code" != "$expect" ]]; then
    echo "FAIL $name (got $code, want $expect) $url"
    FAIL=1
  elif [[ "$code" == "$expect" ]] || [[ "$expect" == "*" && "$code" != "000" ]]; then
    echo "OK  $name ($code) $url"
  else
    echo "FAIL $name (got $code, want $expect) $url"
    FAIL=1
  fi
}

echo "== UniZ post-deploy smoke =="
echo "Portal:     $PORTAL_URL"
echo "Landing:    $LANDING_URL"
echo "API:        $API_URL"
echo "LandingAPI: $LANDING_API_URL"
echo

# Optional vault key audit when run on the VPS with the remote helper present.
if [[ "${UNIZ_SMOKE_VAULT_AUDIT:-1}" == "1" ]] && [[ -f "${UNIZ_PLAIN_VAULT:-/root/uniz-secrets.env}" ]]; then
  ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
  if [[ -f "$ROOT_DIR/scripts/ops/vps-vault-remote.sh" ]]; then
    echo "[vault] auditing required keys..."
    if ! bash "$ROOT_DIR/scripts/ops/vps-vault-remote.sh" audit; then
      echo "FAIL vault audit"
      FAIL=1
    else
      echo "OK  vault audit"
    fi
  fi
fi

check "portal home (Pages)" "$PORTAL_URL/"
check "landing home (Pages)" "$LANDING_URL/"
check "landing API" "$LANDING_API_URL/" "*"
check "gateway root" "${API_URL%/api/v1}/" "*"
check "auth health" "$API_URL/auth/health" "*"
# Some auth builds expose /health on the service directly via gateway path variants
check "cms notifications" "$API_URL/cms/notifications" "*"
check "outpass gated" "$API_URL/requests/outpass/all" "503"
cron_tmp="$(mktemp)"
cron_code="$(curl -sS -o "$cron_tmp" -w "%{http_code}" --max-time 20 "$API_URL/cron/health" || echo "000")"
if [[ "$cron_code" == "200" ]] && grep -q "CronJob-only" "$cron_tmp"; then
  echo "OK  cron health (CronJob-only) ($cron_code) $API_URL/cron/health"
else
  echo "FAIL cron health (got $cron_code, want 200 CronJob-only) $API_URL/cron/health"
  FAIL=1
fi
rm -f "$cron_tmp"
check "comms health" "$API_URL/notifications/health" "*"
check "grievance list auth" "$API_URL/grievance/list" "*"

# Mail is folded into notifications — /mail/send requires internal secret (expect 403)
mail_code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 -X POST "$API_URL/mail/send" -H "Content-Type: application/json" -d '{}' || echo "000")
if [[ "$mail_code" == "403" || "$mail_code" == "400" || "$mail_code" == "401" ]]; then
  echo "OK  mail route live ($mail_code) $API_URL/mail/send"
else
  echo "FAIL mail route (got $mail_code, want 403/400/401) $API_URL/mail/send"
  FAIL=1
fi

# DB-backed auth routes. 400/404 means Postgres answered; 500 means it did not.
check "auth otp verify (db)" "$API_URL/auth/otp/verify" "400" POST \
  '{"username":"SMOKENOUSER","otp":"000000"}'
check "auth admin reset-password (db)" "$API_URL/auth/admin/reset-password" "404" POST \
  '{"username":"smoke_no_user","password":"x","new_password":"xxxxxxx"}'

if [[ "$FAIL" -ne 0 ]]; then
  echo
  echo "Smoke FAILED"
  exit 1
fi

echo
echo "Smoke OK"
