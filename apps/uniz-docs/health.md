---
title: "Health Check"
description: "Per-service /health and gateway aggregate /api/v1/system/health — probes, cache, troubleshooting."
---

## Service health

Each microservice exposes `/health` (gateway prefixes it under `/api/v1/<service>/health`).

```bash
curl -s https://api-uniz.rguktong.in/api/v1/auth/health
curl -s https://api-uniz.rguktong.in/api/v1/notifications/health
```

Typical **200**:

```json
{
  "status": "ok",
  "service": "uniz-auth-service",
  "attribution": "SreeCharan"
}
```

## Platform aggregate

```bash
curl -s https://api-uniz.rguktong.in/api/v1/system/health | jq .status
```

See [Platform health API](/api/platform/health) for cache behavior and optional services.

## Docs pod

```bash
curl -s https://api-uniz.rguktong.in/docs/health
```

Nginx in the docs container returns JSON without rendering Mintlify.

## Troubleshooting

| Observation | Action |
|-------------|--------|
| `files` / `mail` unhealthy | ConfigMap must point to user / notifications URLs |
| Stale `down` after fix | `redis-cli DEL gateway:system_health_aggregate` |
| Docs slow in aggregate | Optional service; prefer `/docs/health` path in probes |
