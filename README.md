# UniZ - University Management System Master Vault

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-24.x-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-1.28-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-1.25-009639?style=for-the-badge&logo=nginx&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

> **UniZ ENTERPRISE INFRASTRUCTURE 2026**
> _Consolidating fragmented microservices into a unified, high-performance university management ecosystem._

[![.github/workflows/docker-build-push.yml](https://github.com/uniz-rguktong/uniz-master/actions/workflows/docker-build-push.yml/badge.svg)](https://github.com/uniz-rguktong/uniz-master/actions/workflows/docker-build-push.yml)

## Structuralized Architecture Overview

The Master Vault serves as the central orchestration point for the entire UniZ ecosystem. It utilizes a Monorepo-to-MultiRepo synchronization model, ensuring that while code is centralized for development, production deployments remain modular and scalable.

```mermaid
graph TD
    subgraph Development_Vault [Master Vault]
        ROOT[uniz-master]
        ROOT --> APPS[apps/]
        ROOT --> INFRA[infra/core-infra/]
        ROOT --> SCR[scripts/]
    end

    subgraph Service_Repositories [Individual Repos]
        R_AUTH[uniz-auth]
        R_USER[uniz-user]
        R_ACAD[uniz-academics]
        R_GATE[uniz-gateway]
    end

    subgraph Computed_Layer [CI/CD Pipeline]
        DH[Docker Hub Registry]
    end

    ROOT -->|Sync| Service_Repositories
    Service_Repositories -->|Build| DH
```

## Monorepo Organization

The root codebase is structuralized for enterprise-grade management:

- **apps/**: Contains all 10 frontend and backend microservices. Each is a standalone repository synced via the vault.
- **infra/core-infra/**: Centralized Kubernetes manifests, Docker Compose files, and PostgreSQL/Redis configuration.
- **docs/**: Technical blueprints, scaling reports, and project history.
- **scripts/**: Automation tools for synchronization, service management, and stress testing.
- **postman/**: Complete API collection for developer onboarding.
- **tests/**: Global end-to-end integration tests.

## Technology Stack

| Layer        | Technology            | Purpose                                           |
| :----------- | :-------------------- | :------------------------------------------------ |
| **Backend**  | `Node.js` / `Express` | Microservices runtime and API framework.          |
| **Frontend** | `React` / `Vite`      | High-performance student and admin portals.       |
| **Database** | `PostgreSQL`          | Multi-tenant relational data persistence.         |
| **Caching**  | `Redis`               | Distributed session management and rate limiting. |
| **DevOps**   | `Docker` / `K3s`      | Containerization and Kubernetes orchestration.    |
| **Cloud**    | `Vercel`              | Serverless deployment for entry-points and APIs.  |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- GitHub CLI (for synchronization)

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install && npm run install:all
   ```
2. **Start Services**:
   ```bash
   npm run dev
   ```
   This will initialize all microservices and the local gateway.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
