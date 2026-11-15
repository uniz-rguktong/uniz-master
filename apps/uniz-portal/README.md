# UniZ Portal

Student, faculty, and admin SPA for [uniz.rguktong.in](https://uniz.rguktong.in).

React + Vite + TypeScript + Tailwind. Deploys on **Cloudflare Pages** (K8s portal Deployment is parked).

## Brand & home

- Palette: navy `#0B2A47` + white + black (`src/index.css`, `src/lib/portal-ui.ts`)
- Public home: `src/pages/home.tsx` — Elaya Layout A (Manrope, split hero + product preview, scrollable)
- Wordmark: Pattaya (`uniZ.`)
- Sign-in: Cloudflare Turnstile when `VITE_TURNSTILE_SITE_KEY` is set; `src/utils/prefetchTurnstile.ts` warms the script on boot and Get started hover/focus

## Layouts

| Audience | Entry |
|----------|--------|
| Public | `/` home, `/developers`, `/privacy`, SEO landings |
| Student | `/student/*` after `/student/signin` |
| Faculty | `/faculty` (admin sign-in → faculty role) |
| Staff / admin | `/admin/*` after `/admin/signin` |

Trainer inventory (features + actions by role): [`docs/guides/UniZ-UI-Guidance.docx`](../../docs/guides/UniZ-UI-Guidance.docx). API / action flows: [api-uniz.rguktong.in/docs](https://api-uniz.rguktong.in/docs).

## Local

```bash
cp .env.example .env   # set VITE_API_URL; optional VITE_TURNSTILE_SITE_KEY
npm install
npm run dev
```

http://localhost:5173 — monorepo setup: root [README](../../README.md) and [docs/local/LOCAL_SETUP.md](../../docs/local/LOCAL_SETUP.md).

## Stack

React 18 · Vite · Tailwind · Framer Motion · Radix · SWR / Recoil · Recharts
