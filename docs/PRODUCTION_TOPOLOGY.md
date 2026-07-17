# UniZ Production Topology & Scaling

**Source of truth:** Kubernetes manifests under `infra/core-infra/kubernetes/base/`.
This document must match those manifests — do not invent higher replica ceilings than the VPS can schedule.

## Traffic model

- Steady campus load: tens of RPS.
- Burst windows (results, registration, notices): short spikes; design for caching + backend/DB headroom.
- Do not reserve equal CPU for frontend and backend. Portal is mostly static nginx; hot path is gateway-api + academics + auth + Postgres/Redis.

## Always-on production services

| Deployment | Base replicas | HPA min→max | Notes |
|------------|---------------|-------------|-------|
| uniz-portal | 1 | 1→2 | Light CPU; static assets |
| uniz-gateway (nginx) | 2 | 2→6 | Edge rate limit |
| uniz-gateway-api | 1 | 1→2 | Redis short-TTL cache; public CMS ~30s |
| uniz-auth-service | 1 | 1→2 | Login bursts |
| uniz-user-service | 1 | 1→4 | Profiles / CMS banners |
| uniz-academics-service | 1 | 1→3 | Grades, attendance, registration |
| uniz-outpass-service | 1 | 1→1 | **Grievance only** while outpass/outing disabled |
| uniz-mail-service | 1 | none | Email sender |
| uniz-notification-service | 1 | none | Web push / inbox |
| uniz-files-service | 1 | none | Upload proxy |
| uniz-landing | 1 | none | Marketing site |
| uniz-docs-service | 1 | none | Docs |

## Parked / CronJob-only

| Unit | Status |
|------|--------|
| uniz-cron-service Deployment | **Not applied** (removed from kustomization). Storage cleanup remains a CronJob. |
| Outpass/outing student+admin UI | Off unless `VITE_ENABLE_OUTPASS_OUTING=true` at portal build |
| `/api/v1/requests/*` | 503 unless `ENABLE_OUTPASS_OUTING=true` on gateway ConfigMap |
| Grievance (`/api/v1/grievance/*`) | Still served by outpass-service |

## Feature flags

| Flag | Where | Default | Effect |
|------|-------|---------|--------|
| `VITE_ENABLE_OUTPASS_OUTING` | Portal image build | `false` | Student/admin outpass UI |
| `ENABLE_OUTPASS_OUTING` | `uniz-config` ConfigMap | `false` | Gateway allows `/requests` |
| `VITE_MAINTENANCE_MODE` | Portal image build | `false` | Full portal maintenance page |

To re-enable outpass/outing later: set both flags to `true`, rebuild portal, roll gateway ConfigMap, optionally raise outpass HPA max.

## Capacity guidance (≈4 vCPU VPS)

Prefer roughly:

- Postgres + Redis: ~1.0–1.5 vCPU
- gateway-api + academics + auth: ~1.5–2.0 vCPU
- Portal + landing + idle services: ~0.5 vCPU

Avoid over-scheduling HPA maxima that sum far beyond cluster CPU.

## Deferred consolidations

After this slim runtime is stable:

1. Merge mail + notifications into one comms runtime.
2. Fold files uploads into user/academics owners.
3. Unify landing CMS vs user-service CMS ownership.
