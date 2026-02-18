# UniZ Infrastructure

Complete Docker-based infrastructure for the **UniZ Education Platform** - A comprehensive microservices architecture for university management.

## Project Structure

```
uniz-infrastructure/
├── scripts/              # Automation scripts
│   ├── local_test.sh    # Local E2E testing
│   ├── build_push.sh    # Docker image build & push
│   ├── bootstrap.sh     # Initial setup
│   ├── redeploy.sh      # Production redeployment
│   ├── start.sh         # Service startup
│   └── cloud-seed.ts    # Database seeding
├── tests/               # Test suites
│   ├── comprehensive_test.js  # Full E2E test suite
│   └── data/            # Test data (Excel files)
├── docs/                # Documentation
├── nginx/               # Gateway configuration
├── postman/             # API collections
├── logs/                # Application logs
├── docker-compose.yml   # Service orchestration
├── .env                 # Environment configuration
└── package.json         # NPM scripts & dependencies
```

## Quick Start

### Prerequisites

- **Docker** (or Colima on macOS)
- **Node.js** >= 18.0.0
- **Git**

### 1. Clone & Setup

```bash
git clone https://github.com/uniz-rguktong/uniz-infrastructure.git
cd uniz-infrastructure
npm run setup
```

### 2. Configure Environment

Edit `.env` with your database credentials:

```bash
# Required: Update these with your Neon DB & Upstash Redis URLs
AUTH_DATABASE_URL="postgresql://..."
USER_DATABASE_URL="postgresql://..."
OUTPASS_DATABASE_URL="postgresql://..."
ACADEMICS_DATABASE_URL="postgresql://..."
REDIS_URL="rediss://..."
```

### 3. Start Services

For standard systems (AMD64):

```bash
npm run docker:up
```

**For Apple Silicon (ARM64) or high-resource-usage environments:**
Use the sequential startup script to prevent emulation crashes:

```bash
npm run start:safe
```

### 4. Run Tests

```bash
npm test
```

## 🍎 Apple Silicon (M1/M2/M3) Optimization

Running the full UniZ stack on Apple Silicon involves emulating x86_64 architecture for several microservices. This is resource-intensive and requires specific configuration:

### Resource Allocation

Minimum requirements for local development:

- **RAM**: 8GB (Assigned to Docker/Colima)
- **CPU**: 4 Cores

If using **Colima**, scale your resources:

```bash
colima stop
colima start --memory 8 --cpu 4 --arch x86_64
```

### Common Issues

- **SIGKILL / Exit Code 137**: This usually means the container hit the memory limit or the system ran out of RAM. Use `npm run start:safe` and ensure at least 8GB is allocated to your Docker runtime.
- **Slow Startup**: Emulation adds overhead. The `start:safe` script includes stabilization delays to ensure services don't crash during the initial CPU spike.

## NPM Scripts

### Development

```bash
npm run dev              # Start services + run E2E tests
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:restart   # Restart all services
npm run docker:logs      # View service logs
npm run docker:clean     # Remove all containers & volumes
```

### Testing

```bash
npm test                 # Full local test suite
npm run test:e2e         # E2E tests only
npm run health           # Check system health
npm run status           # Check gateway status
```

### Deployment

```bash
npm run deploy:build     # Build & push Docker images
npm run deploy:redeploy  # Redeploy to production
npm run deploy:bootstrap # Initial production setup
npm run db:seed          # Seed cloud database
```

### Utilities

```bash
npm run setup            # Install deps + create .env
npm run clean            # Clean node_modules & logs
npm start                # Production start
```

## Architecture

### Microservices

- **Gateway** (Port 80) - API Gateway & Load Balancer
- **Auth Service** (Port 3001) - Authentication & Authorization
- **User Service** (Port 3002) - Profile Management
- **Outpass Service** (Port 3003) - Leave Management
- **Academics Service** (Port 3004) - Grades & Attendance
- **Files Service** (Port 3005) - Document Management
- **Mail Service** (Port 3006) - Email Notifications
- **Notification Service** (Port 3007) - Push Notifications
- **Cron Service** (Port 3008) - Scheduled Tasks

### Infrastructure

- **PostgreSQL** (Port 5432) - Primary Database
- **Redis** (Port 6379) - Cache & Session Store
- **Nginx** - Reverse Proxy

## API Base URL

```
http://localhost/api/v1
```

### Key Endpoints

| Service   | Endpoint                | Description            |
| --------- | ----------------------- | ---------------------- |
| Auth      | `/auth/login/student`   | Student login          |
| Auth      | `/auth/login/admin`     | Admin login            |
| User      | `/profile/student/me`   | Get student profile    |
| Academics | `/academics/grades`     | Get grades             |
| Academics | `/academics/attendance` | Get attendance         |
| Outpass   | `/requests/outpass`     | Create outpass request |
| System    | `/system/health`        | Health check           |

## Testing

The E2E test suite validates:

- Authentication flows (Student & Admin)
- Profile management
- Outpass workflow (Student → Caretaker → Warden → SWO → Security)
- Academic data (Grades & Attendance)
- Bulk uploads (Excel processing)
- RBAC enforcement
- Email notifications
- CMS operations

