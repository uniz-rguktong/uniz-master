#!/usr/bin/env bash
# Obtain a student JWT from production login (Turnstile required on prod).
#
# Usage:
#   export STUDENT_USER=O210008          # or o210008@rguktong.ac.in
#   export STUDENT_PASS='your-password'
#   export CAPTCHA_TOKEN='...'           # from browser Network tab (login/student body)
#   eval "$(bash scripts/ops/mint-student-token.sh)"
#   echo "$TOKEN" | head -c 40
#
# Or export token only:
#   TOKEN=$(bash scripts/ops/mint-student-token.sh --quiet)
#
# Getting CAPTCHA_TOKEN:
#   1. Open https://uniz.rguktong.in and sign in (or start login)
#   2. DevTools → Network → POST .../auth/login/student → Payload → captchaToken
#   3. Copy token (expires in ~5 minutes)
#
# Alternative — skip login entirely:
#   DevTools → Application → Local Storage → student_token
set -euo pipefail

BASE="${BASE_URL:-https://api-uniz.rguktong.in/api/v1}"
USER="${STUDENT_USER:-O210008}"
PASS="${STUDENT_PASS:-}"
CAPTCHA="${CAPTCHA_TOKEN:-}"
QUIET=false

for arg in "$@"; do
  case "$arg" in
    --quiet|-q) QUIET=true ;;
    --help|-h)
      sed -n '2,20p' "$0"
      exit 0
      ;;
  esac
done

if [[ -z "$PASS" ]]; then
  echo "ERROR: Set STUDENT_PASS (password not stored in repo)." >&2
  echo "  export STUDENT_PASS='...'" >&2
  exit 1
fi

if [[ -z "$CAPTCHA" ]]; then
  echo "ERROR: Set CAPTCHA_TOKEN from browser Network tab (login/student request body)." >&2
  echo "  Or export TOKEN directly from localStorage student_token." >&2
  exit 1
fi

RESP=$(curl -sS --max-time 30 -X POST "$BASE/auth/login/student" \
  -H "Content-Type: application/json" \
  -d "$(STUDENT_USER="$USER" STUDENT_PASS="$PASS" CAPTCHA_TOKEN="$CAPTCHA" python3 - <<'PY'
import json, os
print(json.dumps({
    "username": os.environ["STUDENT_USER"],
    "password": os.environ["STUDENT_PASS"],
    "captchaToken": os.environ["CAPTCHA_TOKEN"],
}))
PY
)")

TOKEN=$(echo "$RESP" | python3 -c "
import json, sys
d = json.load(sys.stdin)
t = d.get('token') or d.get('accessToken') or (d.get('data') or {}).get('token')
if not t:
    print('LOGIN_FAILED:' + json.dumps(d)[:200], file=sys.stderr)
    sys.exit(1)
print(t)
" 2>/dev/null) || {
  echo "Login failed:" >&2
  echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP" >&2
  exit 1
}

if $QUIET; then
  echo "$TOKEN"
else
  echo "export TOKEN='$TOKEN'"
  echo "export STUDENT_USER='$USER'"
  echo "# Token minted $(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi
