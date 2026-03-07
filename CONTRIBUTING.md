# Contributing to UniZ

First off, thank you for considering contributing to UniZ! It's people like you that make UniZ such a great tool.

## Technical Architecture

UniZ is a **Microservices Monorepo**. Each service is independent but they communicate through a central gateway and shared database infrastructure.

- **Apps**: Located in `apps/` (Next.js, Vite/React, Node.js services).
- **Infrastructure**: Located in `infra/` (Kubernetes manifests, setup scripts).
- **Scripts**: Located in `scripts/` (Deployment and secret management).

---

## Local Development Setup

To get the entire ecosystem running on your machine, follow these steps:

### 1. Prerequisites

- **Node.js**: v20 or higher
- **Docker**: Desktop or Engine with Docker Compose
- **Git**: For version control

### 2. Initial Infrastructure

Start the local database and cache:

```bash
docker-compose up -d
```

This will spin up:

- **Postgres 17**: Automatically creates all required databases (`uniz_auth`, `uniz_user`, etc.)
- **Redis**: For caching and messaging.

### 3. Environment Configuration

UniZ uses a "Vault" system to manage secrets. As a new contributor, you can initialize your local environment instantly:

```bash
npm run setup
```

_This command clones the `secrets.env.example`, creates all necessary `.env` files for every microservice, and synchronizes them with local developer values._

### 4. Install Dependencies

Install all package dependencies at once:

```bash
npm run install:all
```

### 5. Database Setup (Prisma)

Initialize the database schemas for each service:

```bash
# In the root directory
for d in apps/uniz-* apps/ornate-core; do
  if [ -d "$d/prisma" ]; then
    echo "Syncing $d..."
    (cd $d && npx prisma db push)
  fi
done
```

### 6. Run Development Servers

You can start all services using:

```bash
npm run dev
```

---

## Development Workflow

1.  **Fork the Repo**: Always work on your own fork.
2.  **Create a Branch**: `git checkout -b feature/your-feature-name`
3.  **Code & Test**: Ensure your changes don't break existing flows.
4.  **Commit**: Use descriptive commit messages.
5.  **Pull Request**: Submit a PR to the `main` branch.

## Coding Standards

- **TypeScript**: All new code must be type-safe. Avoid `any`.
- **Prettier**: Run `npm run prettify` before committing.
- **Modularity**: Keep services decoupled. Do not share databases between services.

## Security Note

**NEVER commit your `.env` or `secrets.env` files.** They are already in `.gitignore`, but stay vigilant.

---

Need help? Reach out to the maintainers or open an issue!
