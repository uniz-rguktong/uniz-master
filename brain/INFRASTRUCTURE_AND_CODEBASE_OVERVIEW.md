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

## 2. Infrastructure & Routing (CRITICAL)

**⚠️ Important Production State Note (Feb 18, 2026)**
The infrastructure currently uses a **"Dumb Pipe" Nginx configuration**.
While the repository contains an `nginx.conf` with detailed location blocks, the **live production server** is configured to proxy **ALL** traffic from Nginx (`uniz-gateway`) directly to the Express Gateway (`uniz-gateway-api`).

- **Traffic Flow**: `Internet -> Nginx (Port 80/443) -> Express Gateway (Port 3000) -> Microservices`
- **Routing Logic**: The Express Gateway uses a **Regex-based router** (`/api/v1/:service/:path*`) to dynamically map requests to downstream services.

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

### Debugging Gateway Issues

If a "Service not found" error occurs:

1.  Check `uniz-gateway-api` (Express) logs.
2.  Verify the `serviceMap` in `apps/uniz-gateway/src/index.ts`.
3.  Ensure the Regex router is correctly parsing the URL.
4.  **Note**: The Nginx config in the repo (`infra/core-infra/nginx/nginx.conf`) might NOT match the live server if recent manual patches were applied. Always check the live state.

---

## 5. Troubleshooting History

- **CORS/Regex Issue**: The Gateway originally failed to route complex paths or handle CORS correctly over Nginx. Fixed by implementing a robust Regex router in Express and simplifying Nginx to a passthrough.
- **System Health Check**: The `/api/v1/system/health` endpoint failed because `system` wasn't a valid service. Fixed by adding an explicit route handler in the Gateway.
- **Bad Gateway (502)**: Caused by port conflicts with a legacy `k3s` / `nginx-ingress-controller` installation hijacking ports 80/443. Fixed by stopping `k3s` and restarting the host Nginx.
