# UniZ Infrastructure — VPS (k3s) + Cloudflare Pages

Clean single-node production topology (post-cleanup):

- **Cloudflare Pages (free):** `uniz.rguktong.in` (portal), `rguktong.in` (landing)
- **VPS k3s:** host nginx → Traefik → `uniz-gateway-api` → microservices, Postgres, Redis, docs
- **Observability:** Netdata + Uptime Kuma on `127.0.0.1` (SSH tunnel only)
- **Deploy:** GitHub Actions → GHCR → self-hosted runner on the VPS
- **Not running:** legacy `uniz-api` monolith; portal/landing/gateway pods parked at 0

## Layout

| Path | Role |
|---|---|
| `infra/kubernetes/base/core/` | Workloads, HPA, CronJobs (parked FE/outpass annotated) |
| `infra/kubernetes/base/shared/` | Ingress, issuers, config |
| `infra/kubernetes/base/observability/` | Uptime Kuma + Netdata (loopback hostPorts) |
| `infra/docker-compose*.yml` | Local / legacy compose |
| `scripts/deploy/` | Deploy, secrets, harden-vps, CF Pages cutover |
| `scripts/ops/` | Smoke, vault, Uptime Kuma monitor seed |
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

HPA is real but **capacity-capped by one machine**. Honest requests leave headroom; idle spare capacity is the HPA budget.

- gateway-api `1→3` @ 45% CPU (edge absorber)
- auth `1→2` @ 50% CPU
- user / academics `1→3` @ 70% CPU
- notifications `1→2` @ 70% CPU

Do not HPA Postgres/Redis on this box. Monthly drill: [docs/ops/HPA_DRILL.md](../docs/ops/HPA_DRILL.md).

## Observability & inventory

```bash
ssh -L 19999:127.0.0.1:19999 -L 3001:127.0.0.1:3001 root@<vps>
# Netdata http://127.0.0.1:19999/ · Uptime Kuma http://127.0.0.1:3001/
```

Full checklist (allocated resources, parked list, host bind notes): [docs/ops/INDEX.md](../docs/ops/INDEX.md).
