# UniZ Infrastructure — VPS (k3s) + Cloudflare Pages

Single-node production topology:

- **Cloudflare Pages (free):** `uniz.rguktong.in` (portal), `rguktong.in` (landing)
- **VPS k3s:** Traefik → `uniz-gateway-api` → microservices, Postgres, Redis
- **Deploy:** GitHub Actions → GHCR → self-hosted runner on the VPS

## Layout

| Path | Role |
|---|---|
| `infra/kubernetes/base/core/` | Workloads, HPA, CronJobs |
| `infra/kubernetes/base/shared/` | Ingress, issuers, config |
| `infra/kubernetes/base/observability/` | Uptime Kuma + Netdata (optional apply) |
| `infra/docker-compose*.yml` | Local / legacy compose |
| `scripts/deploy/` | Deploy, secrets, CF Pages cutover |
| `docs/ops/` | Runbooks (index, rollback, HPA, backups, CF) |

## Local setup

```bash
npm run setup
npm run db:push   # if applicable
npm run docker:up
```

## Production deploy

```bash
gh workflow run "VPS Automated Deployment" -f commit_message="ship"
gh workflow run "Deploy Frontends to Cloudflare Pages" -f target=all
bash scripts/ops/post-deploy-smoke.sh
```

## Autoscaling (single node: 4 vCPU / ~15Gi)

HPA is real but **capacity-capped by one machine**. Targets:

- gateway-api `1→3` @ 45% CPU (edge absorber)
- auth `1→2` @ 50% CPU
- user / academics `1→3` @ 70% CPU
- notifications `1→2` @ 70% CPU

Do not HPA Postgres/Redis on this box. Monthly drill: see [docs/ops/HPA_DRILL.md](../docs/ops/HPA_DRILL.md).

## Ops index

See [docs/ops/INDEX.md](../docs/ops/INDEX.md).
