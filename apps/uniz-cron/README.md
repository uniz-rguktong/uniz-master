# UniZ Cron Service - System Maintenance & Automation

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Cron](https://img.shields.io/badge/Cron-Scheduled-464A4E?style=for-the-badge&logo=linux&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

> **UniZ Microservices Ecosystem**
> _Orchestrating background maintenance, data cleanup, and automated lifecycle management._

## Architecture Overview

The Cron Service is the automated heartbeat of the UniZ platform. It is responsible for executing idempotent background tasks, including the removal of expired authentication logs, auto-finalization of campus movement requests, and generation of daily operational metrics. The service is designed to be stateless and follows the "run-once-or-many" principle to ensure system consistency across multiple deployments.

## Technology Stack

| Layer         | Technology                    | Purpose                                                |
| :------------ | :---------------------------- | :----------------------------------------------------- |
| **Runtime**   | `Node.js`                     | High-performance asynchronous execution.               |
| **Language**  | `TypeScript`                  | Type-safe development and documentation.               |
| **Scheduler** | `node-cron` / `node-schedule` | Precision-timed background task execution.             |
| **ORM**       | `Prisma`                      | Type-safe database access and bulk cleanup operations. |
| **Database**  | `PostgreSQL`                  | Primary data layer for status monitoring.              |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL Instance
- Access to the Central Database

### Local Development

1. **Setup Environment**:
   ```bash
   cp .env.example .env
   npm install
   ```
2. **Run Service**:
   ```bash
   npm run dev
   ```
   The scheduler will initialize and begin executing tasks based on predefined intervals (visible at `http://localhost:3008/api/cron`).

### Docker Deployment

Refer to the `infra/core-infra` documentation for orchestrated deployment instructions.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
