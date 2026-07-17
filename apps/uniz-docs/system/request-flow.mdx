---
title: "Request flow"
description: "How one browser call reaches a microservice — Traefik, gateway-api routing, Redis cache, and grievance exception."
---

## Happy path (portal API)

```mermaid
sequenceDiagram
  participant Browser
  participant CF as Cloudflare
  participant Traefik
  participant GW as gateway-api
  participant Redis
  participant Svc as Microservice
  participant PG as Postgres

  Browser->>CF: GET https://api-uniz.../api/v1/profile/student/me
  CF->>Traefik: TLS / tunnel
  Traefik->>GW: HTTP :3000
  GW->>Redis: cache lookup (GET)
  alt cache hit
    Redis-->>GW: cached JSON
    GW-->>Browser: 200
  else cache miss
    GW->>Svc: proxy /student/me
    Svc->>PG: query
    PG-->>Svc: rows
    Svc-->>GW: JSON
    GW->>Redis: set short TTL
    GW-->>Browser: 200
  end
```

## Gateway decision tree

Implemented in `apps/uniz-gateway/src/index.ts`.

```mermaid
flowchart TD
  Req[Incoming request] --> Docs{Starts with /docs?}
  Docs -->|yes| DocsSvc[Proxy uniz-docs-service:3333]
  Docs -->|no| Health{ /api/v1/system/health*? }
  Health -->|yes| Local[Local aggregate / live]
  Health -->|no| Analytics{ /api/v1/analytics/*? }
  Analytics -->|yes| Land[landing-backend /api/analytics]
  Analytics -->|no| Cms{ /api/v1/cms/*? }
  Cms -->|cms/api/*| Land
  Cms -->|other cms| User[user-service]
  Cms -->|no| Svc{ /api/v1/:service/* }
  Svc --> Map[serviceMap lookup]
  Map --> Outpass{service == requests AND not grievance?}
  Outpass -->|flag off| S503[503 Feature disabled]
  Outpass -->|grievance OR flag on| Upstream[Proxy upstream]
  Map --> Upstream
```

## Path → upstream (serviceMap)

| Public prefix | Upstream (default) | Notes |
|---------------|--------------------|--------|
| `/api/v1/auth/*` | `uniz-auth-service:3001` | |
| `/api/v1/profile/*` | `uniz-user-service:3002` | |
| `/api/v1/cms/*` | user (except `/cms/api/*` → landing) | |
| `/api/v1/academics/*` | `uniz-academics-service:3004` | |
| `/api/v1/notifications/*` | `uniz-notification-service:3007` | |
| `/api/v1/mail/*` | notifications `:3007` | Folded |
| `/api/v1/files/*` | user `:3002` | Folded |
| `/api/v1/grievance/*` | user `:3002` | |
| `/api/v1/requests/*` | outpass `:3003` | **503** unless `ENABLE_OUTPASS_OUTING=true` |
| `/api/v1/requests/.../grievance*` | **forced to user** | Works while outpass parked |
| `/api/v1/analytics/*` | landing-backend | |
| `/docs` | `uniz-docs-service:3333` | |

## Portal build-time API base

Portal resolves absolute API URL at build time:

- Production Pages: `VITE_API_URL=https://api-uniz.rguktong.in/api/v1`
- Code: `apps/uniz-portal/src/api/endpoints.ts` (`resolveApiBaseUrl`)

Landing uses `VITE_LANDING_API_URL=https://landing-api.rguktong.in`.

## CORS

Gateway applies CORS from `CLIENT_URL` (comma-separated). Production includes `https://uniz.rguktong.in`. Landing CMS has its own CORS for `https://rguktong.in`.
