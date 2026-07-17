---
title: "Cloudflare Pages deploy"
description: "Portal + landing static hosting — build env, Wrangler, custom domains, DNS cutover away from VPS."
---

## Projects

| Project | Domain | Source |
|---------|--------|--------|
| `uniz-portal` | `uniz.rguktong.in` | `apps/uniz-portal` |
| `uniz-landing` | `rguktong.in` | `apps/uniz-landing` |

## Pipeline

```mermaid
flowchart LR
  Push[push FE paths / dispatch] --> Install[npm ci + linux lightningcss]
  Install --> Build[Vite build]
  Build --> Wrangler[wrangler pages deploy]
  Wrangler --> Domains[Attach custom domains]
  Domains --> DNS[cutover-frontends-to-pages-dns.sh]
```

- Workflow: `.github/workflows/deploy-cloudflare-pages.yml`
- Script: `scripts/deploy/deploy-cloudflare-pages.sh`
- DNS: `scripts/deploy/cutover-frontends-to-pages-dns.sh`

## Required secrets

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Pages **Edit** + Zone DNS **Edit** (+ Account Settings Read) |
| `CLOUDFLARE_ACCOUNT_ID` | Optional; else resolved via zone |
| `VITE_API_URL` | Default `https://api-uniz.rguktong.in/api/v1` |
| `VITE_LANDING_API_URL` | Default `https://landing-api.rguktong.in` |
| Other `VITE_*` | Turnstile, Cloudinary, analytics, flags |

## Build-time wiring

Portal must call the **absolute** API URL on Pages (no same-origin `/api`). See `apps/uniz-portal/src/api/endpoints.ts`.

SPA fallbacks: `apps/uniz-portal/public/_redirects`, `apps/uniz-landing/public/_redirects`.

## Manual deploy

```bash
export CLOUDFLARE_API_TOKEN=...
bash scripts/deploy/deploy-cloudflare-pages.sh all
```

## DNS rule

Frontend hostnames must CNAME to `*.pages.dev` (proxied). They must **not** point at the Cloudflare Tunnel / VPS A records. API hosts stay on VPS.
