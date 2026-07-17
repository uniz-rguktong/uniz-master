---
title: UniZ Documentation
description: Complete UniZ docs — architecture, services, deploy, APIs, and role guides for RGUKT.
---

# UniZ Documentation

Use search (**Ctrl/Cmd + K**) or the [Search index](/search-index) to find **how something is implemented** and **what to change**.

- **[System architecture](/system/overview)** — Mermaid maps of Pages, Traefik, gateway-api, and data stores
- **[Search index](/search-index)** — Keyword table for every major topic
- **[Deploy & ops](/ops/deploy)** — VPS GHCR deploy, Cloudflare Pages, runbooks
- **[API gateway map](/api/platform/gateway)** — Every `/api/v1` prefix → upstream service
- **[Student guide](/students/login)** — Login, academics, profile
- **[How to add an API](/howto/add-api-route)** — Service → gateway → portal → docs checklist

## Production shape (one glance)

```mermaid
flowchart LR
  FE[Cloudflare Pages\nportal + landing] --> API[VPS Traefik]
  API --> GW[gateway-api]
  GW --> Svc[auth user academics notifications]
  Svc --> Data[(Postgres + Redis)]
```

::: info
Outpass/outing UI and `/api/v1/requests/*` (except grievance) are **disabled** in production. See [Feature flags](/ops/feature-flags).
:::
