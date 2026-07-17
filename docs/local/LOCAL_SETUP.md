# Local development

> **Document Status:** Active
> **Last Verified:** 2026-07-13

## Stack

Local UniZ needs:

1. **PostgreSQL** (ports `5432`–`5438`) and **Redis** (`6379`)
2. Node dependencies (`npm install`)
3. `secrets.env` → then `npm run vault:sync`
4. Prisma client generate + migrate for each service with a schema

## Recommended path

```bash
cp secrets.env.example secrets.env
npm run setup:local
npm run seed:local    # optional
npm run dev:all
```

| What | URL |
|------|-----|
| Portal | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |
| Docs | `npm run docs:dev` → http://localhost:3333/docs/ |
| Seeded admin | `webmaster` / `password123` |

## Docker Compose alternative

Full stack in containers (no local Postgres ports required):

```bash
cp .env.example .env
make up && make seed
```

See [docker/README.md](../../docker/README.md).

## Manual / troubleshooting

```bash
# Postgres + Redis only (same as setup:local infra step)
docker compose -f docker/local/compose.db.yml up -d uniz-redis uniz-postgres
npm install
npm run vault:sync
npm run prisma:generate
# then: npm run setup:local (includes db push) or make up for Compose
```

## Seed

```bash
npm run seed:local
# or: npx ts-node --transpile-only scripts/local/seed-local.ts
```

## Windows

Use WSL2 + Docker Desktop. Prefer bash for `setup-local.sh`.

## Production

Production is **K3s** via GitHub Actions — not this document. See root [README.md](../../README.md) and [STRUCTURE.md](../../STRUCTURE.md).
