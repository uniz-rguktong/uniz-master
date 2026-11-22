---
title: "Change the frontend"
description: "Edit portal or landing SPAs, local preview, production Pages deploy, API URL rules."
---

## Portal (`uniz.rguktong.in`)

| Item | Path |
|------|------|
| App | `apps/uniz-portal/` |
| Routes | `src/App.tsx` |
| Public home | `src/pages/home.tsx` — Elaya Layout A (Manrope, split hero + product preview, scrollable landing) |
| Navbar | `src/components/Navbar.tsx` (floating on `/`) |
| API client | `src/api/` |
| Feature flags | `src/config/featureFlags.ts` |
| Theme | Light-only. `src/lib/forceLightTheme.ts` drops a stored `dark` or `system` value. Navy `#0B2A47` is a light-UI token in `src/index.css`, `tailwind.config.js`, and `src/lib/portal-ui.ts`. |
| SPA redirects | `public/_redirects` |

Prefer CSS tokens and established portal-ui patterns for most screens. The public home was intentionally redesigned (Elaya Layout A); do not revert it to the old single-viewport centered layout when changing colors or copy.

Campus trainer UI inventory (screenshots + actions by role) lives in the repo at `docs/guides/UniZ-UI-Guidance.docx` — not duplicated on this docs site.

Layout sweep: [Responsive audit](/howto/responsive-audit). It does not replace a visual pass.

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
