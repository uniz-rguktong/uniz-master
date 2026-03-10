# UniZ Knowledge Graph: System Architecture & API Catalog

## 1. System Overview

UniZ is an ultra-speed microservices-based ecosystem for RGUKT-O academic and administrative management. It follows a multi-tenant-capable architecture (though currently single institution) with a consolidated API Gateway.

**Key Design Patterns:**

- **Layer 7 Super-Gateway**: Centralized entry point with Redis caching and streaming proxy.
- **Shared Master Database**: Single PostgreSQL instance with schema-based isolation (`auth_v2`, `user_v2`, `academics_v2`, etc.).
- **Distributed Auth**: Token-based (JWT) authentication verified across services via a shared secret or internal gateway calls.
- **Policy-Driven Notifications**: Suppressed email delivery in favor of Targeted Web Push for most academic updates.

---

## 2. Microservices Catalog

### 🌐 [uniz-gateway] - The Entry Point

- **Port**: 3000
- **Responsibility**: Routing, CORS, Compression, Redis Caching.
- **API Paths**:
  - `ANY /api/v1/:service/*`: Proxies to respective services.
  - `GET /gateway-status`: Gateway health monitor.
  - `GET /api/v1/system/health`: Aggregated health check of all microservices.

### 🔑 [uniz-auth] - Identity Provider

- **Port**: 3001
- **Database Schema**: `auth_v2`
- **Key Routes**:
  - `POST /login/student`: Student-specific credential validation.
  - `POST /login/admin`: Admin-specific credential validation (mapped to `/auth/login/admin`).
  - `POST /otp/request`: Trigger SMS/Email OTP (via `uniz-mail`).
  - `POST /password/reset`: Consume OTP and set secret.
  - `POST /admin/reset-password`: Force-reset user credentials.

### 👤 [uniz-user] - Profile & Identity Management

- **Port**: 3002
- **Database Schema**: `user_v2`
- **Key Routes**:
  - `GET /student/me`: Retrieve current student profile.
  - `PUT /student/update`: Self-service profile update.
  - `POST /student/search`: Bulk query students with filters (Branch, Category, Campus).
  - `POST /admin/student/upload`: Bulk Excel ingestion (Processes via Background redis worker).
  - `GET /admin/student/export`: Selective CSV/Excel export.

### 📝 [uniz-outpass] - Requests & Grievances

- **Port**: 3003
- **Database Schema**: `outpass_v2`
- **Key Routes**:
  - `POST /outpass`: Create new home leave request.
  - `POST /outing`: Create new local outing request.
  - `GET /history`: Student request history.
  - `POST /:id/approve`: Multi-level approval (Caretaker -> Warden -> Dean).
  - `POST /grievance/submit`: Anonymous/Targeted complaint submission.

### 🎓 [uniz-academics] - Core Academic Logic

- **Port**: 3004
- **Database Schema**: `academics_v2`
- **Integrations**:
  - **Self-Healing Jobs**: Proactively jump-starts stuck upload jobs (15s inactivity threshold).
  - **Cross-Service Profile Sync**: Automatically updates a student's `year` and `semester` in `uniz-user` upon subject registration.
  - **Targeted Notifications**: Triggers Push alerts for Dean Reviews, HOD Finalizations, and Results publication via Gateway.
- **Key Routes**:
  - `GET /grades`: Access student results.
  - `POST /grades/upload`: Bulk result ingestion.
  - `POST /semester/init`: Workflow start (matches subjects by code patterns e.g. `-E1-`).
  - `POST /student/register`: Subject registration with mandatory/elective validation.

---

## 3. Communication & Data Flow

### Internal Auth Flow

Most services use `attributionMiddleware` to verify requests.

1. Frontend calls Gateway with `Authorization: Bearer <JWT>`.
2. Gateway proxies to Service.
3. Service calls `uniz-auth` (internal) or verifies JWT with `INTERNAL_SECRET`.

### Data Flow Cross-References

- **Student Profile (User)** -> **Academic Registration (Academics)**: Registration triggers a `PUT` request from Academics to User to update student's active Year/Sem.
- **Bulk Uploads (Academics/User)** -> **Notifications (Gateway/Push)**: Completion or review requirements send Push alerts.
- **OTP Flow**: `uniz-auth` -> `uniz-mail` (Internal POST to `/send`).

---

## 4. Identified Gaps & Technical Debt

### 🚩 Critical Data Redundancy

1. **Schema Replicas**: `uniz-notifications`, `uniz-user`, and `uniz-auth` have nearly identical or overlapping Prisma schemas (e.g., `StudentProfile`, `FacultyProfile`).
   - **Risk**: Changes in one schema (like the recent removal of `rank/pucCgpa`) won't reflect in others, causing Prisma client errors if they point to the same database tables, or data drift if they use different schemas.
2. **Dead Models**: `uniz-outpass` defines `AuthCredential` and `uniz-notifications` defines `StudentProfile`, but neither service uses these models in their code.

### 🚩 API Configuration Issues

1. **Hardcoded Fallbacks**: Multiple services (Notifications, Outpass, Academics) have hardcoded `GATEWAY_URL` or `USER_SERVICE_URL` (often `http://localhost:3000` or `http://uniz-gateway-api:3000`) in code.
2. **Email Suppression Policy**: `uniz-notifications` suppresses email delivery for Results/Attendance. If a user hasn't accepted Push permissions, they receive **zero** alerts for results.
3. **Internal Auth**: The "Internal Secret" approach is inconsistent. Some calls use `x-internal-secret`, others re-forward the user's bearer token.

### 🚩 Broken/Partially Configured Endpoints

- **Faculty Management Dual-Path**: Faculty can be managed via `uniz-user/profile/faculty` (General Profile) and `uniz-academics/faculty` (Academic Profile). They are NOT synced. Adding a faculty to one does not add them to the other.
- **Manual Grade Entry**: `/grades/add` in Academics uses complex upsert logic that might conflict with bulk upload history if not synchronized.
- **Grievance Resolution**: The resolution logic in `uniz-outpass` for grievances doesn't currently trigger any notification back to the student.
