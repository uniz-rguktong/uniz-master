# Persistent System Intelligence Protocol

> **System Architecture, Infrastructure, and Codebase Blueprint**

This file serves as the **authoritative source of truth** for the UniZ ecosystem. It must be consulted before any debugging, architectural changes, or code generation. It is a living document that evolves with the system.

---

## 1. Infrastructure Layer

### Server Specification

- **Provider**: Hostinger VPS (srv1389260.hstgr.cloud)
- **IP Address**: `76.13.241.174`
- **OS**: Ubuntu 24.04 LTS (Noble Numbat)
- **Resources**: TBD (Standard VPS configuration)

### Network Configuration

- **Firewall**: `ufw` (Active)
- **Open Ports**:
  - `22/tcp` (SSH)
  - `80/tcp` (HTTP)
  - `443/tcp` (HTTPS)
  - `8080/tcp` (Gateway Direct Access)
- **Load Balancing**: None (Single Node)
- **SSL**: Let's Encrypt (Managed via Certbot/Nginx)
- **Domain**: `api.uniz.rguktong.in` maps to `76.13.241.174`

### Container Orchestration

- **Runtime**: Docker Engine (27.5.1) with Docker Compose (v2.32.4)
- **Network**: `uniz-infrastructure_default` (Bridge Network)

### Reverse Proxy (Nginx)

- **Role**: SSL Termination, Entry Point
- **Config Path**: `/etc/nginx/sites-enabled/uniz-api`
- **Behavior (Critical)**: Acts as a "dumb pipe" proxying all traffic to the Express Gateway (`uniz-gateway-api`) on Port 3000.
  - `location / { proxy_pass http://localhost:8080; ... }` (Note: 8080 maps to container 3000)

---

## 2. Application Architecture

The system is a **microservices-based monorepo** using a centralized API Gateway pattern.

### Service Registry

| Service Name             | Docker Service              | Internal Port | Replics | Responsibilities                                                          |
| :----------------------- | :-------------------------- | :------------ | :------ | :------------------------------------------------------------------------ |
| **API Gateway**          | `uniz-gateway-api`          | 3000          | 3       | **Primary Router**, Request Validation, Rate Limiting, CORS, Aggregation. |
| **Auth Service**         | `uniz-auth-service`         | 3001          | 1       | User Authentication, JWT Issuance, Session Management.                    |
| **User Service**         | `uniz-user-service`         | 3002          | 1       | User Profiles, **CMS (Banners/Content)**.                                 |
| **Outpass Service**      | `uniz-outpass-service`      | 3003          | 1       | Student Outpasses, Grievances, Requests workflow.                         |
| **Academics Service**    | `uniz-academics-service`    | 3004          | 1       | Grades, Attendance, Curriculum Management.                                |
| **Files Service**        | `uniz-files-service`        | 3005          | 1       | S3-compatible file storage interface.                                     |
| **Mail Service**         | `uniz-mail-service`         | 3006          | 1       | Email dispatch (SendGrid/SMTP).                                           |
| **Notification Service** | `uniz-notification-service` | 3007          | 1       | Push Notifications, In-app alerts.                                        |
| **Cron Service**         | `uniz-cron-service`         | 3008          | 1       | Background tasks, Scheduled jobs.                                         |
| **Frontend**             | `uniz-portal`               | 8081          | 1       | React/Vite SPA.                                                           |

### Inter-Service Communication

- **Protocol**: HTTP/REST over Docker internal network.
- **Discovery**: DNS-based via Docker Service Names (e.g., `http://uniz-user-service:3002`).

---

## 3. Data Layer

### Primary Database (PostgreSQL)

- **Version**: 17-alpine
- **Host**: `uniz-postgres` (Port 5432)
- **User**: `user` / **DB**: `uniz_db`
- **Schema Strategy**: Shared Database, potentially Schema-per-service (TBD).

### Cache / Session Store (Redis)

- **Version**: 7-alpine
- **Host**: `uniz-redis` (Port 6379)
- **Usage**: Session storage, caching frequent queries, Rate limiting counters.

---

## 4. Codebase Intelligence

### Repository Structure `uniz-master-vault`

- **`apps/`**: Source code for all microservices.
  - `uniz-gateway/src/index.ts`: **Critical**. Contains the Regex Router logic.
  - `uniz-*/src/`: Individual service logic.
- **`infra/core-infra/`**:
  - `docker-compose.prod.yml`: Production orchestration file.
  - `nginx/`: Nginx configuration templates (Warning: Production may differ).
- **`scripts/`**: Automation scripts.

### Key logic

- **Route Handling**: The Express Gateway uses a Regex-based router `app.all(/^\/api\/v1\/([^/]+)\/(.*)/, ...)` to dynamically parse the Service Name and Proxy Path.
- **Health Check**: A dedicated aggregated health check at `/api/v1/system/health` queries all downstream services in parallel. (Latency < 10ms).

---

## 5. API Registry

### System Endpoints

- `GET /api/v1/system/health`
  - **Auth**: Public (Rate Limited TBD)
  - **Response**: aggregated system health status.
  - **Handler**: Internal Gateway Logic.

### CMS Endpoints

- `GET /api/v1/cms/banners/public`
  - **Auth**: `x-cms-api-key` header required.
  - **Handler**: Proxied to `uniz-user-service`.

_(This section to be expanded as APIs are indexed)_

---

## 6. Operational Intelligence

### Known Failure Patterns & Fixes

1.  **"Service not found in gateway map"**:
    - **Cause**: The Gateway's Regex router encountered a service key (e.g., `system`) that wasn't mapped in `serviceMap`.
    - **Fix**: Add explicit route handlers in Gateway code or update `serviceMap`.
2.  **Bad Gateway (502)**:
    - **Cause**: Port conflict with legacy K3s/Ingress Controller hijacking 80/443.
    - **Fix**: `systemctl stop k3s`, `k3s-killall.sh`, restart Nginx.
3.  **CORS Issues**:
    - **Cause**: Nginx handling CORS logic conflicting with Express.
    - **Fix**: Simplified Nginx to pass headers through; handled detailed CORS logic in Express Gateway.

### Scaling Constraints

- **Single VPS**: Vertical scaling limit.
- **Database**: Single Postgres instance is a SPF (Single Point of Failure).

---

## 7. Deployment Layer

- **Registry**: Docker Hub (`desusreecharan/uniz-*`)
- **Pipeline**: GitHub Actions -> Docker Build -> Push to Hub -> SSH to VPS -> `docker compose pull && up -d`.
- **Hotfix Workflow**:
  1.  Create local patch file (`gateway_patch.ts`).
  2.  `cat patch | ssh root@host "cat > ..."`
  3.  Build image locally on VPS.
  4.  Restart container.

---

**Last Updated**: 2026-02-18
