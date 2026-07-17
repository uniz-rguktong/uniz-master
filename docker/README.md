# Docker

## Local / demo (full stack Compose)

**File:** [`local/compose.yml`](local/compose.yml)

```bash
cp .env.example .env   # from repo root
make up && make seed   # uses --project-directory . so build context is the monorepo root
```

| URL | Service |
|-----|---------|
| http://localhost:8080 | Portal (or `WEB_PORT`) |
| http://localhost:8080/api/v1 | API via portal |
| http://localhost:3000/api/v1 | Gateway direct |

- Images: `Dockerfile.deps` → `uniz-deps:local`, then `Dockerfile.service.local`
- Portal: `Dockerfile.portal` + nginx
- Seed: `--profile seed`
- Auto-migrate only when `UNIZ_AUTO_DB_PUSH=true` (Compose sets this). Never on K8s.

## Local / hot-reload (DB only)

**File:** [`local/compose.db.yml`](local/compose.db.yml)

Postgres + Redis only for `npm run setup:local` / `npm run dev:all`.

```bash
docker compose -f docker/local/compose.db.yml up -d uniz-redis uniz-postgres
```

Day-to-day hot reload: `npm run setup:local` + `npm run dev:all` — see [docs/local/LOCAL_SETUP.md](../docs/local/LOCAL_SETUP.md).

## Production (CI / VPS)

**File:** [`prod/Dockerfile.service`](prod/Dockerfile.service)

- Multi-stage build, non-root `uniz` user
- Built by GitHub Actions → GHCR → `kubectl` on K3s
- Migrations: `scripts/deploy/prisma-migrate-deploy-all.sh` (not Compose)

Never point VPS at `docker/local/compose.yml`.
