# Local Development Setup

Get UniZ running on your machine in minutes. This guide works on **macOS**, **Linux**, **Windows (WSL2)**, and headless Linux VPS environments used by contributors.

You do **not** need production secrets, Cloudflare tokens, or AWS credentials for local development. The example file ships with safe placeholders and Cloudflare Turnstile **test keys** that always pass.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Git](https://git-scm.com/downloads) | any recent | Clone the repo |
| [Node.js](https://nodejs.org/) | **20+** (LTS recommended) | Monorepo build & dev servers |
| [Docker](https://docs.docker.com/get-docker/) | recent | PostgreSQL 17 + Redis locally |
| npm | bundled with Node | Workspace installs (comes with Node) |

### macOS

```bash
# Homebrew (recommended)
brew install git node@20 docker

# Or: Node via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
```

- **Docker Desktop** — [Install Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
- **Colima** (lightweight alternative): `brew install colima docker` then `colima start`
- **Apple Silicon (M1/M2/M3)** — no extra steps; Docker pulls `arm64` images automatically
- **Intel Mac** — same commands; Docker pulls `amd64` images

### Linux (native or VPS)

```bash
# Debian/Ubuntu example
sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Docker Engine — https://docs.docker.com/engine/install/
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker "$USER"   # log out & back in after this
```

### Windows

**Recommended: WSL2 + Docker Desktop**

1. Install [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install) (Ubuntu 22.04+)
2. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) and enable **WSL2 integration** for your distro
3. Clone and run all commands **inside WSL**, not PowerShell/CMD

```bash
# Inside WSL
git clone https://github.com/uniz-rguktong/uniz-master.git
cd uniz-master
```

**Native Windows caveats**

- Git Bash can run the setup scripts, but Docker + file watching is less reliable than WSL2
- Path separators and line endings can break `.env` sync — prefer WSL2
- Do not commit `secrets.env` from any environment

---

## Quick start (one command path)

For returning contributors or fresh clones when prerequisites are already installed:

```bash
git clone https://github.com/uniz-rguktong/uniz-master.git
cd uniz-master
npm run setup:local    # infra + deps + env sync + Prisma
npm run seed:local     # optional but recommended first time
npm run dev:all        # full stack
```

Open the portal at **http://localhost:5173** and the API gateway at **http://localhost:3000/api/v1**.

Shortcut wrapper (checks prerequisites, prints next steps):

```bash
npm run setup:quick
```

---

## Step-by-step (first-time contributors)

### 1. Clone the repository

```bash
git clone https://github.com/uniz-rguktong/uniz-master.git
cd uniz-master
```

### 2. Create `secrets.env`

`secrets.env` is git-ignored. Never commit it.

```bash
cp secrets.env.example secrets.env
```

The example file is enough for local dev:

- JWT and internal secrets use safe dev placeholders
- Database URLs point at local Docker Postgres (`localhost:5432`)
- Turnstile keys are [Cloudflare test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) (`1x000…`) — captcha always passes locally
- Cloudinary, AWS, and production DNS tokens are optional locally — for uploads, use **your own** free Cloudinary cloud name + unsigned preset (never commit real keys)

You do **not** need to copy production values from the VPS.

### 3. Run setup

```bash
npm run setup:local
```

This script:

1. Verifies Node 20+, npm, and Docker
2. Starts **Postgres** and **Redis** via `infra/core-infra/docker-compose.yml`
3. Waits until Postgres accepts connections
4. Runs a single root `npm install` for the whole monorepo
5. Copies `secrets.env` into each service as `.env` with localhost overrides
6. Runs `prisma generate` and `prisma db push` for services that use Prisma

### 4. Seed sample data (recommended)

```bash
npm run seed:local
```

Creates admin accounts and sample academics data. Password for all seeded users: **`password123`**.

### 5. Start development servers

| Command | What runs |
|---------|-----------|
| `npm run dev` | **Core stack** — gateway, auth, user, portal (frontend) |
| `npm run dev:all` | **Full stack** — core + academics, outpass, files, mail, notifications, docs |
| `npm run dev:cron` | Cron service only (optional; not in `dev:all`) |

For most feature work, `npm run dev:all` is the default.

### 6. Verify it works

**Health check (aggregated):**

```bash
curl -s http://127.0.0.1:3000/api/v1/system/health | head -c 500
```

Expect JSON with per-service status entries.

**Portal login** — open http://localhost:5173 and sign in:

| Username | Password | Role |
|----------|----------|------|
| `webmaster` | `password123` | Webmaster / admin |
| `dean` | `password123` | Dean |
| `director` | `password123` | Director |

(Run `npm run seed:local` first if these accounts do not exist.)

---

## Service ports

| Service | Port | Notes |
|---------|------|-------|
| API Gateway | **3000** | `http://localhost:3000/api/v1` |
| Auth | 3001 | |
| User / Profiles | 3002 | |
| Outpass | 3003 | |
| Academics | 3004 | |
| Files | 3005 | |
| Mail | 3006 | |
| Notifications | 3007 | |
| Cron | 3008 | start separately: `npm run dev:cron` |
| Portal (Vite) | **5173** | React admin/student UI |
| Docs (Mintlify) | 3333 | included in `dev:all` |
| PostgreSQL | 5432 | Docker: `uniz-postgres` |
| Redis | 6379 | Docker: `uniz-redis` |

---

## Optional: Landing page backend (Python)

The public landing site API lives in `apps/uniz-landing-backend` (FastAPI, Python 3.12+). It is **separate** from the Node monorepo and not started by `npm run dev:all`.

```bash
cd apps/uniz-landing-backend
# uv (recommended) or pip
uv sync
uv run uvicorn main:app --reload --port 8080
```

Requires its own env configuration; see that app's `config.py`. The portal references `VITE_SCRAPER_URL=http://localhost:8080` in `secrets.env.example` when you need scraper integration.

---

## Troubleshooting

### `Port 5432` or `6379` already in use

Another Postgres/Redis instance may be bound to those ports.

**macOS:**

```bash
lsof -ti:5432 | xargs kill -9
lsof -ti:6379 | xargs kill -9
```

**Linux / WSL:**

```bash
sudo fuser -k 5432/tcp 6379/tcp
```

Then re-run `npm run setup:local`.

### Docker is not running

| Environment | Fix |
|-------------|-----|
| macOS Docker Desktop | Open Docker Desktop and wait until it says "Running" |
| macOS Colima | `colima start` |
| Linux | `sudo systemctl start docker` |
| WSL2 | Start Docker Desktop on Windows; ensure WSL integration is enabled |

Test: `docker ps` should list containers without error.

### Colima on Mac — "Cannot connect to Docker daemon"

If you use Colima instead of Docker Desktop:

```bash
colima start
export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
npm run setup:local
```

The setup script auto-detects Colima when the default socket is unreachable.

### Prisma errors (`P1001`, schema drift, client not generated)

Re-run setup (idempotent):

```bash
npm run setup:local
```

Or manually for one service:

```bash
cd apps/uniz-auth
npx prisma generate
npx prisma db push
```

Ensure Postgres is up: `docker exec uniz-postgres pg_isready -U user -d uniz_db`

### `npm install` fails or wrong Node version

```bash
node -v   # must be v20.x or higher
```

Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to switch versions.

### Gateway health shows a service as down

Start the full stack (`npm run dev:all`) or the specific service workspace, e.g.:

```bash
npm run dev -w uniz-academics-service
```

### Windows line-ending issues

If `.env` files look corrupted (variables on one line), in WSL:

```bash
git config core.autocrlf input
```

Re-copy: `cp secrets.env.example secrets.env` and run `npm run setup:local` again.

### Reset local databases completely

```bash
docker compose -f infra/core-infra/docker-compose.yml down -v
npm run setup:local
npm run seed:local
```

---

## What `setup:local` does not do

- Does not start Node dev servers (use `npm run dev` or `dev:all`)
- Does not seed data (use `npm run seed:local`)
- Does not configure production VPS/Kubernetes secrets
- Does not install Python deps for `uniz-landing-backend`

---

## Next steps

- [API documentation](./API_DOCUMENTATION.md)
- [Production URLs](./PRODUCTION_URLS.md)
- [Contributing to docs](../apps/uniz-docs/CONTRIBUTING.md)
