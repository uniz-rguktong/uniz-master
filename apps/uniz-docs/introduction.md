---
title: "Introduction"
description: "What UniZ is — campus PWA for RGUKT academics, profiles, notices, grievances, and gated mobility features."
---

UniZ is the university administration platform for RGUKT. Students, faculty, and staff use one Progressive Web App for academics, profiles, campus notices, grievances, and (when enabled) outpass/outing workflows.

## Product vs platform

| Layer | What users see | What operators run |
|-------|----------------|--------------------|
| Portal | `uniz.rguktong.in` | Cloudflare Pages |
| Public site | `rguktong.in` | Cloudflare Pages + landing-api |
| API | Transparent to users | `api-uniz.rguktong.in` on VPS |

## Who this docs site is for

- **Students / staff** — role guides under Student / Admin / Faculty
- **API consumers** — API Reference tab
- **Operators & developers** — System Architecture, Services, Deploy & Ops, How-to

Start here if you are changing the system: [Search index](/search-index) → [System overview](/system/overview).

- **[Quick Start](/quickstart)**

  - **[Roles](/roles)**

  - **[Architecture](/system/overview)**

  - **[Gateway map](/api/platform/gateway)**
