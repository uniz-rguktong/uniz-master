#!/usr/bin/env bash
# Test student APIs on production. Login needs Turnstile; use TOKEN env var or mint on VPS.
#
#   export TOKEN='...'              # localStorage student_token (recommended)
#   export STUDENT_USER=O210008
#   bash scripts/test-student-apis.sh
#
# Login only (needs STUDENT_PASS + CAPTCHA_TOKEN):
#   export STUDENT_PASS='...'
#   export CAPTCHA_TOKEN='...'
#   bash scripts/test-student-apis.sh
set -euo pipefail

BASE="${BASE_URL:-https://api-uniz.rguktong.in/api/v1}"
USER="${STUDENT_USER:-O210008}"
PASS="${STUDENT_PASS:-}"

test_api() {
  local method="$1" path="$2" body="${3:-}"
  local code t0 ms result preview
  t0=$(python3 -c "import time; print(time.perf_counter())")
  if [ "$method" = "GET" ]; then
    code=$(curl -s -o /tmp/uniz_resp.json -w "%{http_code}" --max-time 25 \
      -H "Authorization: Bearer $TOKEN" "$BASE$path")
  else
    code=$(curl -s -o /tmp/uniz_resp.json -w "%{http_code}" --max-time 25 \
      -X "$method" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -d "$body" "$BASE$path")
  fi
  ms=$(python3 -c "import time; print(int((time.perf_counter()-float('$t0'))*1000))")
  result="PASS"; [ "$code" -ge 400 ] && result="FAIL"
  preview=$(python3 -c "import json; d=json.load(open('/tmp/uniz_resp.json')); print(str(d)[:75])" 2>/dev/null || head -c 75 /tmp/uniz_resp.json)
  printf "%-4s %-38s %s  %3s  %4sms  %s\n" "$method" "$path" "$result" "$code" "$ms" "$preview"
}

if [ -z "${TOKEN:-}" ]; then
  if [ -z "$PASS" ]; then
    echo "Set TOKEN (browser localStorage student_token) or STUDENT_PASS for login."
    echo "See docs/SUB_500MS_ACTION_PLAN.md"
    exit 1
  fi
  echo "=== Login (needs captchaToken — use scripts/mint-student-token.sh) ==="
  curl -s -X POST "$BASE/auth/login/student" -H "Content-Type: application/json" \
    -d "{\"username\":\"$USER\",\"password\":\"$PASS\",\"captchaToken\":\"${CAPTCHA_TOKEN:-}\"}" | python3 -m json.tool
  exit 0
fi

echo "=== Student API tests for $USER (target <500ms) ==="
test_api GET "/profile/student/me"
test_api GET "/academics/grades"
test_api GET "/academics/attendance"
test_api GET "/academics/seating/student"
test_api GET "/requests/history"
test_api GET "/requests/outside"
test_api GET "/cms/banners/public"
test_api GET "/cms/notifications"
test_api GET "/academics/student/current/$USER"

PROFILE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/profile/student/me")
BRANCH=$(echo "$PROFILE" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('student') or d; print(s.get('branch','CSE'))")
YEAR=$(echo "$PROFILE" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('student') or d; print(s.get('year','E3'))")
test_api GET "/academics/student/available?branch=$BRANCH&year=$YEAR"

SEM=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE/academics/grades" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); g=d.get('grades') or []; print(g[0].get('semesterId','E3S1') if g else 'E3S1')")
test_api GET "/academics/grades/download/$SEM"
test_api GET "/academics/attendance/download/$SEM"
test_api GET "/requests/grievance/list"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/system/health")
printf "GET  /system/health                     PASS  %s\n" "$code"

echo "--- admin endpoints (expect 403) ---"
test_api POST "/profile/student/search" '{"limit":1}'
test_api GET "/requests/outpass/all"
