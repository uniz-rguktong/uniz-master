# UniZ - University Management System

Welcome to the internal source code repository for UniZ.

## 🔒 Private Repository Access

All core repositories for the UniZ system are **PRIVATE** to restrict access to authorized personnel only. This includes:

- `uniz-master-vault` (Core Monorepo)
- `uniz-infrastructure` (DevOps & Testing)
- `uniz-gateway` (API Gateway)
- `uniz-auth` (Authentication)
- `uniz-user` (User Management)
- `uniz-outpass` (Outpass System)
- `uniz-academics` (Academic Records)
- `uniz-files` (File Storage)
- `uniz-mail` (Email Services)
- `uniz-notifications` (Notification Dispatch)
- `uniz-cron` (Scheduled Tasks)

## 🏗️ System Architecture

UniZ utilizes a microservices architecture orchestrated via Docker.

### Key Components

- **Gateway**: Nginx-based entry point handling all traffic.
- **Auth Service**: JWT-based identity management.
- **User Service**: Profile and role management.
- **Outpass Service**: Student movement and permissions.
- **Academics Service**: Grading, attendance, and results publishing.
- **Infrastructure**: Redis, PostgreSQL, and Docker Compose for orchestration.

For setup and deployment instructions, please refer to the `uniz-infrastructure` repository.
