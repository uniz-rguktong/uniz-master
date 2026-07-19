# UniZ — handover guide

Start here if you're new to the project. This is the single entry point for the
team taking over UniZ.

## 1. What UniZ is

A microservices monorepo for the campus platform (students, faculty, admins,
public website). High-level architecture, the request path, and the role
cheat sheet live in the root **[README.md](../README.md)**. Deep architecture
docs are under [`docs/architecture/`](architecture/) and the live in-house docs
site is at <https://api-uniz.rguktong.in/docs> (source in `apps/uniz-docs/`).

## 2. Run it locally

You do **not** need production secrets. See **[README.md](../README.md#okay-but-how-to-setup-this-locally-)**
and [`docs/local/LOCAL_SETUP.md`](local/LOCAL_SETUP.md).

Quick path:

```bash
cp secrets.env.example secrets.env
npm run setup:local
npm run seed:local
npm run dev:all
```

Seeded admin login: **`webadmin` / `password123`**.

## 3. How to contribute (read before your first PR)

- Full workflow: **[CONTRIBUTING.md](../CONTRIBUTING.md)**.
- Review & merge policy (who can approve/merge, how access is granted):
  **[docs/ops/github-governance.md](ops/github-governance.md)**.

In short: branch off `main`, push, open a PR, request review from a code owner
(`@sreecharan-desu`). Only an approved PR can be merged, and only a maintainer
with push access merges it. Do not merge your own PR.

## 4. Recent major changes (context for the codebase you inherited)

| Area | What changed | Where to read more |
|------|--------------|--------------------|
| **Admin role rename** | The top admin role `webmaster` was renamed to **`webadmin`** everywhere (canonical). `webmaster` remains a temporary backward-compatible alias and will be removed. | `packages/uniz-shared/src/roles.enum.ts`, `admin-role.ts` |
| **Image storage → Cloudflare R2** | Profile photos, banners, and website images now upload to the user-service `/files/image/upload` endpoint, which compresses to WebP (`sharp`) and stores in **Cloudflare R2** (S3 + CDN). Old Cloudinary URLs still work; Excel/CSV bulk backups still use Cloudinary. | [`api/comms/files`](https://api-uniz.rguktong.in/docs/api/comms/files), `apps/uniz-user/src/utils/r2.util.ts` |
| **API performance overhaul** | Indexing, Redis caching, gateway cache, bounded concurrency, and inter-service hardening across all services. | [`docs/architecture/PERFORMANCE_OVERHAUL.md`](architecture/PERFORMANCE_OVERHAUL.md) |
| **Database redesign / hygiene** | Dropped dead databases/tables, added composite + functional/case-insensitive unique indexes, CHECK constraints, and a scheduled `ANALYZE` CronJob. | `apps/*/prisma/`, `infra/kubernetes/base/core/postgres-analyze-job.yaml` |

## 5. Deploy

Deploys are automatic: merging to `main` triggers GitHub Actions, which builds
changed services and deploys to the VPS (K3s). No manual VPS steps. Details in
[CONTRIBUTING.md](../CONTRIBUTING.md#production-deploy-automatic) and
[`apps/uniz-docs/ops/deploy.md`](../apps/uniz-docs/ops/deploy.md).

## 6. Secrets & environment

- Local: `secrets.env` (from `secrets.env.example`) — dev placeholders only.
- Production: GitHub Actions repo secrets + `/root/uniz-secrets.env` on the VPS.
- R2 image uploads need `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET`, `R2_PUBLIC_BASE_URL` set as repo secrets (see `secrets.env.example`).

## 7. Where things live

| Thing | Path |
|-------|------|
| Services | `apps/uniz-*` |
| Shared code (roles, helpers) | `packages/uniz-shared` |
| Portal (React SPA) | `apps/uniz-portal` |
| In-house docs site | `apps/uniz-docs` (served at `/docs`) |
| Infra (K8s, Docker) | `infra/`, `docker/` |
| Ops scripts | `scripts/` |
| Canonical layout | [`STRUCTURE.md`](../STRUCTURE.md) |
