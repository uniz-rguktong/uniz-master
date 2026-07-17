---
title: "Database migrations"
description: "How UniZ services apply Prisma/SQL migrations in production safely."
---

## Pattern

Each service that owns tables typically has Prisma under `apps/uniz-<service>/prisma/`.

```bash
# Example helper used in deploy paths
bash scripts/deploy/prisma-migrate-deploy-all.sh
```

## Rules

1. **Never** hand-edit production schema without a migration file in git
2. Run migrate **before** rolling code that depends on new columns
3. Grievance move: apply user-service migration, then `scripts/ops/migrate-grievances-to-user.sh` if copying legacy rows
4. Landing CMS may use SQLAlchemy/`migrate.py` — treat separately from Prisma apps

## Backup first

```bash
bash scripts/ops/backup-postgres.sh
```

## Verify

- Service `/health` ok
- `GET /api/v1/system/health` → `ok`
- Critical portal flows (login, profile, grades) smoke-tested
