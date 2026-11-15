# Monthly HPA drill (single VPS)

Node profile: **4 vCPU / ~15Gi RAM**. HPA reshuffles capacity — it does not invent nodes.

## Live caps

| HPA | Deployment | min→max | CPU |
|---|---|---|---|
| uniz-gateway-api-hpa | uniz-gateway-api | 1→3 | 45% |
| uniz-auth-service-hpa | uniz-auth-service | 1→2 | 50% |
| uniz-user-service-hpa | uniz-user-service | 1→3 | 70% |
| uniz-academics-service-hpa | uniz-academics-service | 1→3 | 70% |
| uniz-notification-service-hpa | uniz-notification-service | 1→2 | 70% |

## Drill

```bash
# Terminal 1
npm run watch

# Terminal 2
CONFIRM=1 CONCURRENCY=80 DURATION_SEC=90 bash scripts/ops/test-hpa-autoscale.sh
```

Pass criteria:

1. Gateway ready replicas increase under load (toward maxReplicas when schedulable).
2. No CrashLoopBackOff on scaled pods.
3. After ~5 minutes idle, scale-down begins (stabilization window).

Record date / pass-fail in this file or the ops log.

## Last drill

| Date | Result | Notes |
|---|---|---|
| _pending_ | | |