## Environment Variables

Required variables in `.env`:

```bash
# Database URLs (Neon DB)
AUTH_DATABASE_URL=
USER_DATABASE_URL=
OUTPASS_DATABASE_URL=
ACADEMICS_DATABASE_URL=
FILES_DATABASE_URL=
MAIL_DATABASE_URL=
NOTIFICATION_DATABASE_URL=
CRON_DATABASE_URL=

# Redis (Upstash)
REDIS_URL=

# Security
INTERNAL_SECRET=
JWT_SECURITY_KEY=

# Email (Gmail)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
SMTP_PORT=
SMTP_SECURE=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_UPLOAD_PRESET=
```

## Docker Hub

All images are available at:

- `desusreecharan/uniz-gateway`
- `desusreecharan/uniz-gateway-api`
- `desusreecharan/uniz-auth-service`
- `desusreecharan/uniz-user-service`
- `desusreecharan/uniz-outpass-service`
- `desusreecharan/uniz-academics-service`
- `desusreecharan/uniz-files-service`
- `desusreecharan/uniz-mail-service`
- `desusreecharan/uniz-notification-service`
- `desusreecharan/uniz-cron-service`

## Development Workflow

1. **Make changes** to microservices in their respective repositories
2. **Build images**: `npm run deploy:build`
3. **Test locally**: `npm test`
4. **Deploy**: `npm run deploy:redeploy`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Author

**SABER Desu**

- Platform Architect
- GitHub: [@uniz-rguktong](https://github.com/uniz-rguktong)

## Support

For issues and questions:

- GitHub Issues: [uniz-infrastructure/issues](https://github.com/uniz-rguktong/uniz-infrastructure/issues)
- Email: o210008@rguktong.ac.in

---

**Built with care for RGUKT Ongole**

## System Architecture Overview

UniZ is a comprehensive university management platform built on a modern microservices architecture. The system is designed to handle all aspects of campus operations, from student authentication to academic management and administrative workflows.

### High-Level Architecture

The platform follows a distributed microservices pattern with the following key components:

**Client Layer**

- Web applications and mobile clients communicate through a unified API gateway
- All external requests are routed through a single entry point for security and load balancing

**Gateway Layer**

- Central API Gateway handles request routing, authentication verification, and load distribution
- Implements rate limiting and request validation before forwarding to internal services
- Provides a unified interface to all backend microservices

**Service Layer**
The application logic is distributed across specialized microservices:

- **Authentication Service**: Manages user credentials, session tokens, and access control
- **User Service**: Handles student and faculty profile information
- **Academics Service**: Processes grades, attendance records, and academic data
- **Outpass Service**: Manages leave requests and approval workflows
- **Files Service**: Handles document uploads and file management
- **Mail Service**: Coordinates email notifications and communications
- **Notification Service**: Manages push notifications and alerts
- **Cron Service**: Executes scheduled tasks and maintenance operations

**Data Layer**

- PostgreSQL database with schema-based isolation for each service
- Redis cache for session management and performance optimization
- Each microservice maintains its own database schema for data independence

**Infrastructure Layer**

- Docker containerization for consistent deployment across environments
- Nginx reverse proxy for efficient request handling
- Cloud-hosted databases (Neon DB) and cache (Upstash Redis) for production

### Request Flow

A typical request follows this path:

1. Client sends request to the API Gateway
2. Gateway validates authentication and routes to appropriate service
3. Service processes business logic and interacts with its database schema
4. Response flows back through the gateway to the client
5. Asynchronous operations (emails, notifications) are queued for background processing

### Data Flow

Student academic data flow example:

1. Faculty uploads grades via Academics Service
2. Data is validated and stored in the academics schema
3. Notification Service is triggered to alert students
4. Mail Service sends email notifications
5. Students retrieve their grades through the User Service integration

### Security Model

The platform implements multiple security layers:

- JWT-based authentication for all API requests
- Service-to-service communication secured with internal secrets
- Role-based access control (RBAC) for administrative functions
- Database schema isolation prevents cross-service data access
- Rate limiting protects against abuse and denial-of-service attacks

### Scalability Design

The architecture supports horizontal scaling:

- Each microservice can be scaled independently based on load
- Stateless service design enables easy replication
- Redis caching reduces database load for frequently accessed data
- Asynchronous processing handles time-intensive operations without blocking requests

### Deployment Model

The system supports multiple deployment configurations:

**Local Development**

- Docker Compose orchestrates all services on a single machine
- Suitable for development and testing workflows

**Production Environment**

- Services deployed as independent containers
- Cloud-managed databases and cache for reliability
- Load balancing across multiple service instances
- Automated health checks and service recovery

### Integration Points

External systems integrate through:

- RESTful API endpoints for programmatic access
- Webhook notifications for event-driven integrations
- Bulk upload capabilities for administrative data management
- Email service integration for communications

### Monitoring and Observability

The platform includes:

- Health check endpoints for service status monitoring
- Structured logging across all services
- Request tracing for debugging distributed transactions
- Performance metrics collection for optimization

This architecture ensures the platform remains maintainable, scalable, and resilient while handling the complex requirements of university management operations.
