# UniZ | University Intelligence Engine

[![VPS Automated Deployment](https://github.com/uniz-rguktong/uniz-master/actions/workflows/deploy.yml/badge.svg)](https://github.com/uniz-rguktong/uniz-master/actions/workflows/deploy.yml)

**New here?** [Handover](docs/HANDOVER.md) · **Live docs:** [api-uniz.rguktong.in/docs](https://api-uniz.rguktong.in/docs) · **Action flows:** [docs/system/action-flows](https://api-uniz.rguktong.in/docs/system/action-flows) · **UI guide (trainers):** [docs/guides/UniZ-UI-Guidance.docx](docs/guides/UniZ-UI-Guidance.docx) · **Ops:** [docs/ops/INDEX.md](docs/ops/INDEX.md)

## Architecture

<img width="1379" height="1141" alt="image" src="https://github.com/user-attachments/assets/e1a7c496-4754-4ef8-b045-f26dd9684317" />

### What you are looking at

UniZ runs on a **single VPS + Cloudflare free**:

| Layer | Owns |
|---|---|
| **Cloudflare Pages** | Portal (`uniz.rguktong.in` — Elaya Layout A home, navy `#0B2A47` + white + black, Turnstile on sign-in) and Landing (`rguktong.in`) SPAs |
| **VPS (k3s)** | APIs, VitePress docs, landing-api, Postgres, Redis, uploads, observability |
| **Off-box** | AWS SES for mail only |

There is no always-on legacy monolith (`uniz-api` is gone). Public API traffic is **host nginx → Traefik → `uniz-gateway-api` → microservices**. Org repos: **`uniz-master`** (product) + **`.github`** (profile); hall-ticket is a separate utility if present.

### Request path

User loads Portal from Cloudflare Pages → SPA calls `api-uniz.rguktong.in` → Cloudflare → host nginx → Traefik → gateway-api → Auth / User / Academics / Notifications → Postgres (Redis / uploads / SES as needed).

### Always-on (earns its place)

`uniz-gateway-api` · `uniz-auth-service` · `uniz-user-service` · `uniz-academics-service` · `uniz-notification-service` · `uniz-redis` · `uniz-docs-service` · Netdata + Uptime Kuma (localhost / SSH tunnel)

HPA scales gateway / auth / user / academics / notifications within one 4-vCPU / ~15Gi box. Spare CPU is HPA budget, not “pin idle at 90%.”

### Parked or folded

| Item | Status |
|---|---|
| Portal / Landing pods | Parked — production FE on Cloudflare Pages |
| nginx `uniz-gateway` hop | Parked — Traefik → gateway-api |
| Outpass | Parked / gated (`503`) |
| Mail / files / always-on cron Deployments | Folded into notifications / user / CronJobs |
| Legacy `uniz-api` | **Removed** |

### Docs (VitePress)

In-house docs are a static VitePress site on the VPS — not Cloudflare Pages.

<img width="1985" height="792" alt="image" src="https://github.com/user-attachments/assets/245c2962-e6f9-40a5-aa49-8538b277e02f" />

- App: `apps/uniz-docs`
- Public: [https://api-uniz.rguktong.in/docs](https://api-uniz.rguktong.in/docs)
- Architecture, API reference, role guides, [action flows](https://api-uniz.rguktong.in/docs/system/action-flows)
- Campus UI inventory (Word): [`docs/guides/`](docs/guides/) — features/actions by role; not a substitute for API docs

### Backend services

Auth issues JWT. User holds profiles, campus CMS, grievances, and file uploads. Academics is results and registration. Notifications owns inbox, web push, and email. Landing-backend (FastAPI) powers the public website CMS. Docs is VitePress under `/docs`.

### Self-hosted images and AWS SES

Uploads go to user-service `/files/image/upload` (WebP via `sharp`, persistent volume), served at `/api/v1/files/img/*` and cached by Cloudflare. **AWS SES** sends OTP / reset / campus mail via Notifications. (Excel/CSV bulk backups still use Cloudinary.)

### Postgres, Redis, host exposure

Postgres is source of truth. Redis is short-lived (gateway cache, BullMQ). DB / admin Docker ports bind **loopback + k3s cni0 only** — not the public NIC. Observability UIs are SSH-tunnel only (`docs/ops/INDEX.md`).

### Role cheat sheet

| Role | Shell | Main actions |
|------|-------|----------------|
| Student | `/student` | Login, profile, grades, attendance, registration, PDF, notices, grievance, inbox |
| Webadmin / COE / Director | Admin dashboards | Students, uploads, semester, CMS, push, resets |
| Dean | DeanDashboard | Allocations, advance, academics, CMS |
| HOD | DeanDashboard slim | Branch approval, registration tracking |
| SWO | SWODashboard | Grievance list / resolve / delete |
| Faculty | `/faculty` | Profile, student search, password |

Canonical layout: **[STRUCTURE.md](STRUCTURE.md)** · Infra: **[infra/README.md](infra/README.md)** · Ops: **[docs/ops/INDEX.md](docs/ops/INDEX.md)**.

### Contributing & review flow

Collaborators work on branches and open PRs to `main`. Every PR needs an approving review from a **code owner** and only a maintainer with push access can merge — see **[CONTRIBUTING.md](CONTRIBUTING.md)** and **[docs/ops/github-governance.md](docs/ops/github-governance.md)**.

---

<details>
<summary> 
    <b>okay, but how to setup this locally ?</b>
</summary>

<br/>

You do **not** need production passwords or VPS access.

### A — Full stack in Docker (fastest demo)

```bash
git clone https://github.com/uniz-rguktong/uniz-master.git
cd uniz-master
cp .env.example .env
make up && make seed
```

| What | Where |
|------|--------|
| Portal | http://localhost:8080 (or `WEB_PORT`) |
| API (via portal) | http://localhost:8080/api/v1 |
| Sign-in | `webadmin` / `password123` |

Details: [docker/README.md](docker/README.md).

### B — Hot-reload development

```bash
cp secrets.env.example secrets.env
npm run setup:local
npm run seed:local    # first time
npm run dev:all
```

| What | Where |
|------|--------|
| Portal | http://localhost:5173 |
| API gateway | http://localhost:3000/api/v1 |
| Docs (optional) | `npm run docs:dev` → http://localhost:3333/docs/ |
| Sign-in (after seed) | `webadmin` / `password123` |

Full guide: [docs/local/LOCAL_SETUP.md](docs/local/LOCAL_SETUP.md) · [CONTRIBUTING.md](CONTRIBUTING.md).

### Manual / troubleshooting

```bash
# Postgres + Redis only
docker compose -f docker/local/compose.db.yml up -d uniz-redis uniz-postgres
npm install
npm run vault:sync
npm run prisma:generate
# then: npm run setup:local  OR  make up
```

### Seed

```bash
npm run seed:local
```

### Windows

Use WSL2 + Docker Desktop. Prefer bash for `setup-local.sh`.

`secrets.env.example` and `.env.example` ship **dev-only** placeholders. Never commit `secrets.env` or `.env`.

</details>
