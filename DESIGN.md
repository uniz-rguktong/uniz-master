# UniZ design system (RGUKT student portal)

Foundation for **UniZ** (`uniz.rguktong.in`) and the public campus site (`rguktong.in`). This document is the source of truth for visual direction. Implementation lives in `packages/uniz-design-tokens` and is **wired but not applied** to screens until the follow-up PRs land.

## Creative direction — **Campus ledger**

A calm, institutional student portal: paperwork made legible, not a startup dashboard. Think registrar counter meets modern mobile banking — navy structure, one confident accent, serif display moments only where the institute speaks (titles, hero statements). No glass, no mesh, no vanity metrics, no “AI product” chrome.

| Choice | Decision |
| --- | --- |
| **Accent** | `#EA2027` (RGUKT red) — alerts, primary CTAs on marketing, links that must pop |
| **Display type** | [Source Serif 4](https://fonts.google.com/specimen/Source+Serif+4) — page titles, section heroes, landing H1 |
| **UI type** | [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans) — body, forms, tables, nav (until migration PRs load webfonts) |
| **Icons** | [Lucide](https://lucide.dev) only in product UI — no emoji, no mixed icon packs |
| **Density** | Comfortable: 8px spacing rhythm, 44px minimum touch targets |

## Tokens

Canonical CSS variables: `packages/uniz-design-tokens/src/tokens.css`  
TypeScript mirror: `packages/uniz-design-tokens/src/tokens.ts`  
Tailwind hooks (opt-in): `rounded-control`, `rounded-card`, `rounded-sheet`, `duration-ui`, `ease-out` in `apps/uniz-portal/tailwind.config.js`

### Colour (light)

| Token | Value | Use |
| --- | --- | --- |
| `--uniz-bg-canvas` | `#FAFAFA` | App background |
| `--uniz-bg-elevated` | `#FFFFFF` | Cards, sheets |
| `--uniz-bg-muted` | `#F4F4F5` | Stripes, table headers |
| `--uniz-border-default` | `#E2E8F0` | Hairlines |
| `--uniz-text-primary` | `#0F172A` | Body |
| `--uniz-text-secondary` | `#475569` | Labels, meta |
| `--uniz-navy-800` | `#0A2540` | Brand chrome |
| `--uniz-accent` | `#EA2027` | Accent |

### Colour (dark)

Activated via `data-uniz-theme="dark"` on `:root` (not enabled globally yet). Canvas `#021227`, elevated `#061B33`, text inverted per `tokens.css`.

### Type scale

| Role | Size | Weight | Case |
| --- | --- | --- | --- |
| H1 | `2.75rem` | 500 | Sentence |
| H2 | `2rem` | 500 | Sentence |
| H3 | `1.5rem` | 500 | Sentence |
| H4 | `1.125rem` | 500 | Sentence |
| Body | `1rem` | 400 | Sentence |
| Small | `0.875rem` | 400 | Sentence |
| Micro / label | `0.75rem` | 500 | Sentence (never ALL CAPS tracking) |

### Spacing

4px base grid; layout steps at 8, 16, 24, 32, 40, 48, 64 (`--uniz-space-*`).

### Radius by role

| Role | px | Tailwind (opt-in) |
| --- | --- | --- |
| Controls (buttons, inputs, chips) | 10 | `rounded-control` |
| Cards, list tiles | 14 | `rounded-card` |
| Sheets, dialogs, drawers | 20 | `rounded-sheet` |
| Avatars, badges only | full | `rounded-pill` |

### Elevation

`--uniz-shadow-1` (resting), `--uniz-shadow-2` (hover/float), `--uniz-shadow-3` (modal). No colored glow shadows.

### Motion

`--uniz-duration-ui: 200ms`, `--uniz-ease-out: cubic-bezier(0, 0, 0.2, 1)`. No spring physics in navigation or modals. Respect `prefers-reduced-motion`.

## Unslop rules

1. **Headings**: medium weight (500), sentence case, no `tracking-widest` labels.
2. **No glows**: drop mesh gradients, shimmer sweeps, and heavy `blur-[120px]` backdrops except where explicitly approved for one marketing hero (prefer flat navy).
3. **No emoji icons** in navigation or forms.
4. **Copy**: factual, registrar tone — no “supercharge”, “unlock”, or fake live counters.
5. **Token values only** in new code — no raw hex in components once a screen is migrated.
6. **States**: every data view needs loading skeleton, empty explanation, and actionable error (retry or contact).
7. **Contrast**: WCAG AA for text; 44×44px hit targets on mobile nav and form actions.

## Follow-up PR sequence (one area each)

1. **Tokens + fonts** — load Source Serif 4 + IBM Plex Sans; map legacy Cabin usage to tokens.
2. **Public portal shell** — header, footer, home, sign-in (`CommonSignin`, `login-1`).
3. **404 / maintenance / CampusBoot** — remove mesh 404, align loaders to token motion.
4. **Student chrome** — `Sidebar`, bottom nav, notification badge.
5. **Student academics** — grade hub, attendance, registration, current semester.
6. **Student services** — fees, library, placement, alumni, info, clubs.
7. **Student forms** — grievance, feedback, password reset, help.
8. **Faculty dashboard** — leave, exam duties, library, profile.
9. **Admin hub + layout** — role cards, `AdminLayout`, section routing.
10. **Webmaster / COE dashboards** — tables, semester builder, analytics charts.
11. **Dean / director / librarian shells** — nav labels, spacing, empty states.
12. **Landing (`uniz-landing`)** — home, institute, academics, departments, notifications.
13. **Shared UI kit** — `Button`, badges, toasts, data grids (MUI/Radix wrappers).
14. **Docs site chrome** — VitePress theme variables only (optional).

## HANDOFF

**For engineers**

- Import tokens: `@import "@uniz/design-tokens/tokens.css"` (already in portal + landing CSS entrypoints).
- Prefer `import { unizTokens } from "@/lib/ui-tokens"` when a constant is needed in TS.
- Do not change legacy `rounded-lg` / `rounded-xl` in bulk — migrate per screen to `rounded-control` / `rounded-card`.
- **Outpass routes stay commented out** in `App.tsx`; do not restyle parked outpass URLs.
- **Do not merge** design PRs without screenshot proof in PR body (artifact links, not committed PNGs).

**For designers / PM**

- Audit baseline and before screenshots are attached to the foundation PR (not in repo).
- Dark mode is spec’d but not productized; capture light only until a theme toggle PR exists.
- Accent red is reserved; navy carries structure. Secondary colours in charts should come from the navy ramp, not random blues.

**CI**

- `npm run build -w uniz` must stay green; token changes must not alter computed styles on untouched class names.

**Contact**

- Design questions: tag `@uniz-rguktong/design` on GitHub (or repo CODEOWNERS).
