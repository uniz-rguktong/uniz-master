# UniZ Codebase Index

> **For AI assistants:** Read this file first when exploring the repo.  
> **Repo:** `uniz-rguktong/uniz-master` · **Prod:** https://uniz.rguktong.in · **API:** `/api/v1` (same-origin via nginx)  
> **Last indexed:** 2026-07-03

---

## 1. Monorepo overview

| Item | Value |
|------|--------|
| Root | `package.json` — npm workspaces: `packages/*`, `apps/uniz-*` |
| Shared lib | `packages/uniz-shared` (`@uniz/shared`) — Zod types/constants |
| Portal npm name | `uniz` (workspace `apps/uniz-portal`) |
| Local dev | `npm run dev` — gateway + auth + user + portal |
| Full stack dev | `npm run dev:all` |
| CI build | `npm run ci:build` → `scripts/ci/ci-build.sh` |
| Deploy | push to `main` → `.github/workflows/deploy.yml` |
| Secrets template | `secrets.env.example` → copy to `secrets.env`, `npm run vault:sync` |

### Production URLs

| Host | Purpose |
|------|---------|
| `uniz.rguktong.in` | Student/admin portal (SPA) |
| `api-uniz.rguktong.in` | API gateway (also proxied as `/api/v1` on portal) |
| `rguktong.in` / `landing-api.rguktong.in` | Landing CMS + analytics |

---

## 2. Applications (`apps/`)

| Directory | K8s / GHCR image | Port (default) | Purpose |
|-----------|------------------|----------------|---------|
| `uniz-portal` | `uniz-portal` | 5173 (dev) | React/Vite SPA — students, admins, faculty |
| `uniz-gateway` | `uniz-gateway-api`, `uniz-gateway` (nginx) | 3000 | API reverse proxy, health, Redis cache |
| `uniz-auth` | `uniz-auth-service` | 3001 | Login, OTP, password, JWT issuance |
| `uniz-user` | `uniz-user-service` | 3002 | Profiles, bulk student import, CMS admin routes |
| `uniz-outpass` | `uniz-outpass-service` | 3003 | Outpass/outing requests, grievances |
| `uniz-academics` | `uniz-academics-service` | 3004 | Grades, attendance, subjects, seating, registration |
| `uniz-files` | `uniz-files-service` | 3005 | File uploads/downloads |
| `uniz-mail` | `uniz-mail-service` | 3006 | Email dispatch |
| `uniz-notifications` | `uniz-notification-service` | 3007 | Web push, inbox API, BullMQ worker |
| `uniz-cron` | `uniz-cron-service` | 3008 | Scheduled jobs |
| `uniz-docs` | `uniz-docs-service` | 3333 | Internal documentation site |
| `uniz-landing` | `uniz-landing` | — | Landing frontend static/build |
| `uniz-landing-backend` | (via landing svc) | 8000 | Landing CMS API |
| `uniz-android-twa` | — | — | Android TWA wrapper scripts |

### Backend entry pattern

Each service: `apps/<name>/src/index.ts` → Express app → `src/routes/*.routes.ts` → `src/controllers/` or `src/services/`.

Prisma (where used): `apps/<name>/prisma/schema.prisma` → generated at `src/generated/prisma/`.

Monorepo Docker build: `docker/prod/Dockerfile.service` with `SERVICE_DIR` + `WORKSPACE_NAME` build args (`scripts/deploy/deploy-common.sh`).

---

## 3. Gateway routing (`apps/uniz-gateway/src/index.ts`)

All client traffic hits `/api/v1/:service/*`:

| `:service` | Upstream | Notes |
|------------|----------|-------|
| `auth` | uniz-auth-service:3001 | Login, OTP, password |
| `profile` | uniz-user-service:3002 | Student/faculty/admin profiles |
| `cms` | user-service OR landing-backend | Split: `/api/*` → landing; banners/notifications → user |
| `academics` | uniz-academics-service:3004 | Grades, attendance, curriculum |
| `requests` | uniz-outpass-service:3003 | Outpass/outing |
| `grievance` | uniz-outpass-service:3003 | Student grievances |
| `files` | uniz-files-service:3005 | Uploads |
| `mail` | uniz-mail-service:3006 | Internal mail |
| `notifications` | uniz-notification-service:3007 | Push + inbox |
| `cron` | uniz-cron-service:3008 | Cron triggers |
| `docs` | uniz-docs-service:3333 | Optional health probe |

