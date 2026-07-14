#!/usr/bin/env bash
# Peak-traffic profile for results day / registration (READ scripts before running).
#
# Simulates concurrent read-heavy student traffic against production.
# Requires TOKEN or runs public-only phase if TOKEN unset.
#
# Usage (staged — increase CONCURRENCY gradually):
#   export TOKEN='...'
#   CONCURRENCY=25  bash scripts/ops/peak-load-profile.sh
#   CONCURRENCY=100 bash scripts/ops/peak-load-profile.sh
#
# VPS synthetic users (no Turnstile, invasive — prod DB):
#   CONCURRENCY=50 node scripts/ops/load_test_core.js
#
# Do NOT run from CI without explicit approval.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BASE="${BASE_URL:-https://api-uniz.rguktong.in/api/v1}"
CONCURRENCY="${CONCURRENCY:-50}"
DURATION="${DURATION_SEC:-30}"
SLOW_MS="${SLOW_MS:-500}"

if [[ -z "${TOKEN:-}" ]]; then
  echo "WARN: TOKEN not set — running public endpoints only for peak profile"
  echo "      Set TOKEN for full results/registration read simulation"
  echo ""
  python3 "$ROOT/scripts/ops/audit-prod-latency.py"
  exit 0
fi

# Peak read pattern: grades + attendance + profile (results day)
# shellcheck disable=SC2034
ROUTES=(
  "/profile/student/me"
  "/academics/grades"
  "/academics/attendance"
  "/academics/seating/student"
  "/cms/notifications"
)

echo "=== Peak load profile ==="
echo "  concurrency: $CONCURRENCY"
echo "  duration:    ${DURATION}s per route"
echo "  base:        $BASE"
echo ""

export BASE TOKEN CONCURRENCY DURATION_SEC SLOW_MS ROUTES_JSON
ROUTES_JSON='["/profile/student/me","/academics/grades","/academics/attendance","/academics/seating/student","/cms/notifications"]'

python3 <<PY
import concurrent.futures
import json
import os
import ssl
import time
import urllib.request

BASE = os.environ["BASE"]
TOKEN = os.environ["TOKEN"]
CONCURRENCY = int(os.environ["CONCURRENCY"])
DURATION = int(os.environ["DURATION_SEC"])
SLOW_MS = int(os.environ["SLOW_MS"])
ROUTES = json.loads(os.environ["ROUTES_JSON"])
CTX = ssl.create_default_context()

def hit(path):
    url = BASE + path
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
            r.read(4096)
            return (time.perf_counter() - t0) * 1000, r.status, None
    except Exception as e:
        return None, None, str(e)[:80]

for path in ROUTES:
    times = []
    errors = 0
    deadline = time.time() + DURATION
    total = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futs = []
        while time.time() < deadline:
            while len(futs) < CONCURRENCY and time.time() < deadline:
                futs.append(ex.submit(hit, path))
            done, futs = concurrent.futures.wait(
                futs, timeout=0.5, return_when=concurrent.futures.FIRST_COMPLETED
            )
            for f in done:
                total += 1
                ms, status, err = f.result()
                if err:
                    errors += 1
                elif ms is not None:
                    times.append(ms)
            futs = list(futs)

    if not times:
        print(f"  {path:40} NO DATA  errors={errors}")
        continue
    times.sort()
    p95 = times[max(0, int(len(times) * 0.95) - 1)]
    avg = sum(times) / len(times)
    flag = "SLOW" if p95 > SLOW_MS else "OK"
    rps = len(times) / DURATION
    print(
        f"  {path:40} n={len(times):5} rps={rps:5.1f} "
        f"avg={avg:6.0f}ms p95={p95:6.0f}ms max={max(times):6.0f}ms "
        f"err={errors} {flag}"
    )
PY
