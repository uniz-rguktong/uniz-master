# UniZ Architecture Refinement (v1.3)

Cleanup to reduce service sprawl on a single VPS. See also [PRODUCTION_TOPOLOGY.md](../architecture/PRODUCTION_TOPOLOGY.md).

## Done

- `@uniz/shared` for roles, JWT schema, error codes, branches
- Files upload folded into user-service; mail folded into notifications
- Cron maintenance → outpass image; storage cleanup CronJob only
- Portal/landing on Cloudflare Pages; Traefik → gateway-api (nginx parked)
- Outpass/outing feature-gated (`ENABLE_OUTPASS_OUTING` / `VITE_ENABLE_OUTPASS_OUTING`)

## Target (this program)

```
uniz-portal / uniz-landing  → Cloudflare Pages
uniz-gateway                → thin path router (keep)
uniz-api                    → auth + user + academics (one process, 3 Prisma schemas)
uniz-notifications          → push + SES (keep separate)
landing-backend             → FastAPI CMS (keep)
```

### uniz-api merge checklist

1. Export `createApp()` from auth / user / academics (no listen)
2. Each Prisma client prefers `AUTH_DATABASE_URL` / `USER_DATABASE_URL` / `ACADEMICS_DATABASE_URL`
3. Gateway sets `X-Uniz-Service` from URL segment; uniz-api dispatches to the matching Express app
4. Deploy `uniz-api` Deployment + Service + HPA; point ConfigMap URLs at it
5. Smoke test → scale auth/user/academics Deployments to 0
6. Delete `uniz-files` / `uniz-mail` apps; prod-shaped local Compose

### Still deferred

- Fold notifications into a worker process
- Single Prisma schema
- Revive or delete outpass entirely
- Containerize landing-backend (drop host Endpoints hack)