Special routes:
- `GET /api/v1/system/health` — aggregated service health
- `GET /api/v1/system/health/live` — liveness
- `/api/v1/analytics/*` → landing-backend
- `/docs/*` → docs service

Portal resolves API base in `apps/uniz-portal/src/api/endpoints.ts` — uses `/api/v1` on `uniz.rguktong.in`.

---

## 4. Database (Prisma per service)

Schemas live at `apps/<service>/prisma/schema.prisma`. Single Postgres DB, separate schemas (`uniz_auth`, `uniz_user`, etc.) — see `secrets.env.example`.

| Service | Key models |
|---------|------------|
| **uniz-auth** | `AuthCredential`, `OtpLog` |
| **uniz-user** | `StudentProfile`, `FacultyProfile`, `AdminProfile`, `BulkJob`, banners/CMS models |
| **uniz-academics** | `Subject`, `Grade`, `Attendance`, `Registration`, `SeatingArrangement`, `BranchAllocation` |
| **uniz-outpass** | `Outpass`, `Outing`, `Grievance`, approval workflow fields |
| **uniz-notifications** | `PushSubscription`, `NotificationInbox` |
| **uniz-cron** | Cron job state models |
| **uniz-files** | File metadata (if Prisma used) |
| **uniz-mail** | Mail queue/logs (if Prisma used) |

Migrations: `scripts/deploy/prisma-migrate-deploy-all.sh` (runs on VPS deploy).

---

## 5. Frontend — Portal (`apps/uniz-portal`)

### Stack

- **React 18** + **Vite** + **TypeScript**
- **Routing:** `react-router-dom` — routes in `src/App.tsx`
- **State:** Recoil (`src/store.ts`, atoms for student/admin)
- **UI:** Tailwind, Radix, MUI DataGrid (admin), Framer Motion
- **Auth tokens:** `localStorage` — `student_token`, `admin_token`, `faculty_token`
- **Path alias:** `@/` → `src/`

### Route map (`src/App.tsx`)

| Path | Component / behavior |
|------|----------------------|
| `/` | `pages/home.tsx` — landing; redirects if logged in |
| `/student/signin`, `/admin/signin` | `pages/auth/CommonSignin.tsx` |
| `/notifications` | `NotificationDeepLink.tsx` — push deep link + login redirect |
| `/student` | `Sidebar` content=`dashboard` → `pages/student/student.tsx` (profile) |
| `/student/attendance` | Sidebar → `pages/attendance/Attendance.tsx` |
| `/student/gradehub` | Sidebar → `pages/promotions/GradeHub.tsx` |
| `/student/current-semester` | `pages/student/CurrentSemester.tsx` |
| `/student/registration` | `pages/student/Registration.tsx` |
| `/student/grievance` | `pages/student/Grievance.tsx` |
| `/student/notifications` | Sidebar → `NotificationCenter.tsx` |
| `/student/resetpassword` | `pages/student/resetpass.tsx` |
| `/student/help` | `pages/student/HelpSupport.tsx` |
| `/admin/*` | `pages/admin/index.tsx` — role-based dashboards |
| `/admin/addstudents`, `/addgrades`, `/settings`, etc. | Standalone admin pages |
| `/admin/notifications` | `AdminNotificationsPage.tsx` |
| `/faculty` | `pages/faculty/dashboard.tsx` |
| `/developers`, `/privacy` | Static/marketing pages |

**Student shell:** Most `/student/*` routes render `components/Sidebar.tsx` with a `content` prop that lazy-loads the page. Header bell: `NotificationBellButton.tsx` (not on profile avatar).

### Admin roles (`pages/admin/index.tsx`)

Resolved via `utils/adminRole.ts` + JWT:

| Role | Dashboard |
|------|-----------|
| `webadmin`, `coe` | `Webmaster/WebmasterDashboard.tsx` |
| `director` | `Director/DirectorDashboard.tsx` |
| `dean`, `hod` | `Dean/DeanDashboard.tsx` |
| `swo`, `dsw` | `SWO/SWODashboard.tsx` |
| `warden` | `Warden/WardenDashboard.tsx` |
| `caretaker` | `Caretaker/CaretakerDashboard.tsx` |

