---
title: "Action flows"
description: "Mermaid maps for every major student, webmaster, HOD, dean, SWO, and auth action — UI → gateway → service → store."
---

# Action flows

Every diagram below follows the same shape:

**Browser (Portal)** → **Cloudflare** → **Traefik** → **gateway-api** → **owning service** → **Postgres / Redis / Cloudinary / SES**

Gateway path map: [Request flow](/system/request-flow) · [API gateway](/api/platform/gateway).

::: tip
Outpass and outing are **feature-flagged off** in production. Grievance still works via User service.
:::

## Auth (all roles)

### Student login

```mermaid
sequenceDiagram
  participant B as Browser
  participant GW as gateway-api
  participant A as Auth
  participant PG as Postgres

  B->>GW: POST /api/v1/auth/login/student
  GW->>A: proxy
  A->>PG: verify credentials
  PG-->>A: AuthCredential
  A-->>B: JWT student_token
```

### Admin / faculty login

```mermaid
sequenceDiagram
  participant B as Browser
  participant GW as gateway-api
  participant A as Auth
  participant PG as Postgres

  B->>GW: POST /api/v1/auth/login/admin
  GW->>A: proxy
  A->>PG: verify staff credentials
  A-->>B: admin_token or faculty_token
```

### Password reset via OTP

```mermaid
sequenceDiagram
  participant B as Browser
  participant GW as gateway-api
  participant A as Auth
  participant Q as BullMQ
  participant N as Notifications
  participant SES as AWS SES

  B->>GW: POST /auth/otp/request
  GW->>A: proxy
  A->>A: store OTP in Postgres
  A->>Q: enqueue OTP_DELIVER
  A-->>B: 200 queued
  Q->>N: worker
  N->>N: try web push
  alt no push devices
    N->>SES: send OTP email
  end
  B->>GW: POST /auth/otp/verify
  GW->>A: verify OTP
  B->>GW: POST /auth/password/reset
  GW->>A: update password hash
```

### Logged-in password change

```mermaid
flowchart LR
  UI[Reset password page] --> GW[gateway-api]
  GW --> Auth
  Auth --> PG[(Postgres)]
```

---

## Student

| Action | Endpoint | Service |
|--------|----------|---------|
| Bootstrap / home | `GET /profile/student/bootstrap` | User |
| Update profile | `PUT /profile/student/update` | User |
| Upload photo | `POST /files/image/upload` | User → Cloudinary |
| Grades | `GET /academics/grades` | Academics |
| Attendance | `GET /academics/attendance` | Academics |
| Register subjects | `POST /academics/student/register` | Academics |
| Registration PDF | `GET /academics/student/registration/pdf` | Academics → BullMQ |
| Notices | `GET /cms/notifications` | User |
| Submit grievance | `POST /grievance/submit` | User |
| Inbox | `GET /notifications/inbox` | Notifications |

### Profile bootstrap

```mermaid
sequenceDiagram
  participant B as Browser
  participant GW as gateway-api
  participant U as User
  participant R as Redis
  participant PG as Postgres

  B->>GW: GET /profile/student/bootstrap
  GW->>U: proxy
  U->>R: profile cache?
  alt miss
    U->>PG: StudentProfile + flags
    U->>R: set short TTL
  end
  U-->>B: profile JSON
```

### Grades and attendance

```mermaid
flowchart LR
  UI[GradeHub / Attendance] --> GW[gateway-api]
  GW --> Acad[Academics]
  Acad --> PG[(Postgres)]
  Acad --> PDF[PDFKit download]
```

### Course registration

```mermaid
sequenceDiagram
  participant B as Browser
  participant GW as gateway-api
  participant A as Academics
  participant PG as Postgres

  B->>GW: GET /academics/student/available
  GW->>A: available subjects
  A->>PG: BranchAllocation + electives
  A-->>B: subject list
  B->>GW: POST /academics/student/register
  GW->>A: register
  A->>PG: insert Registration rows
  A-->>B: success
```

### Registration PDF (queued)

