# ExamCell institutional UI (uniz-portal)

Phase 3 redesign tokens for authenticated portal surfaces. Source reference: `examcell.rguktrkv.ac.in`.

Do **not** apply the SaaS glass/mesh prompt in `frontend-prompt-redesigning.md` to portal routes. Landing (`apps/uniz-landing`) is out of scope.

## Token table

| Token | Value |
| --- | --- |
| Header gradient | `radial-gradient(circle farthest-corner at 16.5% 37.3%, #0A2540 0.1%, #021227 90%)` |
| Navy (primary) | `#0A2540` |
| Navy deep | `#021227` |
| Surface | `#FFFFFF` |
| Surface muted | `#FAFAFA` |
| Border / footer | `#EEEEEE` |
| Accent red | `#EA2027` |
| UI font | Open Sans |
| Button font | Nunito |
| Form / footer font | Cabin |
| Header height | `60px` fixed |
| Form radius | `2px` (`rounded-portal-sm`) |
| Primary CTA | Full-width navy, Nunito |

## CSS entry points

- `apps/uniz-portal/src/index.css` — vars, `.portal-theme`, `.uniz-logo-wordmark`, `.uniz-primary-btn`
- `apps/uniz-portal/tailwind.config.js` — `navy` / `portal` / `blue→navy` map, fonts
- `apps/uniz-portal/src/lib/portal-ui.ts` — shared class strings (prefer editing here)

## Branding

Wordmark is Open Sans **uppercase** (`UNIZ`), not Pattaya cursive.
