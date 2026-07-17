---
title: "Scale & HPA"
description: "Replica matrix, what to raise on burst days, and why maxing every HPA at once is unsafe on 4 vCPU."
---

## Current matrix

| Deployment | Min | Max | CPU target |
|------------|-----|-----|------------|
| gateway-api | 1 | 2 | ~45% |
| auth | 1 | 2 | ~50% |
| user | 1 | 4 | ~70% |
| academics | 1 | 3 | ~70% |
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

## Hard limit

One 4 vCPU node: simultaneous HPA max across all services will thrash. Scale for the **hot path** only. Details in `docs/UniZ_Scaling_Report.md`.
