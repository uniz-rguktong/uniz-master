---
title: "Change the frontend"
description: "Edit portal or landing SPAs, local preview, production Pages deploy, API URL rules."
---

## Portal (`uniz.rguktong.in`)

| Item | Path |
|------|------|
| App | `apps/uniz-portal/` |
| Routes | `src/App.tsx` |
| API client | `src/api/` |
| Feature flags | `src/lib/featureFlags.ts` (or equivalent) |
| SPA redirects | `public/_redirects` |

### Local

```bash
npm ci
npm run dev -w uniz   # or workspace name from package.json
```

Point `VITE_API_URL` at local gateway or staging.

### Production

Any change under `apps/uniz-portal/**` triggers Pages workflow on `main`. Confirm:

- `VITE_API_URL=https://api-uniz.rguktong.in/api/v1`
- Custom domain Active on Cloudflare Pages project `uniz-portal`

## Landing (`rguktong.in`)

| Item | Path |
|------|------|
| App | `apps/uniz-landing/` |
| API | `VITE_LANDING_API_URL` → `landing-api.rguktong.in` |

## Do not

- Commit secrets into Vite env
- Expect K8s `uniz-portal` Deployment to serve traffic (replicas 0)
- Proxy FE through tunnel (tunnel is API-only)