```mermaid
sequenceDiagram
  participant B as Browser
  participant GW as gateway-api
  participant A as Academics
  participant Q as BullMQ
  participant R as Redis

  B->>GW: GET /student/registration/pdf
  GW->>A: enqueue job
  A->>Q: registration-pdf-queue
  A-->>B: 202 jobId
  Q->>A: worker generates PDF
  A->>R: store PDF bytes TTL
  B->>GW: GET /registrations/pdf/jobs/:id
  B->>GW: GET .../download
  GW->>A: read Redis buffer
  A-->>B: application/pdf
```

### Notices on home

```mermaid
flowchart LR
  UI[NoticeBoard] --> GW[gateway-api]
  GW --> User
  User --> PG[(PublicNotification)]
```

---

## Webmaster / COE / Director

Shared admin shell. COE uses Webmaster dashboard; Director is nearly identical (no semester-approvals tab).

| Action | Endpoint | Service |
|--------|----------|---------|
| Search / edit students | `/profile/student/search`, admin student CRUD | User |
| Bulk upload students | `/profile/admin/student/upload` | User → Redis job |
| Upload grades / attendance | `/academics/grades|attendance/upload` | Academics |
| Subjects CRUD | `/academics/subjects…` | Academics |
| Semester builder | `/academics/semester…` | Academics |
| Registration tracking + bulk PDF | `/registrations/tracking`, `/pdf/bulk` | Academics |
| Campus banners / updates | `/cms/admin/…` | User |
| Website CMS | `/cms/api/…` | Landing FastAPI |
| Push broadcast | `/notifications/push/send` | Notifications → BullMQ |
| Reset student password | `/auth/admin/global-reset-password` | Auth |

### Student bulk upload

```mermaid
sequenceDiagram
  participant B as Admin UI
  participant GW as gateway-api
  participant U as User
  participant R as Redis
  participant PG as Postgres

  B->>GW: POST /profile/admin/student/upload
  GW->>U: accept file
  U->>R: push student:job:queue
  U-->>B: 202 uploadId
  U->>U: worker processNextBatch
  U->>PG: upsert StudentProfile
  U->>R: upload:progress
  B->>GW: GET upload/progress
```

### Grades / attendance upload

```mermaid
flowchart TB
  UI[UploadSection] --> GW[gateway-api]
  GW --> Acad[Academics]
  Acad --> Q[Redis job:queue]
  Q --> W[processNextBatch]
  W --> PG[(Grade / Attendance)]
  UI --> P[poll upload/progress]
```

### Semester publish (OTP)

```mermaid
sequenceDiagram
  participant B as Webmaster
  participant GW as gateway-api
  participant A as Academics
  participant N as Notifications
  participant SES as AWS SES

  B->>GW: POST /semester/:id/publish/request-code
  GW->>A: generate OTP in Redis
  A->>N: POST /mail/send type=otp
  N->>N: enqueue EMAIL
  N->>SES: deliver
  B->>GW: POST /semester/:id/publish
  GW->>A: verify OTP + open registration
```

### Bulk registration PDF

```mermaid
flowchart LR
  UI[Registration progress] --> GW
  GW --> Acad[Academics]
  Acad --> Q[registration-pdf-queue]
  Q --> PDF[PDFKit bulk]
  PDF --> Redis[(result TTL)]
  UI --> DL[poll + download]
```

### Campus CMS and push

```mermaid
flowchart TB
  subgraph portal [Portal admin]
    Banners[Banners / Updates]
    Website[Website live edit]
    Push[Push alerts]
  end
  Banners --> User[User /cms/admin]
  Website --> Land[Landing FastAPI /cms/api]
  Push --> Notif[Notifications]
  Notif --> Q[BullMQ PUSH_BROADCAST]
  Q --> Devices[Web Push]
```

---

## HOD

Slim Dean shell: students (dept), semester approvals, registration tracking.

### Approve semester (HOD_REVIEW → next)

