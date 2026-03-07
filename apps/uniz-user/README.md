# UniZ User Service - Profile Management

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)

> **UniZ Microservices Ecosystem**
> _Centralized entity management for students, faculty, and administrative personnel._

## Architecture Overview

The User Service manages the lifecycle of all identities within the UniZ platform. It is responsible for storing detailed profile metadata, managing role assignments (RBAC), and maintaining hostel/departmental associations. The service is optimized for read-heavy workloads and leverages the `users` schema in the central database.

## Technology Stack

| Layer         | Technology   | Purpose                                       |
| :------------ | :----------- | :-------------------------------------------- |
| **Runtime**   | `Node.js`    | High-performance asynchronous execution.      |
| **Language**  | `TypeScript` | Type-safe development and documentation.      |
| **Framework** | `Express.js` | Robust API routing and middleware management. |
| **ORM**       | `Prisma`     | Type-safe database access and migrations.     |
| **Database**  | `PostgreSQL` | Relational data persistence (Users schema).   |
| **Cache**     | `Redis`      | Low-latency profile data delivery.            |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL Instance
- Redis Instance

### Local Development

1. **Setup Environment**:
   ```bash
   cp .env.example .env
   npm install
   ```
2. **Database Migration**:
   ```bash
   npx prisma db push
   ```
3. **Run Service**:
   ```bash
   npm run dev
   ```
   The service will be available at `http://localhost:3002`.

### Docker Deployment

Refer to the `infra/core-infra` documentation for orchestrated deployment instructions.

---

<p align="center">
  Corporate Technical Infrastructure - internal Use Only
</p>
