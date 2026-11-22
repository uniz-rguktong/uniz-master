---
title: "Gateway (uniz-gateway-api)"
description: "Express L7 router — serviceMap, Redis GET cache, health aggregate, docs proxy, session gate, dbadmin, outpass gate. Entry: apps/uniz-gateway/src/index.ts"
---

## Role

Single public API process for uniZ. Traefik sends `api-uniz.rguktong.in` traffic here (`:3000`). The old nginx Deployment `uniz-gateway` is **parked at 0 replicas**.

| | |
|--|--|
| **Code** | `apps/uniz-gateway/` |
| **Entry** | `src/index.ts` |
| **K8s** | `uniz-gateway-api` + HPA 1–2 |
| **Port** | 3000 |

## Responsibilities

1. **Route** `/api/v1/:service/*` → microservice via `serviceMap`
2. **Cache** eligible authenticated GETs in Redis
3. **Aggregate health** `GET /api/v1/system/health` (Redis TTL)
4. **Proxy docs** `/docs` → VitePress (`uniz-docs-service:3333`)
5. **Session gate** — `enforceCredentialSession` rejects a stale `tokenVersion` (`401 AUTH_TOKEN_REVOKED`) and blocks other calls while `mustChangePassword` is set (`403 PASSWORD_CHANGE_REQUIRED`)
6. **Gate outpass** return `503 OUTPASS_OUTING_DISABLED` when `ENABLE_OUTPASS_OUTING` is not `true` (grievance excluded)
7. **Proxy dbadmin** `/api/v1/dbadmin` → `uniz-dbadmin-service:3010` (webadmin-only upstream; not response-cached)
8. **CORS** from `CLIENT_URL`
9. **Analytics / CMS API** bridge to landing-backend

```mermaid
flowchart LR
  Traefik --> GW[gateway-api]
  GW --> Auth
  GW --> User
  GW --> Acad
  GW --> Notif
  GW --> Db[dbadmin :3010]
  GW --> Docs
  GW --> Land[landing-backend]
  GW --> Redis[(Redis)]
```

## Key env

| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Cache + health |
| `CLIENT_URL` | CORS allowlist |
| `ENABLE_OUTPASS_OUTING` | Unlock `/requests` (non-grievance). **Not on** in production. |
| `DBADMIN_SERVICE_URL` | Override the database browser upstream |
| `*_SERVICE_URL` | Override upstreams |
| `LANDING_API_URL` | Analytics / cms/api |
| `DOCS_SERVICE_URL` | Docs upstream |

## How to change routing

Edit `serviceMap` and the `/api/v1/:service/*path` handler in `apps/uniz-gateway/src/index.ts`, then rebuild/push image via VPS deploy workflow. Details: [Add API route](/howto/add-api-route).

## Related

- [Request flow](/system/request-flow)
- [API gateway map](/api/platform/gateway)
- [Health](/api/platform/health)
