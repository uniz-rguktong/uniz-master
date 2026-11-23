---
title: "API gateway map"
description: "Complete /api/v1 prefix → upstream service table for integrators and operators."
---

Base URL (production):

```text
https://api-uniz.rguktong.in/api/v1
```

## Prefix map

| Prefix | Upstream | Status |
|--------|----------|--------|
| `/auth` | auth:3001 | Live |
| `/profile` | user:3002 | Live |
| `/cms` | user:3002 | Live |
| `/cms/api` | landing-backend | Live |
| `/academics` | academics:3004 | Live |
| `/notifications` | notifications:3007 | Live |
| `/mail` | notifications:3007 | Live (folded) |
| `/files` | user:3002 | Live (folded) |
| `/grievance` | user:3002 | Live |
| `/requests` | outpass:3003 | **Gated** — `503 OUTPASS_OUTING_DISABLED` unless `ENABLE_OUTPASS_OUTING=true` |
| `/requests/.../grievance*` | user:3002 | Live |
| `/dbadmin` | dbadmin:3010 | Live, **webadmin-only**. Not a public API. |
| `/analytics` | landing-backend | Live |
| `/system/health` | gateway local | Live |
| `/cron/health` | gateway local | Live. **200** `{ "status": "ok", "maintenance": "CronJob-only" }`. Not proxied to outpass. |
| `/docs` (site root, not under /api/v1) | docs:3333 | Live |

Implementation: `apps/uniz-gateway/src/index.ts`. Diagrams: [Request flow](/system/request-flow).
