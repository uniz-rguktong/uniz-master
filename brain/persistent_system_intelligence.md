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

- **Network**: `uniz-infrastructure_default` (Legacy) / **K3s Cluster Network** (Active)
- **Runtime**: Hybrid transition from Docker to **K3s (Kubernetes)**.
- **Image Management**: K3s uses its own internal image store (containerd). Manual import via `k3s ctr images import` is required for local builds.

### Reverse Proxy (Nginx)

- **Role**: SSL Termination, Entry Point
- **Config Path**: `/etc/nginx/sites-enabled/uniz-api`
- **Behavior (Critical)**: Acts as a "dumb pipe" proxying all traffic to the Express Gateway (`uniz-gateway-api`) on Port 3000.
  - `location / { proxy_pass http://localhost:8080; ... }` (Note: 8080 maps to container 3000)

---

## 2. Application Architecture

The system is a **microservices-based monorepo** using a centralized API Gateway pattern.

### Service Registry

| Service Name             | Docker Service              | Internal Port | Replics | Responsibilities                                                            |
| :----------------------- | :-------------------------- | :------------ | :------ | :-------------------------------------------------------------------------- |
| **API Gateway**          | `uniz-gateway-api`          | 3000          | 3       | **Primary Router**, Request Validation, Rate Limiting, CORS, Aggregation.   |
| **Auth Service**         | `uniz-auth-service`         | 3001          | 1       | User Authentication, JWT Issuance, Session Management.                      |
| **User Service**         | `uniz-user-service`         | 3002          | 1       | User Profiles, **CMS (Banners/Content)**.                                   |
| **Outpass Service**      | `uniz-outpass-service`      | 3003          | 1       | Student Outpasses, **SWO Grievances**, Requests workflow.                   |
| **Academics Service**    | `uniz-academics-service`    | 3004          | 1       | Grades, Attendance, Curriculum Management, **Bulk Excel Ingestion**.        |
| **Files Service**        | `uniz-files-service`        | 3005          | 1       | S3-compatible file storage interface.                                       |
| **Mail Service**         | `uniz-mail-service`         | 3006          | 1       | Email dispatch (SendGrid/SMTP).                                             |
| **Notification Service** | `uniz-notification-service` | 3007          | 1       | Push Notifications (Web/App), In-app alerts, **Support for Image Banners**. |
| **Cron Service**         | `uniz-cron-service`         | 3008          | 1       | Background tasks, Scheduled jobs.                                           |
| **Frontend**             | `uniz-portal`               | 8081          | 1       | React/Vite SPA.                                                             |

### Inter-Service Communication

- **Protocol**: HTTP/REST over internal K8s cluster network.
- **Discovery**: K8s Service DNS (e.g., `http://uniz-user-service:3002`).
- **Internal Priority**: Services are hardcoded to prioritize internal service names over public `GATEWAY_URL` when `DOCKER_ENV=true` to prevent routing loops.
- **Resilience**: All internal axios calls enforce a **5-second timeout**.

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

### Repository Structure `uniz-master`

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
    - **Cause**: Port conflict or Nginx upstream caching old Container IPs.
    - **Fix**: Restart Nginx, or explicitly check `kubectl get endpoints` to ensure K8s is routing to healthy pods.
3.  **CORS Issues**:
    - **Cause**: Dual header injection (Nginx + Express) and hardcoded Absolute URLs in React bypassing proxies.
    - **Fix**: We now use a **Proxy-Only Networking Architecture**. Frontend uses relative paths (`/api/v1`), intercepted by Vite server locally and Nginx in production, eliminating cross-origin requests entirely.
4.  **Terminal Hang (3-minute Timeout)**:
    - **Cause**: Internal routing loop where services call the public Gateway URL from inside the cluster.
    - **Fix**: Force internal DNS strings (`-service`, `-api`) in code and add axios timeouts.
5.  **K3s Pods Not Using Local Build**:
    - **Cause**: K3s/containerd nodes cache image tags (like `:local`). Importing a new image with the same tag does not always trigger a container refresh.
    - **Fix**: Updated `deploy.sh` to use **Timestamped Tags** (`:local-$(date +%s)`) and force `imagePullPolicy: Always`.

6.  **504 Gateway Timeout (JSON Payloads)**:
    - **Cause**: The Node.js gateway was passing through the client's `Content-Length` header. If the gateway re-stringifies the JSON (or slightly modifies it), the length mismatch causes the upstream service/Nginx to hang and timeout.
    - **Fix**: Explicitly remove `Content-Length` for all non-multipart requests in `uniz-gateway/src/index.ts` to let `axios` recalculate it.
7.  **Empty Search Results for Push Subscribers**:
    - **Cause**: Case-sensitivity. Student IDs are stored as `O21...` (uppercase 'O'), but search prefixes like `?prefix=o21` were treated literally or lowercase-forced.
    - **Fix**: Refactored `uniz-notification-service` subscribers endpoint to use separate `findMany` with `mode: 'insensitive'` and manual counts.
8.  **Binary Data / PDF Proxy Corruption**:
    - **Cause**: Gateway was incorrectly casting binary arraybuffers as JSON objects, and forwarding mismatched `Content-Encoding` headers from upstream services after Axios had natively decompressed them.
    - **Fix**: Updated Gateway Express proxy to strictly enforce `responseType: "arraybuffer"` for exact byte-matching, and explicitly ignore upstream `Content-Encoding`/`Transfer-Encoding` when relaying headers.
9.  **Timezone Format Inconsistencies**:
    - **Cause**: Standard Node.js `toLocaleTimeString("en-IN")` doesn't strictly guarantee 12-hour AM/PM formatting uniformly across all OS language packs.
    - **Fix**: Used the `en-US` locale explicitly combined with `timeZone: "Asia/Kolkata"` and `hour12: true` options to strictly enforce Indian Standard Time format exactly as required by the mobile UI.
10. **Excel Ingestion Header Mismatch**:
    - **Cause**: Administrators using custom Excel layouts or legacy CSVs that don't match the strictly validated `uniz-academics` header requirements ("Student ID", "Subject Code", etc.).
    - **Fix**: Implemented a **Template Generator** in the portal that pre-populates valid headers and student keys, ensuring a "Download-Fill-Upload" workflow that guarantees validation success.
11. **Grievance Push Notification delivery**:
    - **Cause**: Push alerts sent without recipient names were appearing generic ("Dear User").
    - **Fix**: Updated `uniz-notifications` worker to fetch names and inject "Dear {Name}" greetings for a professional notification tone.

### Scaling Constraints

- **Single VPS**: Vertical scaling limit.
- **Database**: Single Postgres instance is a SPF (Single Point of Failure).

---

## 7. Deployment Layer

- **Registry**: Docker Hub (`desusreecharan/uniz-*`)
- **Pipeline**:

```bash
TAG=local-$(date +%s)
ssh -o StrictHostKeyChecking=no root@76.13.241.174 "cd /root/uniz-master && docker build --no-cache -t <SERVICE_IMAGE>:$TAG apps/<SOURCE_DIR> && docker save <SERVICE_IMAGE>:$TAG | /usr/local/bin/k3s ctr images import - && kubectl set image deployment/<DEPLOYMENT_NAME> <CONTAINER_NAME>=<SERVICE_IMAGE>:$TAG"
```

- **Hotfix Workflow**:
  1.  Create local patch file (`gateway_patch.ts`).
  2.  `cat patch | ssh root@host "cat > ..."`
  3.  Build image locally on VPS.
  4.  Restart container.

---

**Last Updated**: 2026-03-05
