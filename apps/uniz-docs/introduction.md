---
title: "Introduction"
description: "What uniZ is — a light-only campus PWA for RGUKT academics, profiles, notices, and grievances."
---

uniZ is the university administration platform for RGUKT. Students, faculty, and staff use one light-only Progressive Web App for academics, profiles, campus notices, and grievances. Outpass and outing stay in the codebase but are **gated off** in production. They are not a current student workflow.

The portal ignores a stored `uniz-theme` of `dark` or `system` and drops it (`apps/uniz-portal/src/lib/forceLightTheme.ts`). The public college site is light as well. There is no dark-mode toggle.

## Product vs platform

| Layer | What users see | What operators run |
|-------|----------------|--------------------|
| Portal | `uniz.rguktong.in` — light-only PWA | Cloudflare Pages |
| Public site | `rguktong.in` | Cloudflare Pages + landing-api |
| API | Transparent to users | `api-uniz.rguktong.in` on VPS (gateway-api microservices) |

Webadmin operators use three tools that older docs omitted: the [Roles screen](/admin/roles-directory), the [database browser](/admin/database), and the [website editor](/admin/website-editor) for `rguktong.in`. Start at the [Webadmin workspace](/admin/webadmin).

## Who this docs site is for

- **Students / staff** — role guides under Student / Admin / Faculty
- **API consumers** — API Reference tab
- **Operators & developers** — System Architecture, Services, Deploy & Ops, How-to

Start here if you are changing the system: [Search index](/search-index) → [System overview](/system/overview).

- **[Quick Start](/quickstart)**
- **[Roles](/roles)**
- **[Architecture](/system/overview)**
- **[Gateway map](/api/platform/gateway)**
