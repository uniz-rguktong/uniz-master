---
title: "Scale & HPA"
description: "Replica matrix, what to raise on burst days, and why maxing every HPA at once is unsafe on 4 vCPU."
---

## Current matrix

| Deployment | Min | Max | CPU target |
|------------|-----|-----|------------|
| gateway-api | 1 | 3 | ~45% |
| auth | 1 | 3 | ~50% |
| user | 1 | 4 | ~70% |
| academics | 1 | 4 | ~70% |
| notifications | 1 | 1 | — |
| nginx gateway | 0 | — | parked |

Manifests: `infra/core-infra/kubernetes/base/core/*.yaml`.

## Burst day playbook

1. Ensure Postgres backup fresh; watch disk
2. Prefer academics + auth scale — they own results/login spikes
3. Confirm Redis healthy
4. Gateway Redis cache + CDN already absorb static FE
5. Do **not** scale parked services “just in case”

```bash
kubectl get hpa
kubectl scale deploy/uniz-academics-service --replicas=2
```

## Verify gateway HPA

Use the capped HPA test when you need to prove that `uniz-gateway-api` can scale from 1 to 2 replicas under CPU pressure. It uses only public health endpoints, adds cache-busting query strings, and watches `kubectl get hpa` over SSH.

```bash
CONFIRM=1 CONCURRENCY=80 DURATION_SEC=90 \
  bash scripts/ops/test-hpa-autoscale.sh
```

The script refuses to run without `CONFIRM=1`, caps load at 200 concurrent workers and 180 seconds, and leaves scale-down to the HPA stabilization window. Use it off-peak; it proves HPA behavior, not total campus user capacity.

`TLS_VERIFY` defaults to `0` because the current production API health audit already notes external certificate-chain issues from script clients. Set `TLS_VERIFY=1` once the API certificate path is clean.

## Verify authenticated capacity

Generate short-lived test JWTs on the VPS, then provide them one per line without committing the token file:

```bash
CONFIRM=1 TOKEN_FILE=/tmp/uniz-capacity-tokens \
  CONCURRENCY=500 DURATION_SEC=45 THINK_TIME_MS=3000 \
  node scripts/ops/test-authenticated-capacity.js
```

The 2026-07-17 production run passed with 500 distinct students, 149 requests/second, zero errors, and p95 275 ms. Keep a realistic think time: a closed-loop test with no pause measures request saturation, not simultaneous students.

## Hard limit

One 4 vCPU node: simultaneous HPA max across all services will thrash. Scale for the **hot path** only. Details in `docs/UniZ_Scaling_Report.md`.