```mermaid
sequenceDiagram
  participant B as HOD UI
  participant GW as gateway-api
  participant A as Academics
  participant PG as Postgres

  B->>GW: GET /academics/dean/review/:branch
  GW->>A: allocations for branch
  A->>PG: BranchAllocation
  A-->>B: pending subjects
  B->>GW: POST /academics/semester/:id/advance
  GW->>A: HOD approve branch
  A->>PG: mark approved / advance status
```

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> DEAN_REVIEW
  DEAN_REVIEW --> HOD_REVIEW
  HOD_REVIEW --> APPROVED
  APPROVED --> REGISTRATION_OPEN
  REGISTRATION_OPEN --> REGISTRATION_CLOSED
```

---

## Dean

Full academic + CMS tabs, plus semester approvals for all branches.

### Allocation review and approve

```mermaid
sequenceDiagram
  participant B as Dean UI
  participant GW as gateway-api
  participant A as Academics
  participant PG as Postgres

  B->>GW: GET /academics/dean/review/:branch
  B->>GW: POST /academics/dean/allocation
  GW->>A: create/update allocation
  A->>PG: BranchAllocation
  B->>GW: POST /academics/dean/approve
  A->>PG: isApproved = true
  B->>GW: POST /semester/:id/advance
  A->>PG: DEAN_REVIEW to HOD_REVIEW
```

---

## SWO / Grievance

| Action | Endpoint | Service |
|--------|----------|---------|
| Student submit | `POST /grievance/submit` | User |
| SWO list | `GET /requests/grievance/list` | User (gateway rewrite) |
| Resolve | `PATCH /requests/grievance/:id/resolve` | User → SES |
| Delete | `DELETE /requests/grievance/:id` | User |

### Student submits grievance

```mermaid
sequenceDiagram
  participant B as Student
  participant GW as gateway-api
  participant U as User
  participant PG as Postgres

  B->>GW: POST /api/v1/grievance/submit
  GW->>U: create Grievance
  U->>PG: insert pending
  U-->>B: ticket id
```

### SWO resolves grievance

```mermaid
sequenceDiagram
  participant B as SWO
  participant GW as gateway-api
  participant U as User
  participant PG as Postgres
  participant N as Notifications
  participant SES as AWS SES

  B->>GW: GET /requests/grievance/list
  Note over GW: remaps to User service
  GW->>U: list
  B->>GW: PATCH /requests/grievance/:id/resolve
  GW->>U: resolve
  U->>PG: status=resolved
  U->>N: queue email
  N->>SES: notify student
```

---

## Faculty

```mermaid
flowchart LR
  Login[Admin signin] --> FT[faculty_token]
  FT --> Dash[/faculty dashboard]
  Dash --> Me[GET /profile/faculty/me]
  Dash --> Search[POST /profile/student/search]
  Dash --> PW[POST /auth/password/change]
```

---

## Security / Caretaker / Warden

Outpass gate actions are **parked** unless `ENABLE_OUTPASS_OUTING=true`.

```mermaid
flowchart TB
  Sec[SecurityPortal] -->|flag on| OP[Outpass service]
  Care[Caretaker / Warden] -->|flag on| OP
  Care --> Status[PUT /profile/student/status]
  Status --> User
  OP --> PG[(Outpass / Outing)]
```

---

## Docs API (in-house docs)

VitePress static site, **not** Cloudflare Pages.

```mermaid
flowchart LR
  Browser --> CF[Cloudflare]
  CF --> API[api-uniz.rguktong.in/docs]
  API --> Traefik
  Traefik --> Docs[uniz-docs-service:3333]
  Docs --> VP[Static VitePress HTML]
```

| Item | Value |
|------|-------|
| Public URL | `https://api-uniz.rguktong.in/docs` |
| App | `apps/uniz-docs` |
| Gateway | proxies `/docs` → docs service |
| Local | `npm run docs:dev` (see package scripts) |

---

## Role → dashboard cheat sheet

| Role | Portal shell |
|------|----------------|
| student | `/student` |
| webmaster / coe | WebmasterDashboard |
| dean | DeanDashboard (full) |
| hod | DeanDashboard (slim) |
| director | DirectorDashboard |
| swo / dsw | SWODashboard |
| faculty | `/faculty` |
| security | SecurityPortal |
| caretaker_* / warden_* | Caretaker / Warden dashboards |
| ao / librarian | Generic admin hub (seeded) |
