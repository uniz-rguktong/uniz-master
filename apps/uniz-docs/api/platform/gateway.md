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
| `/health` | gateway local | Live |
| `/auth` | uniz-api:3001 | Live |
| `/profile` | uniz-api:3001 | Live |
| `/cms` | uniz-api:3001 | Live |
| `/cms/api` | landing-backend | Live |
| `/academics` | uniz-api:3001 | Live |
| `/notifications` | notifications:3007 | Live |
| `/mail` | notifications:3007 | Live (folded) |
| `/files` | uniz-api:3001 | Live |
| `/grievance` | uniz-api:3001 | Live |
| `/requests` | outpass:3003 | **Gated** (503) |
| `/requests/grievance/*` | uniz-api:3001 | Live |
| `/analytics` | landing-backend | Live |
| `/system/health`, `/system/health/live` | gateway local | Live |
| `/cron` | outpass (internal) | Internal |
| `/docs` (site root, not under /api/v1) | docs:3333 | Live |

uniz-api bundles the auth, user and academics modules and dispatches on the `X-Uniz-Service` header the gateway sets. Full endpoint list: [Endpoint reference](/api/reference).

Implementation: `apps/uniz-gateway/src/index.ts`. Diagrams: [Request flow](/system/request-flow).
