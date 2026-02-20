# UniZ Infrastructure & Codebase Overview

> **Context File**: Read this file to ground yourself in the system architecture, service map, and current infrastructure state.

## 1. System Architecture

UniZ is a **microservices-based monorepo** built with Node.js, Express, Docker, and Nginx.

- **Frontend**: `uniz-portal` (React/Vite)
- **Backend API**: Accessible via `https://api.uniz.rguktong.in` (Production)
- **Gateway**: A dual-layer setup involving Nginx and an Express-based Application Gateway.

### Core Components

| Service                       | Port (Internal) | Description          | Key Responsibilities                                            |
| :---------------------------- | :-------------- | :------------------- | :-------------------------------------------------------------- |
| **uniz-gateway**              | 80 / 443        | Nginx Reverse Proxy  | SSL termination, entry point.                                   |
| **uniz-gateway-api**          | 3000            | Express API Gateway  | **Primary Router** (Regex-based), Auth middleware, Aggregation. |
| **uniz-auth-service**         | 3001            | Auth Service         | Authentication, Session management.                             |
| **uniz-user-service**         | 3002            | User Service         | User profiles, **CMS (Banners/Content)**.                       |
| **uniz-outpass-service**      | 3003            | Outpass Service      | Student outpasses, **Grievances**, **Requests**.                |
| **uniz-academics-service**    | 3004            | Academics Service    | Grades, Attendance, Curriculum.                                 |
| **uniz-files-service**        | 3005            | Files Service        | File uploads/downloads.                                         |
| **uniz-mail-service**         | 3006            | Mail Service         | Email delivery.                                                 |
| **uniz-notification-service** | 3007            | Notification Service | Push/In-app notifications.                                      |
| **uniz-cron-service**         | 3008            | Cron Service         | Scheduled tasks, background jobs.                               |
| **uniz-portal**               | 8081            | Frontend             | Web Interface.                                                  |

### Data Layer

- **Postgres** (Port 5432): Main relational database. Shared instance, likely separated by schemas/users.
- **Redis** (Port 6379): Caching and session store.

---

## 2. Infrastructure & Routing (UPDATED: Feb 20, 2026)

The infrastructure has transitioned from a "Dumb Pipe" setup to **Edge-Managed Routing and CORS** via Nginx.

- **Traffic Flow**: `Internet -> Nginx (Port 80/443) -> Target Microservice (Directly via Nginx)`
- **CORS Strategy**: Managed **EXCLUSIVELY** at the Nginx level.
  - All microservices have `cors()` middleware disabled in code.
  - Nginx adds `Access-Control-Allow-Origin` dynamically based on a whitelist.
  - Nginx uses `proxy_hide_header` for all `Access-Control-*` headers from backends to prevent duplicate header errors in the browser.

**Service Mapping (Express Gateway):**

- `auth` -> `uniz-auth-service:3001`
- `profile` / `cms` -> `uniz-user-service:3002`
- `requests` / `grievance` -> `uniz-outpass-service:3003`
- `academics` -> `uniz-academics-service:3004`
- `files` -> `uniz-files-service:3005`
- `mail` -> `uniz-mail-service:3006`
- `notifications` -> `uniz-notification-service:3007`
- `cron` -> `uniz-cron-service:3008`
- `system` -> **Internal Handler** (Port 3000, returns Health Check)

---

## 3. Key Directories

| Path                 | Purpose                                                                                  |
| :------------------- | :--------------------------------------------------------------------------------------- |
| `/apps/`             | Contains all microservice source code (`uniz-*`).                                        |
| `/infra/core-infra/` | Docker Compose files (`docker-compose.prod.yml`), Nginx configs.                         |
| `/scripts/`          | Helper scripts for dev (`dev/start.sh`), deployment (`sync/push.sh`), and DB management. |
| `/package.json`      | Root scripts for installing dependencies and managing the monorepo.                      |

---

## 4. Common Workflows

### Deployment

Deployment is often done by pushing code and running a sync script, or manually updating Docker services on the VPS.

- **VPS IP**: `76.13.241.174`
- **Manual update**:
  ```bash
  ssh root@... "cd ~/uniz-infrastructure && docker compose -f docker-compose.prod.yml up -d --build <service>"
  ```

---

## 5. Troubleshooting History

- **CORS/Regex Issue (Deprecated)**: The Gateway originally used a Regex router in Express for everything.
- **Production CORS Conflict (Feb 20, 2026)**: Fixed "Duplicate Access-Control-Allow-Origin" error caused by both Nginx and microservices adding headers. **Solution**: Disabled CORS in Node.js code and centralized it in Nginx using `proxy_hide_header` to sanitise backend responses.
- **Microservice IP Caching**: Encounted 502 Bad Gateway after service updates because Nginx cached stale Docker internal IPs. **Solution**: Explicitly reloaded Nginx (`nginx -s reload`) after container recreation.
- **System Health Check**: Fixed by adding explicit route handlers.
- **Bad Gateway (502)**: Caused by legacy `k3s` port conflicts. Resolved by stopping `k3s`.
- **PDF Logo Latency**: Report generation was slow due to repeated Cloudinary fetches. **Solution**: Implemented filesystem caching (`/usr/src/app/cache`) within the Academics and Mail services.

---

## 6. Design & Reporting Standards (Feb 20, 2026)

### Institutional Branding

- **Color Scheme**: Maroon (`#800000`) is the primary institutional color for all official documents and PDF reports.
- **Official Logo**: Uses the RGUKT Ongole logo (`rguktongole_logo_kbpaui.jpg`).
- **Typography**: Professional sans-serif (Helvetica) for all generated documentation.

### PDF Report Generation

- **Engine**: `pdfkit`.
- **Caching Strategy**: Logos and static assets must be cached in the service's `cache/` directory.
- **Consistency**: The `pdf.util.ts` file is shared/duplicated across `uniz-academics` and `uniz-mail`.
- **Data Cleanup**: Subject names are cleaned using regex (`cleanSubjectName`) to strip internal codes like `(CSE-...)` before rendering.
- **Layout**: Institutional headers use absolute Y-positioning to prevent logo overlap. Summaries are rendered in wide horizontal boxes for better space utilization.

---

## 7. Data State Annotations (Feb 20, 2026)

- **Mass Update: Student Branch**: All existing students in `user_v2.StudentProfile` have been updated to branch `CSE` to ensure data consistency across the ecosystem.
