#!/usr/bin/env bash
# Verify gateway-api HPA scale-up under capped read-only load.
# This intentionally targets public health endpoints only: no auth, no DB writes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SSH_HOST="${SSH_HOST:-root@76.13.241.174}"
DEPLOYMENT="${DEPLOYMENT:-uniz-gateway-api}"
HPA="${HPA:-uniz-gateway-api-hpa}"
APP_LABEL="${APP_LABEL:-app=uniz-gateway-api}"
TARGET_URL="${TARGET_URL:-https://api-uniz.rguktong.in/api/v1/system/health/live}"
FALLBACK_URL="${FALLBACK_URL:-https://api-uniz.rguktong.in/api/v1/system/health}"
CONCURRENCY="${CONCURRENCY:-80}"
DURATION_SEC="${DURATION_SEC:-90}"
TIMEOUT_SEC="${TIMEOUT_SEC:-120}"
POLL_SEC="${POLL_SEC:-5}"
MAX_CONCURRENCY="${MAX_CONCURRENCY:-200}"
MAX_DURATION_SEC="${MAX_DURATION_SEC:-180}"
WAIT_SCALE_DOWN="${WAIT_SCALE_DOWN:-0}"
TLS_VERIFY="${TLS_VERIFY:-0}"
SSH_OPTS=(-o StrictHostKeyChecking=no -o ConnectTimeout=15)

