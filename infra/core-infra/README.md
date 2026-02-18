# UniZ Core Infrastructure - Orchestration & Deployment

![Docker](https://img.shields.io/badge/Docker-24.x-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-1.28-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-1.25-009639?style=for-the-badge&logo=nginx&logoColor=white)

> **UniZ ENTERPRISE INFRASTRUCTURE**
> _Providing the foundation for high-availability microservices orchestration, automated scaling, and resilient data persistence._

## Architecture Overview

The Core Infrastructure module manages the environmental state and deployment orchestration for the entire UniZ ecosystem. It centralizes Kubernetes manifests, Docker Compose configurations, and system-wide scripts used for initializing databases, managing gateway routing, and executing global health checks. This repository is designed to support both local development via Docker and production-grade scaling via Kubernetes.

## Service Map & Port Allocation

| Service          | internal Port | External Port | Role                           |
| :--------------- | :------------ | :------------ | :----------------------------- |
| **Gateway**      | 80            | 80 / 443      | Entry point & Load Balancer    |
| **Auth**         | 3001          | 3001          | Identity Provider & JWT Issuer |
| **User**         | 3002          | 3002          | Profile & RBAC Management      |
| **Outpass**      | 3003          | 3003          | Workflow & Approval Engine     |
| **Academics**    | 3004          | 3004          | Grades & Attendance Engine     |
| **Files**        | 3005          | 3005          | Asset Storage & Retrieval      |
| **Mail**         | 3006          | 3006          | SMTP Dispatch Hub              |
| **Notification** | 3007          | 3007          | WebSocket & Event Dispatcher   |
| **Cron**         | 3008          | 3008          | Scheduled Maintenance Worker   |

## Global Infrastructure Control

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Access to Neon PostgreSQL & Upstash Redis (Production)

### Environmental Setup

1. **Initialize Project**:
   ```bash
   npm run setup
   ```
2. **Database Schema Sync**:
   ```bash
   npm run db:push
   ```
3. **Local Orchestration**:
   ```bash
   npm run docker:up
   ```

### Production Operations

The infrastructure follows a GitOps-ready pattern. Kubernetes manifests for the K3s cluster are located in the `k8s/` directory (if applicable) or managed via the centralized `docker-compose.prod.yml` for high-resource VPS deployments.

## Scaling Protocols

The system is optimized for Horizontal Pod Autoscaling (HPA):

- **CPU Scaling**: Services scale when reaching 70% CPU utilization.
- **Replica Strategy**: Auth Service is pre-scaled to 4 replicas to match 4-vCPU hardware optimization for Bcrypt.
- **Cache Layer**: Redis acts as the unified session and security cache across all nodes.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
