---
title: "Responsive audit"
description: "Where the layout audit lives, how CI runs it, and what it does not replace."
---

`scripts/responsive-audit/` walks the portal, the landing site, and these docs at six viewports against mocked API responses. It checks that long text, code blocks, and tap targets stay on screen.

| Piece | Path |
|-------|------|
| Runner | `scripts/responsive-audit/audit.mjs` |
| Routes | `scripts/responsive-audit/routes.mjs` |
| Mocks | `scripts/responsive-audit/fixtures.mjs` |
| Checks | `scripts/responsive-audit/detect.mjs` |
| npm script | `npm run audit:responsive` (repo root) |

Viewports: 360×740, 390×844, 768×1024, 1024×768, 1280×800, 1440×900. The script writes `scripts/responsive-audit/out/report.json` and `report.md`. Screenshots are taken only for open failures.

## CI

The **Responsive audit** job in `.github/workflows/ci.yml` runs that script after a Chromium install. The job is `continue-on-error: true`. A failure is uploaded as the `responsive-audit` artifact and does not block merge.

Shared shells already keep overflow in check. Docs overflow and tap-target CSS lives in `apps/uniz-docs/.vitepress/theme/custom.css`. Portal tables stack below 900px (`apps/uniz-portal/src/components/ui/table.tsx`).

The product was audited with **0 open issues** when that work merged. The audit does not replace a visual pass. A green report means the script did not find overflow or tiny targets on the mocked routes. It does not sign off copy, color, or a new screen you have not added to `routes.mjs`.
