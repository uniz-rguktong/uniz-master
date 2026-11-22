# UniZ production URLs

Updated 22 November 2026. Canonical topology: [`PRODUCTION_TOPOLOGY.md`](PRODUCTION_TOPOLOGY.md). All application code lives in [`uniz-rguktong/uniz-master`](https://github.com/uniz-rguktong/uniz-master). The old per-service Vercel apps and separate `uniz-*` service repos are gone.

## Public sites

| Site | URL | Hosted on |
|------|-----|-----------|
| College website | https://rguktong.in | Cloudflare Pages (`apps/uniz-landing`) |
| UniZ portal | https://uniz.rguktong.in | Cloudflare Pages (`apps/uniz-portal`) |
| API gateway | https://api-uniz.rguktong.in/api/v1 | VPS: host nginx → Traefik → `uniz-gateway-api` |
| Landing CMS API | https://landing-api.rguktong.in | VPS: Traefik → landing-backend (FastAPI) |
| Docs | https://api-uniz.rguktong.in/docs | VPS: `uniz-docs-service` (VitePress) |

The college site uses the official RGUKT Ongole look. UniZ is a small text link on that site, not the site brand.

## Services behind the gateway

These are Kubernetes services on the VPS, reached through `https://api-uniz.rguktong.in/api/v1`. They are not separate GitHub repos and are not on Vercel.

| Service | App in this monorepo | Notes |
|---------|----------------------|--------|
| Gateway | `apps/uniz-gateway` | Routes `/api/v1` to the services below |
| Auth | `apps/uniz-auth` | Login, email OTP / reset codes |
| User | `apps/uniz-user` | Profiles, campus CMS, grievances, uploads |
| Academics | `apps/uniz-academics` | Grades, attendance, registration |
| Notifications | `apps/uniz-notifications` | Inbox, web push, SES email |
| Landing CMS | `apps/uniz-landing-backend` | Public website content; edited from the portal |
| Docs | `apps/uniz-docs` | VitePress |

Outpass routes are parked / gated (`503`) until explicitly re-enabled.

## Health

```bash
curl -fsS https://api-uniz.rguktong.in/api/v1/system/health
```

Each service also exposes `/health` on the cluster network. Day-to-day checks: [`docs/ops/INDEX.md`](../ops/INDEX.md).

## Configuration

Frontend build-time URLs:

- Portal: `VITE_API_URL=https://api-uniz.rguktong.in/api/v1`
- Landing: `VITE_LANDING_API_URL=https://landing-api.rguktong.in`

Server secrets and connection strings belong in the VPS Kubernetes secret and in GitHub Actions — not in this file. Use `secrets.env.example` for local development only.
