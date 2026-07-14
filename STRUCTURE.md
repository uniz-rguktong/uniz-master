# UniZ monorepo structure

Industry-style layout. **`apps/` and `packages/` are stable** (CI, workspaces, K3s).

```text
uniz-master/
├── apps/                    # npm workspaces (microservices + portal + landing)
├── packages/                # shared libraries (@uniz/shared)
├── docker/
│   ├── prod/                # CI / VPS image build (Dockerfile.service)
│   ├── local/               # laptop Compose (compose.yml, *.local, portal, seed)
│   └── README.md
├── scripts/
│   ├── ci/                  # GitHub Actions helpers
│   ├── deploy/              # VPS deploy, migrations, GHCR, harden
│   ├── local/               # setup-local, sync, seed
│   ├── ops/                 # vault, latency, load tests
│   └── *.sh                 # thin shims → ci/ or deploy/ (compat)
├── docs/
│   ├── local/               # LOCAL_SETUP
│   ├── architecture/        # technical architecture, URLs
│   └── internal/            # brain/, features/, historical notes
├── infra/                   # K3s manifests, core-infra
├── .github/workflows/       # CI + VPS deploy
├── Makefile                 # make up / seed (local only)
├── package.json             # workspaces root
├── .env.example             # local Compose env template
└── secrets.env.example      # hot-reload / vault template
```

## Two runtimes (same code)

| Mode | Command | Orchestrator |
|------|---------|--------------|
| Local / demo | `make up && make seed` | Docker Compose (`docker/local/`) |
| Production | push to `main` | GitHub Actions → GHCR → **K3s** |

Compose never runs on the VPS. Production images use `docker/prod/Dockerfile.service` only.
