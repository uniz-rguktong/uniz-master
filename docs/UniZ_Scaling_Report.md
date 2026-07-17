# UniZ Scaling Report (aligned with manifests)

**Status:** Lean production topology  
**Orchestration:** K3s with HPA  
**Canonical detail:** [PRODUCTION_TOPOLOGY.md](./PRODUCTION_TOPOLOGY.md)

## Replica matrix (manifest truth)

| Service | Min | Max | CPU target |
|---------|-----|-----|------------|
| Gateway nginx | 0 | — | Parked (Traefik → gateway-api) |
| Gateway API | 1 | 3 | 45% |
| Auth | 1 | 3 | 50% |
| User | 1 | 4 | 70% |
| Academics | 1 | 4 | 70% |
| Portal / Landing | 0 | — | Cloudflare Pages |
| Outpass | 0 | — | Parked |
| Notifications (comms) | 1 | — | Push + inbox + mail |
| Mail / Files / Cron Deploy | 0 | — | Folded / CronJob-only |

Older claims of gateway-api 3→15 or auth 2→10 are **obsolete** and unsafe on a small VPS.

## Burst strategy

1. CDN / browser cache for static portal assets.
2. Gateway Redis cache: short TTL for authenticated GETs; ~30s for public CMS notices/banners.
3. Queue heavy work (Excel, PDF, push) via BullMQ — do not scale pods for inline bulk work alone.
4. Prefer query efficiency over replica count for results-day reads.

## Verified production capacity (2026-07-17)

The production VPS was tested with 500 distinct short-lived student JWTs against
profile, grades, and attendance:

- 500 concurrent students with a 3-second think time
- 7,284 successful requests, 0 errors
- 149.4 requests/second
- p50 67 ms, p95 275 ms, p99 502 ms
- node CPU peaked around 56%

This verifies 500 students browsing normally. It does not mean the server can
support 500 students continuously issuing requests with no think time. A
100-worker closed-loop stress test reached 421 requests/second and pushed node
CPU near 89%, so staged load and pre-warmed HPA replicas remain required for
results-day bursts.

## Ops commands

```bash
kubectl get hpa
kubectl get deploy
kubectl scale deployment uniz-academics-service --replicas=2
kubectl logs -f -l app=uniz-gateway-api
```

## Smoke after deploy

```bash
bash scripts/ops/post-deploy-smoke.sh
```