die() {
  echo "ERROR: $*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

is_uint() {
  [[ "${1:-}" =~ ^[0-9]+$ ]]
}

remote() {
  ssh "${SSH_OPTS[@]}" "$SSH_HOST" "$@"
}

if [[ "${CONFIRM:-}" != "1" ]]; then
  cat >&2 <<MSG
This runs capped production load against gateway-api.
Re-run with CONFIRM=1 after checking current traffic.

Example:
  CONFIRM=1 CONCURRENCY=80 DURATION_SEC=90 bash scripts/ops/test-hpa-autoscale.sh
MSG
  exit 2
fi

need_cmd python3
need_cmd ssh

is_uint "$CONCURRENCY" || die "CONCURRENCY must be an integer"
is_uint "$DURATION_SEC" || die "DURATION_SEC must be an integer"
is_uint "$TIMEOUT_SEC" || die "TIMEOUT_SEC must be an integer"
is_uint "$POLL_SEC" || die "POLL_SEC must be an integer"

(( CONCURRENCY > 0 )) || die "CONCURRENCY must be > 0"
(( DURATION_SEC > 0 )) || die "DURATION_SEC must be > 0"
(( CONCURRENCY <= MAX_CONCURRENCY )) || die "CONCURRENCY=$CONCURRENCY exceeds cap MAX_CONCURRENCY=$MAX_CONCURRENCY"
(( DURATION_SEC <= MAX_DURATION_SEC )) || die "DURATION_SEC=$DURATION_SEC exceeds cap MAX_DURATION_SEC=$MAX_DURATION_SEC"

echo "=== HPA autoscaling test ==="
echo "target:      $TARGET_URL"
echo "fallback:    $FALLBACK_URL"
echo "deployment:  $DEPLOYMENT"
echo "hpa:         $HPA"
echo "ssh:         $SSH_HOST"
echo "concurrency: $CONCURRENCY"
echo "duration:    ${DURATION_SEC}s"
echo "timeout:     ${TIMEOUT_SEC}s"
echo "tls_verify:  $TLS_VERIFY"
echo ""

echo "=== Baseline ==="
remote "kubectl get hpa '$HPA' && echo && kubectl get deploy '$DEPLOYMENT' && echo && kubectl get pods -l '$APP_LABEL' -o wide && echo && kubectl top pod -l '$APP_LABEL' 2>/dev/null || true"

max_replicas="$(remote "kubectl get hpa '$HPA' -o jsonpath='{.spec.maxReplicas}'")"
ready_replicas="$(remote "kubectl get deploy '$DEPLOYMENT' -o jsonpath='{.status.readyReplicas}'")"
ready_replicas="${ready_replicas:-0}"

is_uint "$max_replicas" || die "Could not read maxReplicas for $HPA"
is_uint "$ready_replicas" || ready_replicas=0

if (( ready_replicas >= max_replicas )); then
  die "$DEPLOYMENT is already at readyReplicas=$ready_replicas, maxReplicas=$max_replicas; aborting to avoid ambiguous result"
fi

load_log="${TMPDIR:-/tmp}/uniz-hpa-load.$$.log"
: >"$load_log"

cleanup() {
  if [[ -n "${load_pid:-}" ]] && kill -0 "$load_pid" >/dev/null 2>&1; then
    kill "$load_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo ""
echo "=== Load phase ==="
echo "load log: $load_log"

TARGET_URL="$TARGET_URL" FALLBACK_URL="$FALLBACK_URL" CONCURRENCY="$CONCURRENCY" DURATION_SEC="$DURATION_SEC" TLS_VERIFY="$TLS_VERIFY" \
python3 <<'PY' >"$load_log" 2>&1 &
import concurrent.futures
import os
import random
import ssl
import statistics
import time
import urllib.request
import urllib.parse

TARGET_URL = os.environ["TARGET_URL"]
FALLBACK_URL = os.environ["FALLBACK_URL"]
CONCURRENCY = int(os.environ["CONCURRENCY"])
DURATION = int(os.environ["DURATION_SEC"])
CTX = ssl.create_default_context()
if os.environ.get("TLS_VERIFY", "0") == "0":
    CTX = ssl._create_unverified_context()

def with_cache_bust(url):
    sep = "&" if urllib.parse.urlparse(url).query else "?"
    return f"{url}{sep}hpa_ts={time.time_ns()}_{random.randint(1, 999999)}"

def request_once(base_url, timeout=15):
    req = urllib.request.Request(
        with_cache_bust(base_url),
        headers={
            "User-Agent": "uniz-hpa-autoscale-test/1.0",
            "Cache-Control": "no-cache",
        },
    )
    start = time.perf_counter()
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as res:
        res.read(4096)
        return (time.perf_counter() - start) * 1000, res.status

def choose_url():
    for url in (TARGET_URL, FALLBACK_URL):
        try:
            ms, status = request_once(url)
            if 200 <= status < 500:
                print(f"selected_url={url} preflight_status={status} preflight_ms={ms:.0f}", flush=True)
                return url
        except Exception as exc:
            print(f"preflight_failed url={url} err={str(exc)[:120]}", flush=True)
    raise SystemExit("no usable health endpoint")

url = choose_url()
deadline = time.time() + DURATION
latencies = []
statuses = {}
errors = {}
total = 0
last_report = time.time()

def hit():
    try:
        ms, status = request_once(url)
        return ms, status, None
    except Exception as exc:
        return None, None, str(exc)[:100]

with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
    futures = set()
    while time.time() < deadline or futures:
        while time.time() < deadline and len(futures) < CONCURRENCY:
            futures.add(executor.submit(hit))

        done, futures = concurrent.futures.wait(
            futures,
            timeout=0.5,
            return_when=concurrent.futures.FIRST_COMPLETED,
        )

        for future in done:
            total += 1
            ms, status, err = future.result()
            if err:
                errors[err] = errors.get(err, 0) + 1
            else:
                latencies.append(ms)
                statuses[status] = statuses.get(status, 0) + 1

        now = time.time()
        if now - last_report >= 10:
            ok = sum(count for code, count in statuses.items() if 200 <= code < 400)
            print(f"progress total={total} ok={ok} errors={sum(errors.values())}", flush=True)
            last_report = now

elapsed = max(0.001, DURATION)
latencies.sort()
ok = sum(count for code, count in statuses.items() if 200 <= code < 400)
p50 = latencies[int(len(latencies) * 0.50)] if latencies else 0
p95 = latencies[max(0, int(len(latencies) * 0.95) - 1)] if latencies else 0
avg = statistics.fmean(latencies) if latencies else 0

print("=== load summary ===", flush=True)
print(f"total={total} ok={ok} errors={sum(errors.values())} rps={ok / elapsed:.1f}", flush=True)
print(f"latency_ms avg={avg:.0f} p50={p50:.0f} p95={p95:.0f} max={(max(latencies) if latencies else 0):.0f}", flush=True)
print(f"statuses={statuses}", flush=True)
if errors:
    print(f"errors={errors}", flush=True)
PY
load_pid=$!

start_epoch="$(date +%s)"
pass=0
peak_ready="$ready_replicas"

echo "Watching HPA until ready replicas reaches $max_replicas..."
while true; do
  now_epoch="$(date +%s)"
  elapsed=$(( now_epoch - start_epoch ))

  snapshot="$(
    remote "printf 'hpa: '; kubectl get hpa '$HPA' --no-headers 2>/dev/null || true; printf 'deploy: '; kubectl get deploy '$DEPLOYMENT' -o jsonpath='desired={.spec.replicas} ready={.status.readyReplicas} available={.status.availableReplicas}{\"\\n\"}' 2>/dev/null || true; kubectl get pods -l '$APP_LABEL' --no-headers 2>/dev/null | awk '{print \"pod: \" \$1 \" \" \$2 \" \" \$3}' || true; kubectl top pod -l '$APP_LABEL' --no-headers 2>/dev/null | awk '{print \"top: \" \$1 \" cpu=\" \$2 \" mem=\" \$3}' || true"
  )"
  echo "--- t=${elapsed}s ---"
  echo "$snapshot"

  current_ready="$(remote "kubectl get deploy '$DEPLOYMENT' -o jsonpath='{.status.readyReplicas}' 2>/dev/null || true")"
  current_ready="${current_ready:-0}"
  is_uint "$current_ready" || current_ready=0
  if (( current_ready > peak_ready )); then
    peak_ready="$current_ready"
  fi
  if (( current_ready >= max_replicas )); then
    pass=1
    echo "PASS: $DEPLOYMENT reached readyReplicas=$current_ready in ${elapsed}s"
    break
  fi

  if ! kill -0 "$load_pid" >/dev/null 2>&1; then
    wait "$load_pid" || echo "load generator exited non-zero; see $load_log"
    break
  fi

  if (( elapsed >= TIMEOUT_SEC )); then
    break
  fi

  sleep "$POLL_SEC"
done

if kill -0 "$load_pid" >/dev/null 2>&1; then
  wait "$load_pid" || echo "load generator exited non-zero; see $load_log"
fi

echo ""
cat "$load_log"

echo ""
echo "=== Final HPA state ==="
remote "kubectl get hpa '$HPA' && echo && kubectl get deploy '$DEPLOYMENT' && echo && kubectl get pods -l '$APP_LABEL' -o wide && echo && kubectl top pod -l '$APP_LABEL' 2>/dev/null || true"

if [[ "$WAIT_SCALE_DOWN" == "1" ]]; then
  echo ""
  echo "Waiting for HPA scale-down to 1 ready replica..."
  for _ in $(seq 1 90); do
    current_ready="$(remote "kubectl get deploy '$DEPLOYMENT' -o jsonpath='{.status.readyReplicas}' 2>/dev/null || true")"
    current_ready="${current_ready:-0}"
    if [[ "$current_ready" == "1" ]]; then
      echo "Scale-down observed."
      break
    fi
    sleep 10
  done
fi

echo ""
echo "=== Result ==="
echo "peak_ready_replicas=$peak_ready max_replicas=$max_replicas"
if (( pass == 1 )); then
  echo "status=PASS"
  exit 0
fi

echo "status=FAIL"
echo "HPA did not reach readyReplicas=$max_replicas within ${TIMEOUT_SEC}s."
exit 1
