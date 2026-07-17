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
| uniz-user-service | 1 | 1→4 | Profiles, CMS banners/notices, `/image/upload`, **grievance** |
| uniz-academics-service | 1 | 1→3 | Grades, attendance, registration |
| uniz-outpass-service | **0** | — | Parked; outpass/outing gated; maintenance CronJob image only |
| uniz-notification-service | 1 | none | **Comms**: push + inbox + mail `/send` |
| uniz-landing | 1 | none | Marketing site |
| uniz-docs-service | 1 | none | Docs |

## Parked / folded / CronJob-only

| Unit | Status |
|------|--------|
| uniz-cron-service Deployment | Not applied; storage cleanup CronJob only |
| uniz-mail-service Deployment | Folded into notifications; replicas 0 / not in kustomization |
| uniz-files-service Deployment | Folded into user; replicas 0 / not in kustomization |
| uniz-outpass-service Deployment | **replicas: 0** — grievance moved to user; revive when outing/outpass enabled |
| Outpass/outing student+admin UI | Off unless `VITE_ENABLE_OUTPASS_OUTING=true` |
| `/api/v1/requests/*` (non-grievance) | 503 unless `ENABLE_OUTPASS_OUTING=true` |
| Grievance (`/api/v1/grievance/*`, `/requests/grievance/*`) | **user-service** |

## CMS ownership (no FastAPI rewrite)

| Path prefix | Owner |
|-------------|-------|
| `/api/v1/cms/api/*` | Landing FastAPI (website pages, institute, departments) |
| `/api/v1/cms/notifications`, `/banners`, `/admin/*` | User-service (portal notices/banners) |

Treat gateway as the CMS facade. Full DB unification is deferred.

## Feature flags

| Flag | Where | Default | Effect |
|------|-------|---------|--------|
| `VITE_ENABLE_OUTPASS_OUTING` | Portal image build | `false` | Student/admin outpass UI |
| `ENABLE_OUTPASS_OUTING` | `uniz-config` ConfigMap | `false` | Gateway allows `/requests` |
| `VITE_MAINTENANCE_MODE` | Portal image build | `false` | Full portal maintenance page |

## Frontend CDN (Cloudflare — $0)

Portal and landing stay on the VPS origin. Cloudflare (zone already on `rguktong.in`) provides free edge caching:

- Orange-cloud DNS for `uniz.rguktong.in` / `rguktong.in`
- Cache Rules: long TTL for static assets (js/css/fonts/images); bypass HTML, `/sw.js`, `/api/*`
- Applied by `scripts/deploy/configure-cloudflare-portal-cdn.sh` during deploy (uses `CLOUDFLARE_API_TOKEN`)

API (`api-uniz.rguktong.in`) is not edge-cached. Backend + Postgres + Redis remain on the VPS.

## Capacity guidance (≈4 vCPU VPS)

- Postgres + Redis: ~1.0–1.5 vCPU
- gateway-api + academics + auth: ~1.5–2.0 vCPU
- Portal + landing + idle: ~0.5 vCPU

## CI image builds

Default matrix builds core services only. Retired images (`mail`, `files`, always-on `cron` worker) rebuild when `BUILD_OPTIONAL=true` or via scoped `SERVICES=`.

## Ops

```bash
bash scripts/ops/post-deploy-smoke.sh
bash scripts/ops/backup-postgres.sh
kubectl get hpa,deploy
kubectl logs -f -l app=uniz-gateway-api
```

See also [MONITORING.md](./MONITORING.md) and [UniZ_Scaling_Report.md](./UniZ_Scaling_Report.md).
