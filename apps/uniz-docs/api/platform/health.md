---
title: "Platform health API"
description: "GET /api/v1/system/health and /live — aggregate probes, Redis cache, optional services."
---

## Live probe (no upstream fan-out)

```bash
curl -s https://api-uniz.rguktong.in/api/v1/system/health/live
```

## Aggregate health

```bash
curl -s https://api-uniz.rguktong.in/api/v1/system/health | jq
```

Probes each entry in gateway `serviceMap` at `/health`. Results cached in Redis key `gateway:system_health_aggregate` (~30s fresh / 120s stale-while-revalidate).

| Status | Meaning |
|--------|---------|
| `ok` | All probed services healthy |
| `degraded` | Critical OK, some non-critical issues |
| `down` | Critical failure → HTTP 503 |

**Optional** (treated healthy if down): `docs`, `requests`, `cron`.

Per-service health examples:

```bash
curl -s https://api-uniz.rguktong.in/api/v1/auth/health
curl -s https://api-uniz.rguktong.in/api/v1/notifications/health
```

Also see [Health check](/health).
