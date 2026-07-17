# UniZ Scaling Report (aligned with manifests)

**Status:** Lean production topology  
**Orchestration:** K3s with HPA  
**Canonical detail:** [PRODUCTION_TOPOLOGY.md](./PRODUCTION_TOPOLOGY.md)

## Replica matrix (manifest truth)

| Service | Min | Max | CPU target |
|---------|-----|-----|------------|
| Gateway nginx | 2 | 6 | 60% |
| Gateway API | 1 | 2 | 45% |
| Auth | 1 | 2 | 50% |
| User | 1 | 4 | 70% |
| Academics | 1 | 3 | 70% |
| Outpass | 1 | 1 | Grievance only; outpass API gated |
| Portal | 1 | 2 | 70% |
| Notifications (comms) | 1 | — | Push + inbox + mail |
| Mail / Files / Cron Deploy | 0 | — | Folded / CronJob-only |

Older claims of gateway-api 3→15 or auth 2→10 are **obsolete** and unsafe on a small VPS.

## Burst strategy

1. CDN / browser cache for static portal assets.
2. Gateway Redis cache: short TTL for authenticated GETs; ~30s for public CMS notices/banners.
3. Queue heavy work (Excel, PDF, push) via BullMQ — do not scale pods for inline bulk work alone.
4. Prefer query efficiency over replica count for results-day reads.

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
