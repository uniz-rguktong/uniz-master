# UniZ Gateway Service (`uniz-gateway`)

High-performance API Gateway (`uniz-production-gateway`) sitting behind host Nginx and Traefik on the VPS, routing `/api/v1/*` traffic across all UniZ microservices.

## Architecture Overview

- **Runtime:** Node.js + TypeScript + Express 5 (`express@^5.2.1`)
- **Proxy Engine:** Pooled HTTP Keep-Alive `http-proxy` with binary-passthrough safeguards (PDFs, XLSX, ZIPs, images)
- **Caching & State:** Redis (`ioredis`) edge response caching (`edge-cache.ts`) and rate limiting (`routerLimiterOptions` from `@uniz/shared`)
- **Session Gate:** `enforceCredentialSession` validates stale/revoked tokens and mandatory password-change gates against `uniz-auth` + Redis before forwarding requests
- **CORS & Security:** Explicit `CLIENT_URL` origin allowlist and sanitized upstream headers

## Routing Summary

| Path Prefix | Target | Notes |
| :--- | :--- | :--- |
| `/api/v1/auth/*` | `uniz-auth` | Identity, JWTs, OTP, credential status |
| `/api/v1/user/*`, `/api/v1/grievance/*` | `uniz-user` | Profiles, banners, admin actions, grievance |
| `/api/v1/academics/*` | `uniz-academics` | Grades, attendance, bulk Excel/PDF jobs |
| `/api/v1/notifications/*`, `/api/v1/mail/*` | `uniz-notifications` | Web Push, inbox, and AWS SES mail |
| `/api/v1/cms/api/*`, `/api/v1/analytics/*` | `uniz-landing-backend` | Public college site CMS & analytics |
| `/api/v1/requests/grievance/*` | `uniz-user` | Backward-compatible grievance alias |
| `/api/v1/requests/*` | `uniz-outpass` | **Parked** (`503 OUTPASS_OUTING_DISABLED` unless `ENABLE_OUTPASS_OUTING=true`) |
| `/api/v1/system/*` | Gateway / K8s checks | Health & cron status (`cron-health.ts`) |

## Local Development

```bash
npm install
npm test
npm run build
npm start   # default PORT=3000
```

> Part of [`uniz-master`](../../README.md).
