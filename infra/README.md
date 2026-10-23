# UniZ infrastructure

K3s manifests, Traefik ingress, and local Docker helpers for the UniZ monorepo.

**Source of truth for what runs in production:** [docs/architecture/PRODUCTION_TOPOLOGY.md](../docs/architecture/PRODUCTION_TOPOLOGY.md)

## Layout

| Path | Purpose |
|------|---------|
| `kubernetes/base/core/` | Always-on + parked Deployments, CronJobs |
| `kubernetes/base/shared/` | Ingress, ConfigMap templates, Traefik values |
| `kubernetes/archive/` | Retired manifests (nginx gateway, files, mail) |
| `nginx/` | Legacy nginx image (parked; Traefik is edge) |
| `scripts/` | Infra helper scripts |

## Production

- Edge: Traefik on VPS → `uniz-gateway-api` → `uniz-api` / notifications / docs
- Frontends: Cloudflare Pages (portal + landing Deployments stay at replicas 0)
- Images: `docker/prod/Dockerfile.service` → GHCR via GitHub Actions

Compose files under `infra/` are **not** used on the VPS. Local demo uses `docker/local/compose.yml` from the monorepo root (`make up`).

## Local

```bash
# From monorepo root
cp .env.example .env
make up && make seed
```

See [docker/README.md](../docker/README.md) and [docs/local/LOCAL_SETUP.md](../docs/local/LOCAL_SETUP.md).
