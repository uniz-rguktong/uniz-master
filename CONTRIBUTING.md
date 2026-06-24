# Contributing to UniZ

Thank you for contributing to UniZ. This guide matches the local workflow in [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md).

## Architecture

UniZ is a **microservices monorepo**:

- **Apps** — `apps/` (gateway, services, portal, docs)
- **Infrastructure** — `infra/` (Kubernetes, Docker Compose)
- **Scripts** — `scripts/` (local setup, vault sync)

---

## Local development setup

### Prerequisites

| Tool | Version |
|------|---------|
| Git | any recent |
| Node.js | **20+** (LTS) |
| Docker | Postgres 17 + Redis via Compose |
| npm | bundled with Node |

See [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) for macOS, Linux, WSL2, and Windows notes.

### Quick start

```bash
git clone https://github.com/uniz-rguktong/uniz-master.git
cd uniz-master
cp secrets.env.example secrets.env   # safe dev placeholders
npm run setup:local                  # infra + deps + env sync + Prisma
npm run seed:local                   # recommended first time
npm run dev:all                      # full stack
```

- **Portal:** http://localhost:5173 (`webmaster` / `password123` after seeding)
- **API gateway:** http://localhost:3000/api/v1
- **Health check:** `curl -s http://127.0.0.1:3000/api/v1/system/health`

### Dev commands

| Command | Purpose |
|---------|---------|
| `npm run setup:local` | Docker infra, install, env sync, Prisma generate/push |
| `npm run seed:local` | Sample users and academics data |
| `npm run dev` | Core stack (gateway, auth, user, portal) |
| `npm run dev:all` | Full stack including academics, outpass, files, mail, notifications, docs |
| `npm run dev:cron` | Cron service only (optional) |
| `npm run prettify` | Format with Prettier |

`secrets.env` is git-ignored. Copy from `secrets.env.example` — you do **not** need production VPS secrets for local work.

---

## Development workflow

1. **Fork** the repository.
2. **Branch** — `git checkout -b feature/your-feature-name`
3. **Develop** — run `npm run dev:all` and verify your change.
4. **Test** — ensure affected services build and health checks pass locally.
5. **Commit** — clear, descriptive messages.
6. **Pull request** — open against `main` using the PR template.

### Build & test before opening a PR

```bash
npm run build:shared
npm run ci:build          # backend services
npm run build -w uniz     # portal
```

CI runs the same builds on every pull request to `main`.

### Production deploy (automatic)

**No manual VPS steps are required.** When a PR merges to `main`:

1. GitHub Actions builds the monorepo (shared, backends, portal).
2. On success, the workflow SSHs to the VPS, checks out the exact commit, and runs `scripts/deploy.sh`.
3. Only services changed in that push are rebuilt (like Vercel). Use `[rebuild portal]` or `[rebuild all]` in a commit message only when you need to force a specific rebuild.
4. The job verifies rollouts and `https://api.uniz.rguktong.in/api/v1/system/health` before marking success.

If deploy fails, check the **VPS Automated Deployment** workflow in GitHub Actions — it retries up to 3 times automatically.

---

## Coding standards

- **TypeScript** — type-safe code; avoid `any` where possible.
- **Prettier** — run `npm run prettify` before committing.
- **Modularity** — keep services decoupled; do not share databases across services.
- **Secrets** — never commit `secrets.env`, `.env`, or production credentials.

---

## Maintainer-only scripts

The following are for **project maintainers** with VPS access. OSS contributors do not need them for local development:

| Script / command | Purpose |
|------------------|---------|
| `npm run deploy` / `scripts/deploy.sh` | Production VPS deployment |
| `npm run vault:vps-audit` | Compare VPS vault keys |
| `npm run watch` | Live kubectl view on VPS (`VPS_HOST` env) |
| `scripts/redeploy_all_vps.sh` | Full image rebuild on VPS |
| `scripts/surefire_deploy.sh` | Force rebuild deploy |

Do not run deploy scripts unless you are a maintainer with authorized access.

---

## Need help?

Open a [bug report](.github/ISSUE_TEMPLATE/bug_report.yml) or [feature request](.github/ISSUE_TEMPLATE/feature_request.yml), or reach out to maintainers.
