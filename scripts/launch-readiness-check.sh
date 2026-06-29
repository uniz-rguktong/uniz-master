#!/usr/bin/env bash
# UniZ launch readiness monitor — run on VPS or locally against production.
# Usage: bash scripts/launch-readiness-check.sh
#        WATCH=1 INTERVAL=30 bash scripts/launch-readiness-check.sh   # loop until green
set -euo pipefail

API="${API_URL:-https://api-uniz.rguktong.in/api/v1}"
PORTAL="${PORTAL_URL:-https://uniz.rguktong.in}"
INTERVAL="${INTERVAL:-0}"
WATCH="${WATCH:-0}"
FAIL=0

check() {
  FAIL=0
  echo "=============================================="
  echo "UniZ readiness — $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "=============================================="

  if command -v kubectl >/dev/null 2>&1; then
    echo ""
    echo "[K8s] Deployments"
    while IFS= read -r line; do
      name=$(echo "$line" | awk '{print $1}')
      ready=$(echo "$line" | awk '{print $2}')
      if [[ "$ready" != */* ]] || [[ "${ready%%/*}" != "${ready##*/}" ]]; then
        echo "  FAIL  $line"
        FAIL=1
      else
        echo "  OK    $line"
      fi
    done < <(kubectl get deploy 2>/dev/null | grep uniz | grep -v NAME || true)

    echo ""
    echo "[K8s] Unhealthy pods"
    bad=$(kubectl get pods 2>/dev/null | grep uniz | grep -vE 'Running|Completed' || true)
    if [[ -n "$bad" ]]; then
      echo "$bad" | sed 's/^/  /'
      FAIL=1
    else
      echo "  OK    none"
    fi

    if [[ -f /root/.uniz_last_deploy_sha ]]; then
      echo ""
      echo "[Deploy] last successful SHA: $(head -c 7 /root/.uniz_last_deploy_sha)"
      if [[ -d /root/uniz-master-main/.git ]]; then
        echo "[Deploy] git HEAD:            $(git -C /root/uniz-master-main rev-parse --short HEAD)"
      fi
    fi
  fi

  echo ""
  echo "[API] GET /system/health"
  code=$(curl -sk -o /tmp/uniz-health.json -w "%{http_code}" --max-time 20 "$API/system/health" || echo 000)
  if [[ "$code" == "200" || "$code" == "503" ]]; then
    echo "$code" > /tmp/uniz-health.code
    python3 - <<'PY'
import json
d = json.load(open("/tmp/uniz-health.json"))
status = d.get("status", "?")
svcs = d.get("services", [])
healthy = sum(1 for s in svcs if s.get("status") == "healthy")
total = len(svcs)
label = "OK" if status == "ok" else "WARN"
print(f"  {label}  status={status} healthy={healthy}/{total}")
for s in svcs:
    if s.get("status") != "healthy":
        print(f"        degraded: {s.get('name')} ({s.get('status')})")
PY
    if ! python3 -c "import json; d=json.load(open('/tmp/uniz-health.json')); exit(0 if d.get('status') in ('ok','degraded') else 1)"; then
      FAIL=1
    fi
  else
    echo "  FAIL  HTTP $code"
    FAIL=1
  fi

  echo ""
  echo "[Portal] GET $PORTAL"
  pcode=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 20 "$PORTAL/" || echo 000)
  if [[ "$pcode" == "200" ]]; then
    echo "  OK    HTTP $pcode"
  else
    echo "  FAIL  HTTP $pcode"
    FAIL=1
  fi

  echo ""
  echo "[Security] POST /auth/signup without internal secret (expect 403 after 69fafca+)"
  scode=$(curl -sk -o /tmp/uniz-signup.json -w "%{http_code}" --max-time 15 \
    -X POST "$API/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"username":"probe_x","password":"probe123456","role":"student"}' || echo 000)
  if [[ "$scode" == "403" ]]; then
    echo "  OK    signup blocked (HTTP 403)"
  elif [[ "$scode" == "201" || "$scode" == "409" ]]; then
    echo "  WARN  signup still open (HTTP $scode) — security deploy not live yet"
  else
    echo "  INFO  HTTP $scode"
  fi

  echo ""
  if [[ "$FAIL" -eq 0 ]]; then
    echo "RESULT: READY"
  else
    echo "RESULT: NOT READY — fix items above"
  fi
  return "$FAIL"
}

if [[ "$WATCH" == "1" ]]; then
  while true; do
    check || true
    echo ""
    sleep "${INTERVAL:-30}"
  done
else
  check
fi
