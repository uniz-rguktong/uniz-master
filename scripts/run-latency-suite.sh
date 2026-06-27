#!/usr/bin/env bash
# Master latency verification suite — public + authenticated (optional load).
# Does NOT store credentials. See docs/SUB_500MS_ACTION_PLAN.md
#
# Usage:
#   # Public only
#   bash scripts/run-latency-suite.sh
#
#   # With authenticated routes (TOKEN from browser localStorage)
#   export TOKEN='...'
#   export STUDENT_USER=O210008
#   bash scripts/run-latency-suite.sh
#
#   # Save report
#   bash scripts/run-latency-suite.sh --save reports/latency-$(date +%F).txt
#
#   # Include peak load (VPS only, invasive — off by default)
#   RUN_LOAD=1 CONCURRENCY=50 bash scripts/run-latency-suite.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SAVE=""
RUN_LOAD="${RUN_LOAD:-0}"
CONCURRENCY="${CONCURRENCY:-50}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --save)
      SAVE="$2"
      shift 2
      ;;
    --load)
      RUN_LOAD=1
      shift
      ;;
    --help|-h)
      sed -n '2,22p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

run() {
  if [[ -n "$SAVE" ]]; then
    {
      echo ""
      echo "$ $*"
    } >>"$SAVE"
  else
    echo "=== $* ==="
  fi
  "$@" 2>&1 | tee ${SAVE:+-a "$SAVE"}
  echo ""
}

header() {
  local msg="$1"
  if [[ -n "$SAVE" ]]; then
    mkdir -p "$(dirname "$SAVE")"
    {
      echo ""
      echo "################################################################"
      echo "# $msg"
      echo "# $(date -u +%Y-%m-%dT%H:%M:%SZ)"
      echo "################################################################"
    } >>"$SAVE"
  else
    echo ""
    echo "========== $msg =========="
  fi
}

header "UniZ Latency Suite — BASE=${BASE_URL:-https://api-uniz.rguktong.in/api/v1}"

header "1/4 Public + health probes"
run python3 "$ROOT/scripts/audit-prod-latency.py"

header "2/4 Authenticated student routes"
if [[ -z "${TOKEN:-}" ]]; then
  msg="SKIP — set TOKEN (localStorage student_token) or run mint-student-token.sh"
  echo "$msg"
  [[ -n "$SAVE" ]] && echo "$msg" >>"$SAVE"
  echo ""
  echo "  export TOKEN=\$(node -e \"console.log('paste-from-browser')\")  # or from DevTools"
  echo "  export STUDENT_USER=O210008"
else
  run python3 "$ROOT/scripts/audit-auth-latency.py"
  header "3/4 Functional student API smoke"
  run bash "$ROOT/scripts/test-student-apis.sh"
fi

header "4/4 Peak load profile"
if [[ "$RUN_LOAD" == "1" ]]; then
  run env CONCURRENCY="$CONCURRENCY" bash "$ROOT/scripts/peak-load-profile.sh"
else
  msg="SKIP — set RUN_LOAD=1 to run peak-load-profile.sh (see SUB_500MS_ACTION_PLAN.md)"
  echo "$msg"
  [[ -n "$SAVE" ]] && echo "$msg" >>"$SAVE"
fi

header "Done"
if [[ -n "$SAVE" ]]; then
  echo "Report saved: $SAVE"
fi
