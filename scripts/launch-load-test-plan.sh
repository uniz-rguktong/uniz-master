#!/usr/bin/env bash
# Staged load-test runner for launch week. Run ON VPS only.
#
# Phase A — public health (safe anytime):
#   bash scripts/launch-load-test-plan.sh health
#
# Phase B — synthetic users, no real students (off-peak, start low):
#   CONCURRENCY=25  bash scripts/launch-load-test-plan.sh synthetic
#   CONCURRENCY=50  bash scripts/launch-load-test-plan.sh synthetic
#   CONCURRENCY=100 bash scripts/launch-load-test-plan.sh synthetic
#
# Phase C — authenticated reads (one real token, read-only):
#   TOKEN='eyJ...' CONCURRENCY=50 bash scripts/peak-load-profile.sh
#
# Phase D — login storm (DB-heavy, max 200, off-peak only):
#   CONCURRENT_USERS=50 node infra/core-infra/setup-helper/stress_test_login.js
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PHASE="${1:-health}"
CONCURRENCY="${CONCURRENCY:-25}"

case "$PHASE" in
  health)
    echo "=== Phase A: health endpoint (${CONCURRENCY} workers, 60s) ==="
    CONCURRENT_USERS="${CONCURRENCY}" TOTAL_DURATION_SEC=60 \
      node "$ROOT/infra/core-infra/setup-helper/stress_test_health.js"
    ;;
  synthetic)
    echo "=== Phase B: synthetic users (CONCURRENCY=$CONCURRENCY) ==="
    echo "Uses LOAD_TEST_STU_* accounts + internal signup. No real student passwords touched."
    CONCURRENCY="$CONCURRENCY" node "$ROOT/scripts/load_test_core.js"
    ;;
  peak)
    echo "=== Phase C: authenticated read profile ==="
    if [[ -z "${TOKEN:-}" ]]; then
      echo "Set TOKEN from a real student login first."
      exit 1
    fi
    CONCURRENCY="$CONCURRENCY" bash "$ROOT/scripts/peak-load-profile.sh"
    ;;
  login)
    echo "=== Phase D: login stress (off-peak only) ==="
    CONCURRENT_USERS="${CONCURRENT_USERS:-$CONCURRENCY}" \
      node "$ROOT/infra/core-infra/setup-helper/stress_test_login.js"
    ;;
  *)
    echo "Usage: $0 {health|synthetic|peak|login}"
    exit 1
    ;;
esac