Webadmin student details: `pages/admin/Webmaster/StudentDetails.tsx`  
Bulk upload UI: `StudentBulkSection.tsx` · API: `apps/uniz-user/src/controllers/bulk.controller.ts`

### Key frontend files

| Area | Path |
|------|------|
| API endpoints | `src/api/endpoints.ts` |
| API client | `src/api/apiClient.ts` |
| Auth guard | `src/hooks/is_authenticated.ts` |
| Student data | `src/hooks/student_info.ts` |
| Push / SW | `src/hooks/usePushNavigation.ts`, `public/sw.js` |
| Notifications UI | `src/pages/NotificationCenter.tsx`, `src/lib/notificationTypeMeta.tsx` |
| Unread badge | `src/hooks/useNotificationUnread.ts` |
| Login redirect | `src/utils/returnUrl.ts`, `CommonSignin.tsx` |
| Student profile | `src/pages/student/student.tsx` |
| Admin layout | `src/pages/admin/layout.tsx` |
| Navy/student UI tokens | `src/lib/student-ui.ts`, `src/components/admin/admin-ui.ts` |

---

## 6. Auth flow

1. Portal `POST /api/v1/auth/login/student` or `.../login/admin` (`endpoints.ts` → `SIGNIN`)
2. **uniz-auth** validates credentials (`routes/auth.routes.ts`, `controllers/`)
3. JWT returned → stored in `localStorage`
4. `useIsAuth` hook checks token + redirects unauthenticated users
5. OTP/password: `/auth/otp/*`, `/auth/password/*`
6. Push on login/password change: `apps/uniz-auth/src/utils/email.util.ts` → internal push to notifications service

---

## 7. Notifications (end-to-end)

| Layer | File |
|-------|------|
| Prisma model | `apps/uniz-notifications/prisma/schema.prisma` — `NotificationInbox`, `PushSubscription` |
| Inbox API | `apps/uniz-notifications/src/routes/inbox.routes.ts` |
| Push send | `apps/uniz-notifications/src/services/push.service.ts` |
| Internal push route | `apps/uniz-notifications/src/routes/push.routes.ts` |
| Portal inbox | `apps/uniz-portal/src/pages/NotificationCenter.tsx` |
| Service worker | `apps/uniz-portal/public/sw.js` |
| Deep link | `/notifications` → `NotificationDeepLink.tsx` |

Inbox endpoints (via gateway): `/api/v1/notifications/inbox`, `.../read`, `.../read-all`, `.../clear`.

---

## 8. Infrastructure & deploy

### K8s manifests

`infra/` — deployment YAMLs per service (e.g. `portal.yaml`, `auth-service.yaml`, `nginx/`).

Service ↔ app dir mapping: `scripts/deploy/deploy-common.sh` → `infra_yaml_to_dir()`.

### CI/CD (`.github/workflows/deploy.yml`)

1. **Build monorepo** — `npm ci`, `build:shared`, `ci:build`, portal `vite build`
2. **Plan GHCR builds** — `scripts/ci/ci-plan-build-matrix.sh` (diff-based)
3. **Build images** — parallel matrix, `scripts/ci/ci-build-one-image.sh`
4. **Deploy to VPS** — self-hosted runner, `scripts/ci/ci-local-deploy.sh` → `ci-remote-deploy.sh` → `deploy.sh`

Concurrency: `vps-deploy-main` with `cancel-in-progress: true`.

VPS work dir: `/root/uniz-master-main`. Secrets: `/root/uniz-secrets.env` via `scripts/deploy/render-vps-secrets.sh`.

### Important scripts

| Script | Purpose |
|--------|---------|
| `scripts/deploy/deploy.sh` | Main VPS deploy orchestrator |
| `scripts/deploy/deploy-common.sh` | Service list, GHCR build logic, change detection |
| `scripts/ci/ci-remote-deploy.sh` | GHA entry: git checkout SHA, flock, run deploy |
| `scripts/deploy/prisma-migrate-deploy-all.sh` | Apply all Prisma migrations |
| `scripts/deploy/prisma-generate-all.sh` | Generate all Prisma clients |
| `scripts/local/setup-local.sh` | Local docker/k3s bootstrap |
| `scripts/ops/uniz-vault.sh` | Local secrets vault sync |

