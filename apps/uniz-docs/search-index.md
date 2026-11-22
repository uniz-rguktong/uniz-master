---
title: "Search index — find anything"
description: "Keyword map: search this page (Ctrl/Cmd+K) or skim the tables to jump to how uniZ is built and how to change it."
---

Use the local VitePress search (**Ctrl/Cmd + K**) with the keywords below. Every row links to the page that explains **how it is implemented** and **what to change**.

## Architecture & hosting

| You want… | Keywords | Go to |
|-----------|----------|--------|
| Full system picture | architecture, topology, mermaid, VPS, Cloudflare | [System overview](/system/overview) |
| Where each host lives | Pages, api-uniz, landing-api, DNS | [Production topology](/system/topology) |
| One HTTP request path | Traefik, gateway-api, proxy | [Request flow](/system/request-flow) |
| Role action Mermaid maps | student, webadmin, HOD, dean, grievance, OTP | [Action flows](/system/action-flows) |
| Postgres / Redis | database, redis, endpoints, backup | [Data stores](/system/data-stores) |
| JWT, CORS, secrets | auth, INTERNAL_SECRET, CLIENT_URL | [Security](/system/security) |
| First-login email code | password change otp, Set a new password | [Password](/api/auth/password), [Student login](/students/login) |
| Session gate | mustChangePassword, tokenVersion, PASSWORD_CHANGE_REQUIRED, AUTH_TOKEN_REVOKED | [Security](/system/security), [Auth service](/services/auth) |
| Light-only theme | forceLightTheme, no dark mode | [Introduction](/introduction), [Docs service](/services/docs) |
| Database browser | dbadmin, /api/v1/dbadmin, webadmin SQL | [Database](/admin/database) |
| Roles screen | role_mgmt, permission matrix, dean, director | [Roles screen](/admin/roles-directory) |
| Website editor | rguktong.in preview, publish, discard | [Website editor](/admin/website-editor) |
| Email layout | wordmark, otp template, plain_notice, suppressed | [Notifications](/services/notifications), [Mail](/api/comms/mail) |
| Student password reset | login-revamp, already applied, campus mailbox | [Runbooks](/ops/runbooks), [Auth service](/services/auth) |
| Responsive audit | viewports, audit:responsive | [Responsive audit](/howto/responsive-audit) |

## Services (code → runtime)

| Service | Keywords | Go to |
|---------|----------|--------|
| Gateway (Express) | routing, cache, /api/v1, health | [Gateway](/services/gateway) |
| Auth | login, OTP, JWT, password | [Auth](/services/auth) |
| User | profile, CMS, grievance, files upload | [User](/services/user) |
| Academics | grades, attendance, registration | [Academics](/services/academics) |
| Notifications | push, inbox, mail | [Notifications](/services/notifications) |
| Landing CMS | FastAPI, analytics, landing-api | [Landing](/services/landing) |
| Docs (this site) | VitePress, /docs | [Docs service](/services/docs) |
| Parked / folded | outpass, mail, files, cron, nginx | [Parked services](/services/parked) |

## Deploy & change management

| Task | Keywords | Go to |
|------|----------|--------|
| Ship backend to VPS | GHCR, kubectl, deploy.yml | [VPS deploy](/ops/deploy) |
| Ship portal/landing | Pages, wrangler, DNS cutover | [Cloudflare Pages](/ops/cloudflare-pages) |
| Toggle outpass / maintenance | feature flags, ENABLE_OUTPASS | [Feature flags](/ops/feature-flags) |
| Incidents & smoke | smoke, backup, scale | [Runbooks](/ops/runbooks) |
| Add a new API route | gateway serviceMap, Express route | [Add API route](/howto/add-api-route) |
| Change portal UI | Vite, VITE_API_URL, Pages | [Change frontend](/howto/change-frontend) |
| Prisma / SQL | migrate, prisma | [Database migrations](/howto/database-migrations) |
| HPA / capacity | replicas, 4 vCPU | [Scale & HPA](/howto/scale-and-hpa) |
| Bring outpass back | ENABLE_OUTPASS_OUTING | [Revive outpass](/howto/revive-outpass) |

## User-facing product guides

| Audience | Go to |
|----------|--------|
| Students | [Login](/students/login), [Academics](/students/academics), [Profile](/students/profile) |
| Admins | [Overview](/admin/overview), [Webadmin](/admin/webadmin), [Roles screen](/admin/roles-directory), [Database](/admin/database), [Website editor](/admin/website-editor), [Semester registration](/admin/semester-registration) |
| Faculty | [Grades](/faculty/grades), [Attendance](/faculty/attendance) |
| API consumers | [API gateway map](/api/platform/gateway), [Health](/api/platform/health) |

::: tip
Prefer searching by **file path** too — e.g. `apps/uniz-gateway/src/index.ts`, `ingress.yaml`, `deploy-cloudflare-pages.sh`. Those strings appear in the how-to pages.
:::
