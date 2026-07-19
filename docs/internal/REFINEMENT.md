# UniZ Architecture Refinement (v1.2)

Incremental cleanup to reduce duplication and service sprawl **without** a risky full rewrite.

## What changed

### 1. `@uniz/shared` package (`packages/uniz-shared`)

Shared types used across services:

- `UserRole`, `ADMIN_ROLES`
- `JwtPayloadSchema`, `JwtPayload`
- `ErrorCode`

**Wired today:** all backend services (`uniz-auth`, `uniz-user`, `uniz-academics`, `uniz-outpass`, `uniz-files`, `uniz-mail`, `uniz-notifications`) via `src/shared/*` re-exports.

**Next:** Extract shared `auth.middleware` factory into `@uniz/shared` (services still duplicate middleware logic).

### 2. `uniz-files` → image uploads only

Removed dead grade/attendance Excel paths (portal already uses `uniz-academics` for those).

- No Prisma / no shadow academics database
- Routes: `POST /image/upload` only

### 3. `uniz-notifications` slimmed

- Prisma schema: **`PushSubscription` only** (removed copied user/CMS models)
- Removed ~500 lines of unused PDF generation
- Split into `services/push.service.ts`, `worker/notification.worker.ts`, `routes/push.routes.ts`
- Removed hardcoded VAPID fallbacks in production (env required)

### 4. Cron maintenance → `uniz-outpass`

Outpass expiry + pending-status sync now lives in `apps/uniz-outpass/src/jobs/maintenance.ts`.

- HTTP trigger: `GET /api/cron` on outpass (internal secret in prod)
- Gateway: `/api/v1/cron/*` → outpass service
- K8s `uniz-maintenance-job` uses **outpass image**

`uniz-cron` is **deprecated** for maintenance; it remains only for VPS **storage cleanup** (`runStorageCleanup`).

## Target architecture (future)

```
uniz-portal          → React UI
uniz-gateway         → API router (keep)
uniz-api (monolith)  → auth + user + academics + outpass modules  [future merge]
uniz-worker          → mail + notifications queue + PDF           [future merge]
uniz-files           → image uploads → Cloudflare R2 (stateless; folded into user-service)
uniz-landing (+ API) → public site
```

## Deploy notes

### Monorepo (npm workspaces)

- Root `package.json` workspaces: `packages/*`, `apps/uniz-*`
- Single root `package-lock.json` — run `npm install` at repo root only
- Shared code: `@uniz/shared` via `"*"` (npm workspace link; resolves to local package)
- Docker: backend services build with `docker/prod/Dockerfile.service` from repo root
- CI: `.github/workflows/ci.yml` runs `npm ci` + `npm run ci:build` before deploy

After pulling these changes:

1. `npm install` at repo root (builds `@uniz/shared` via prepare script)
2. `cd apps/uniz-notifications && npx prisma generate` (if schema changed)
3. Deploy with `[rebuild all]` in commit message for first monorepo image rebuild
4. Maintenance CronJob needs `OUTPASS_DATABASE_URL`, not `CRON_DATABASE_URL`

## What we intentionally did NOT do yet

- Merge auth/user/academics/outpass into one process (needs coordinated K8s + env migration)
- Remove `uniz-cron` deployment entirely (storage cleanup still uses it)
- Consolidate `PushSubscription` into `uniz-user` DB (notifications DB still separate)