---

## 9. Conventions

- **Commits:** Descriptive sentences; deploy tags in message: `[rebuild portal]`, `[rebuild all]`
- **Services naming:** Folder `uniz-auth` → image `uniz-auth-service` → gateway path `/api/v1/auth`
- **Controllers:** `*.controller.ts` in `src/controllers/`
- **Routes:** `src/routes/*.routes.ts` mounted in `index.ts`
- **Portal imports:** Prefer `@/` alias; lazy routes in `App.tsx`
- **Attribution middleware:** Most services include `attribution.middleware.ts`
- **Generated Prisma:** Do not edit `src/generated/prisma/` — edit `prisma/schema.prisma` + migrate
- **Portal typecheck:** `npm run typecheck -w uniz` has known legacy errors; CI uses `build` not typecheck

---

## 10. Quick lookup — "Where is X?"

| Looking for… | Go to |
|--------------|-------|
| Student profile page | `apps/uniz-portal/src/pages/student/student.tsx` |
| Student sidebar / dock nav | `apps/uniz-portal/src/components/Sidebar.tsx` |
| All portal routes | `apps/uniz-portal/src/App.tsx` |
| API URL constants | `apps/uniz-portal/src/api/endpoints.ts` |
| Login / signin | `apps/uniz-portal/src/pages/auth/CommonSignin.tsx` |
| Admin role routing | `apps/uniz-portal/src/pages/admin/index.tsx` |
| Webadmin tools | `apps/uniz-portal/src/pages/admin/Webmaster/` |
| Bulk student upload | `bulk.controller.ts` (user), `StudentBulkSection.tsx` (portal) |
| Grades / attendance backend | `apps/uniz-academics/src/routes/` |
| Outpass / outing | `apps/uniz-outpass/` |
| JWT / login backend | `apps/uniz-auth/src/routes/auth.routes.ts` |
| Student profile API | `apps/uniz-user/src/routes/profile.routes.ts` |
| Push notifications | `apps/uniz-notifications/` |
| Gateway proxy rules | `apps/uniz-gateway/src/index.ts` |
| Docker / K8s service list | `scripts/deploy/deploy-common.sh` → `UNIZ_SERVICES` |
| GitHub Actions deploy | `.github/workflows/deploy.yml` |
| Env var template | `secrets.env.example` |
| Shared types | `packages/uniz-shared/src/` |
| Service worker / PWA | `apps/uniz-portal/public/sw.js`, `InstallPWA.tsx` |
| Notification bell (header) | `NotificationBellButton.tsx` |
| Notification inbox UI | `NotificationCenter.tsx` |
| Prisma migration (all) | `scripts/deploy/prisma-migrate-deploy-all.sh` |
| VPS hardening (runs on deploy) | `scripts/deploy/harden-vps.sh` |
| Cloudflare tunnel/DNS | `scripts/deploy/setup-cloudflare-tunnel.sh` |

---

## 11. Directory tree (abbreviated)

```
uniz-master/
├── apps/
│   ├── uniz-portal/          # React SPA (npm name: uniz)
│   ├── uniz-gateway/           # API gateway
│   ├── uniz-auth/              # Authentication
│   ├── uniz-user/              # Profiles + bulk + CMS admin
│   ├── uniz-academics/         # Academic records
│   ├── uniz-outpass/           # Requests + grievances
│   ├── uniz-files/
│   ├── uniz-mail/
│   ├── uniz-notifications/
│   ├── uniz-cron/
│   ├── uniz-docs/
│   ├── uniz-landing/
│   ├── uniz-landing-backend/
│   └── uniz-android-twa/
├── packages/uniz-shared/       # @uniz/shared
├── infra/           # K8s manifests + nginx
├── scripts/                    # Deploy, CI, VPS, Prisma
├── docker/prod/Dockerfile.service   # Multi-service monorepo image
├── .github/workflows/deploy.yml
├── secrets.env.example
└── package.json
```

---

*Update this file when adding new apps, major routes, or changing deploy flow.*
