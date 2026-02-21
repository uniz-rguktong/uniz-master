# UniZ Infrastructure & Codebase Overview

> **Context File**: Read this file to ground yourself in the system architecture, service map, and current infrastructure state.

## 1. System Architecture

UniZ is a **microservices-based monorepo** built with Node.js, Express, Docker, and Nginx.

- **Frontend**: `uniz-portal` (React/Vite)
- **Backend API**: Accessible via `https://api.uniz.rguktong.in` (Production)
- **Runtime**: Hybrid transition from Docker Compose to **Kubernetes (K3s)**.
- **Gateway**: A dual-layer setup involving K8s Nginx Ingress/Nginx Load Balancer and an Express-based Application Gateway.

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

- **Traffic Flow**: `Internet -> Nginx (Port 80/443) -> Target Microservice`
- **CORS Strategy (The Proxy Approach)**: Managed by **eliminating cross-origin requests entirely**.
  - **Local Development**: `VITE_API_URL` is set to relative `/api/v1` in `.env.local`. Vite's dev server proxies `/api` to the backend. No CORS needed.
  - **Production**: `VITE_API_URL` is set to relative `/api/v1` in `.env`. The frontend Nginx container proxies `location /api/v1/` to the internal K8s gateway service (`http://uniz-gateway-api:3000`). No CORS needed.
  - **Rule**: NEVER use absolute URLs (e.g., `https://api...`) in frontend source code. Always use relative URLs relying on the proxy.

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

| Path                 | Purpose                                                                |
| :------------------- | :--------------------------------------------------------------------- |
| `/apps/`             | Contains all microservice source code (`uniz-*`).                      |
| `/infra/core-infra/` | Contains K8s manifests (`kubernetes/base/`) and legacy Docker Compose. |
| `/scripts/`          | Helper scripts for dev, deployment, and DB management.                 |
| `/package.json`      | Root scripts for installing dependencies and managing the monorepo.    |

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
- **Production CORS Conflict & Resolution (Feb 21, 2026)**: Persistent CORS errors (including "Duplicate Access-Control-Allow-Origin") were fundamentally fixed by abandoning cross-origin requests. **Solution**: Hardcoded absolute URLs (`https://api.uniz...`) in React were causing the browser to enforce CORS. By switching `VITE_API_URL` and all endpoints to relative paths (`/api/v1`), requests hit the same origin. In Dev, the Vite proxy handles it. In Prod, a new Nginx block in `uniz-portal` proxies it to `uniz-gateway-api:3000` internally.
- **Stale Browser Caching of 502 Errors**: Browsers heavily cached `text/html` error pages from Gateway crashes. Fixed by adding `Cache-Control: no-store` to the Nginx API proxy block and `NotificationPanel` fetch calls.
- **Microservice IP Caching**: Encountered 502 Bad Gateway after service updates because Nginx cached stale Docker internal IPs. **Solution**: Explicitly reloaded Nginx (`nginx -s reload`) or used K8s Service abstraction.
- **System Health Check**: Fixed by adding explicit route handlers.
- **Vercel Loop Busters (Feb 12, 2026)**: Implemented randomized query parameters (`?lb=...`) to prevent Vercel from caching failed internal requests during heavy bulk uploads.
- **K3s Node.js Path**: `node` was not in PATH during SSH sessions. Added `/opt/homebrew/bin` to exports.
- **Internal Gateway Loop (Feb 21, 2026)**: Services were trying to talk to the Gateway via the public URL (`https://api.uniz...`) inside the cluster. This created a routing loop that hung for **180 seconds** (default TCP timeout). **Solution**: Forced `DOCKER_ENV=true` logic to prioritize `http://uniz-gateway-api:3000` and added strict **5s axios timeouts** to all inter-service calls.
- **504 Gateway Timeout (Feb 21, 2026)**: Gateway was passing client `Content-Length` headers which caused upstream timeouts on JSON requests. **Fix**: Explicitly remove `Content-Length` in `uniz-gateway/src/index.ts` for non-multipart requests.
- **Push Notification Image Support (Feb 21, 2026)**: Enabled rich notifications with banner images by updating the `uniz-notifications` payload and `sw.js` service worker.
- **Stale K3s Images (Feb 21, 2026)**: K3s node caching prevented `:local` tag updates. **Fix**: Switched to timestamped tags (e.g., `:local-1771673842`) and `imagePullPolicy: Always`.
- **Case-Insensitive Subscriber Search (Feb 21, 2026)**: Fixed empty subscriber lists when searching with mixed-case prefixes by refactoring SQL queries to use `mode: 'insensitive'`.
- **Gateway PDF Proxy Corruption (Feb 21, 2026)**: Downloading PDFs through the Gateway resulted in corrupted empty files or JSON syntax errors. **Solution**: Configured Axios to use `responseType: "arraybuffer"` and explicitly stripped `Content-Encoding` and `Transfer-Encoding` headers from the proxy response object before sending binary arrays, as Axios auto-decompresses the stream natively.
- **Push Notification Timestamps (Feb 21, 2026)**: Check-in/Check-out push notifications were displaying in 24-hour UTC or inconsistent local formats. **Solution**: Switched `toLocaleString` arguments to explicit `en-US` with `Asia/Kolkata` bounds to force native AM/PM Indian Standard Time rendering exactly as expected by the UI.
- **Push Notification Device Context (Feb 21, 2026)**: Security alerts sent opaque IP addresses ("from IP: X.X.X.X"). **Solution**: Added `ua-parser-js` to `uniz-auth-service` to parse `User-Agent` headers and inject human-readable device info (e.g., "Chrome on Mac OS").

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

---

## 8. Future Integrations (Multi-Tenant)

- **Ornate Frontend (`ornate.rguktong.in`)**: The K3s + Nginx Ingress architecture natively supports multi-tenant domains. In the future, a containerized Next.js application will be deployed alongside the UniZ infrastructure.
  - **Implementation Plan**:
    1. Containerize the Next.js app (Dockerfile).
    2. Deploy it to the cluster (e.g., `ornate-portal` deployment).
    3. Expose it via a ClusterIP service (e.g., port 3000).
    4. Update the K3s `ingress.yaml` to route `host: ornate.rguktong.in` directly to the `ornate-portal` service.
    5. Secure the new domain via `certbot --nginx -d ornate.rguktong.in` on the host.
