# UniZ Production URLs

**Canonical topology:** [PRODUCTION_TOPOLOGY.md](./PRODUCTION_TOPOLOGY.md)

## Public hosts

| Surface | URL |
|---------|-----|
| Portal SPA | `https://uniz.rguktong.in` |
| Landing SPA | `https://rguktong.in` |
| API gateway | `https://api-uniz.rguktong.in/api/v1` |
| Docs | `https://api-uniz.rguktong.in/docs` |
| Landing CMS API | `https://landing-api.rguktong.in` |

All authenticated SPA traffic goes through the gateway. Do not call per-service hostnames.

## Gateway → backends (in-cluster)

| Gateway prefix | Backend |
|----------------|---------|
| `/api/v1/auth/*` | `uniz-api` (auth module) |
| `/api/v1/profile/*`, `/cms/*` (non-`/api`), `/files/*`, `/grievance/*` | `uniz-api` (user module) |
| `/api/v1/academics/*` | `uniz-api` (academics module) |
| `/api/v1/mail/*`, `/notifications/*` | `uniz-notification-service` |
| `/api/v1/requests/*` (non-grievance) | Outpass (parked unless `ENABLE_OUTPASS_OUTING=true`) |
| `/api/v1/cms/api/*`, `/analytics/*` | landing-backend (FastAPI) |

## Health

- Gateway aggregate: `GET https://api-uniz.rguktong.in/api/v1/system/health` (or gateway `/health`)
- Each Deployment exposes `/health` on its Service port

## Secrets / env (high level)

| Var | Where |
|-----|--------|
| `JWT_SECURITY_KEY`, `INTERNAL_SECRET` | K8s `uniz-secrets` |
| `AUTH_DATABASE_URL`, `USER_DATABASE_URL`, `ACADEMICS_DATABASE_URL`, … | K8s `uniz-secrets` |
| Service URLs | K8s `uniz-config` ConfigMap |
| Portal `VITE_API_URL` | Cloudflare Pages build |
| Landing `VITE_LANDING_API_URL` | Cloudflare Pages build |

> **Deprecated:** per-service `*.vercel.app` URLs and multi-repo deploys. Everything ships from `uniz-master` → GHCR / Cloudflare Pages.
