# UniZ monorepo structure

Industry-style layout. **`apps/` and `packages/` are stable** (CI, workspaces, K3s).

```text
uniz-master/
├── apps/                    # npm workspaces (microservices + portal + landing)
├── packages/                # shared libraries (@uniz/shared)
├── docker/
│   ├── prod/                # CI / VPS image build (Dockerfile.service)
│   ├── local/               # laptop Compose
│   │   ├── compose.yml      # full stack demo (`make up`)
│   │   └── compose.db.yml   # Postgres + Redis only (`setup:local`)
│   └── README.md
├── scripts/
│   ├── ci/                  # GitHub Actions helpers
│   ├── deploy/              # VPS deploy, migrations, GHCR, harden
│   ├── local/               # setup-local, sync, seed
│   ├── ops/                 # vault, latency, load tests, k6/
│   └── *.sh                 # thin shims → ci/ or deploy/ (compat)
├── docs/
│   ├── local/               # LOCAL_SETUP
│   ├── architecture/        # topology, monitoring, scaling, URLs
│   ├── api/postman/         # Postman collections + globals
│   └── internal/            # brain/, features/, perf/, reports/, archive/
├── infra/                   # K3s manifests, nginx, compose
├── .github/workflows/       # CI + VPS deploy + Cloudflare Pages
├── Makefile                 # make up / seed (local only)
├── package.json             # workspaces root
├── .env.example             # local Compose env template
└── secrets.env.example      # hot-reload / vault template
```

## Two runtimes (same code)

| Mode | Command | Orchestrator |
|------|---------|--------------|
| Local / demo | `make up && make seed` | Docker Compose (`docker/local/compose.yml`) |
| Local / hot-reload | `npm run setup:local` then `npm run dev:all` | DB via `docker/local/compose.db.yml` |
| Production | push to `main` | GitHub Actions → GHCR → **K3s** |

Compose never runs on the VPS. Production images use `docker/prod/Dockerfile.service` only.

## Do not rename

`apps/*`, `packages/*`, `docker/prod/`, `infra/kubernetes/**`, and `.github/workflows/*` are wired into CI and K3s — keep paths stable.

## Local-only (gitignored)

| Path | Purpose |
|------|---------|
| `sem-reg/` | Semester registration Excel/CSV imports (PII) |
| `.tmp-diagrams/` | Scratch diagram exports |
| `.env`, `secrets.env` | Local secrets |
