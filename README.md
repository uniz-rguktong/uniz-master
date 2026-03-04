<div align="center">
  <!-- <img src="https://res.cloudinary.com/dy2fjgt46/image/upload/v1771604895/rguktongole_logo_kbpaui.jpg" alt="UniZ Logo" width="120" /> -->

# UniZ

### High-Performance University Management Ecosystem

**The digital backbone for enterprise-scale educational administration, built on a robust microservices architecture.**

[![Stack](https://img.shields.io/badge/Stack-Node.js%20|%20TypeScript%20|%20Docker-blue?style=for-the-badge)](https://nodejs.org/)
[![Deployment](https://img.shields.io/badge/Deployment-VPS%20|%20Nginx%20|%20SSL-800000?style=for-the-badge)](https://api.uniz.rguktong.in)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20|%20Prisma%20|%20Redis-4169E1?style=for-the-badge)](https://www.postgresql.org/)

[Explore API](https://api.uniz.rguktong.in/api/v1/system/health) • [Documentation](./docs) • [Infrastructure](./infra/core-infra)

</div>

---

## 🏛️ Ecosystem Architecture

UniZ is a **monorepo-managed microservices ecosystem** designed for high availability, sub-50ms latency, and enterprise-grade security.

- **Edge Gateway**: Centralized Nginx routing with SSL termination and edge-level CORS management.
- **Core Engine**: Bounded-context microservices handling Auth, Academics, Outpasses, and CMS.
- **Data Layer**: High-performance PostgreSQL 17 cluster with Redis-backed message queuing and caching.
- **Automated Workflow**: Hierarchical approval systems (Caretaker → Warden → Director) and automated grade/attendance auditing.

### System Map

```mermaid
graph TD
    User([End Users]) -->|HTTPS/TLS| Nginx{Nginx Edge Proxy}

    subgraph "Core Microservices"
        Nginx -->|/auth| Auth[Auth Service]
        Nginx -->|/profile| UserS[User Service]
        Nginx -->|/academics| Acad[Academics Service]
        Nginx -->|/requests| Out[Outpass Service]
        Nginx -->|/files| File[Files Service]
    end

    subgraph "Infrastructure"
        Auth & UserS & Acad & Out & File --> DB[(PostgreSQL 17)]
        Auth & UserS & Acad & Out --> Redis[(Redis Cache/MQ)]
    end

    subgraph "Background Processing"
        Cron[Cron Service] -.->|Pulse| Redis
        Redis -.-> Mail[Mail Service]
        Redis -.-> Notif[Push Service]
    end
```

## 🛠️ Microservice Directory

| Service              | Responsibility                              | Port   |
| :------------------- | :------------------------------------------ | :----- |
| **`uniz-auth`**      | Identity, RBAC, & JWT State Management      | `3001` |
| **`uniz-user`**      | Profiles & High-Speed CMS Content           | `3002` |
| **`uniz-outpass`**   | Approval Workflows & Grievance Tracking     | `3003` |
| **`uniz-academics`** | Grade Auditing, Attendance & Bulk Ingestion | `3004` |
| **`uniz-gateway`**   | Application-level Routing & Aggregation     | `3000` |
| **`uniz-mail`**      | Asynchronous Transactional Email Engine     | `3006` |

---

## ⚡ Quick Start

### 1. Prerequisites

- **Node.js** v20+
- **Docker** & Docker Compose
- **Git**

### 2. Installation

```bash
# Clone and install dependencies
git clone https://github.com/uniz-rguktong/uniz-master.git
cd uniz-master
npm run install:all

# Setup local infrastructure
cp infra/core-infra/.env.example infra/core-infra/.env
npm run setup
npm run db:reset-migrate
```

### 3. Execution

```bash
# Launch development containers
npm run dev
```

---

## 🔒 Security & Deployment

- **Identity**: Stateless JWT with Role-Based Access Control (RBAC).
- **Network**: Services isolated in private Docker networks; only Nginx is exposed.
- **Safety**: Immutable production directories with `chattr` bit-locking on the VPS.
- **Edge**: Centralized CORS & Header sanitization at the Nginx layer for maximum security.

---

<div align="center">
  <p><b>UniZ Systems Operations - 2026</b></p>
  <i>Empowering higher education through agentic-first engineering.</i>
</div>
