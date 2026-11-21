# UniZ logo handoff — M1

This folder is the drop-in set for the picked **M1** wordmark: a cleaned-up “uniZ” (geometric sans, lowercase uni, capital Z, raised i-tittle, floating dot) in the U2 navy `#0B1B3A`.

It **replaces the O3 UZ monogram** from the U2 brief. Colour tokens stay unchanged. Ship in **one PR**, frontend/static only — **no backend changes**.

The app icon is the **full white M1 word** on a navy rounded square, sized to about 70% of the tile width and optically centred. At 16 and 32 the full word cannot be read, so those two favicons are a pixel-snapped bold Z plus a square dot.

## What’s in here

```
wordmark/
  M1-wordmark-navy.svg      Navy #0B1B3A on transparent. Header, footer, light chrome.
  M1-wordmark-white.svg     White on transparent. Navy header, sidebar, sign-in pane.
  M1-wordmark-mono.svg      currentColor. Inherits ink from the parent.
  M2-lockup.svg             M1 plus the tagline, navy / muted navy on transparent.
  M2-lockup-white.svg       The same lockup, white / on-navy, for navy fields.

icons/
  icon.svg                  App-icon master (rounded navy tile, 512 viewBox).
  icon-512.png
  icon-192.png
  icon-180.png
  icon-48.png               Convenience size for previews, not in the manifest.
  icon-maskable.svg
  icon-maskable-512.png     Full-bleed; the word sits inside the 80% safe circle.
  apple-touch-icon.png      Full-bleed 180. iOS applies its own rounding — do not
                            use the pre-rounded icon-180.png as the apple-touch.
  favicon-32.png            Bold Z + 3×3 dot, pixel-snapped.
  favicon-16.png            Bold Z + 2×2 dot, pixel-snapped.
  favicon.ico               16 and 32 in one file.
  favicon.svg               Vector Z + dot on a navy rounded square.

manifest-icons.json         Ready-to-paste `icons` arrays for portal and landing.
preview.png                 512 / 180 / 48 app icon next to the M1 wordmark.
```

## Where each asset goes in `uniz-rguktong/uniz-master`

### Portal — `apps/uniz-portal`

**Header, sidebar chrome, sign-in pane, public frame**

Today these render the O3 monogram + a serif “UniZ” via:

- `src/components/brand/Mark.tsx` (`Mark`, `Lockup`) — replace the monogram with the M1 wordmark SVG (inline or imported). Use `M1-wordmark-white.svg` on navy chrome (`tone="chrome"`) and `M1-wordmark-navy.svg` (or the mono file at `currentColor`) on light surfaces.
- Callers to update in the same PR: `src/components/Navbar.tsx`, `src/components/Sidebar.tsx`, `src/components/admin/AdminShell.tsx`, `src/components/admin/UnizLogo.tsx`, `src/components/ui/login-1.tsx`, `src/components/public/PublicFrame.tsx`.

For a collapsed sidebar (currently the O3 mark only): use a compact M1 wordmark if it still reads at that size; otherwise the Z+dot symbol (`favicon.svg` / the symbol in `icon` terms), not the old monogram.

**Favicon**

Replace:

- `public/favicon.ico` ← `icons/favicon.ico`
- `public/favicon.png` ← `icons/favicon-32.png` (the HTML link is `sizes="32x32"`)
- `public/favicon.svg` ← `icons/favicon.svg`

Head tags already live in `apps/uniz-portal/index.html`.

**PWA manifest icons**

Replace, then paste the `portal` icons array from `manifest-icons.json` into `public/manifest.json` (leave `name`, `theme_color`, `start_url`, shortcuts, etc. as they are):

- `public/icons/icon-192.png` ← `icons/icon-192.png`
- `public/icons/icon-512.png` ← `icons/icon-512.png`
- `public/icons/icon-maskable-512.png` ← `icons/icon-maskable-512.png`

Also replace the older root copies used as the apple-touch target and generic logos:

- `public/logo180.png` — prefer pointing the apple-touch link at the full-bleed file (see below) rather than this pre-rounded 180.
- `public/logo192.png` ← `icons/icon-192.png`
- `public/logo512.png` ← `icons/icon-512.png`
- `public/logo.png` ← `icons/icon-512.png` (this file is currently a 512)

**Apple touch icon**

- Copy `icons/apple-touch-icon.png` to `public/apple-touch-icon.png` (new file, or replace `logo180.png` if you keep a single 180).
- In `apps/uniz-portal/index.html`, change `<link rel="apple-touch-icon" href="/logo180.png">` to `/apple-touch-icon.png`.

**Service-worker cache list**

`public/sw.js` does not keep a precache array today. It does reference a notification icon and badge:

- `public/assets/uniz-logo.png` ← use `icons/icon-192.png` (or 512). Update the `icon` and `badge` paths in `sw.js` only if you also rename the file.
- If a precache / Workbox list is added later, include `/favicon.ico`, `/favicon.svg`, `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-maskable-512.png`, and `/assets/uniz-logo.png`.

**OG images**

- `apps/uniz-portal/index.html` currently sets `og:image` to a Cloudinary sign-in photograph, not a logo card. Leave that as-is unless you are deliberately switching to a brand OG.
- `public/og-image.png` exists but is unused by that tag. If you introduce a logo OG (1200×630), build it from `M1-wordmark-white.svg` or `M2-lockup-white.svg` on `#0B1B3A`. This handoff does not include that raster.

### Landing — `apps/uniz-landing`

**Header and footer**

`src/components/layout/Header.tsx` and `Footer.tsx` (and `MobileAppModal.tsx`) currently use `/rgukt-logo.png`. For UniZ chrome, switch those lockups to the M1 wordmark (`M1-wordmark-navy.svg` in the light header, `M1-wordmark-white.svg` in the inverted footer). Keep `public/rgukt-logo.png` as the institutional crest if it is still needed as a partner mark, not as the UniZ logo.

`src/components/brand/Lockup.tsx` still contains the unused O3 monogram (`O3Mark`). Remove or replace it with M1 in the same PR.

**Favicon and apple-touch**

Replace:

- `public/favicon.ico` ← `icons/favicon.ico`
- `public/favicon-16.png` ← `icons/favicon-16.png`
- `public/favicon-32.png` ← `icons/favicon-32.png`
- `public/favicon.svg` ← `icons/favicon.svg`
- `public/apple-touch-icon.png` ← `icons/apple-touch-icon.png` (full-bleed 180)

Head tags already live in `apps/uniz-landing/index.html`.

**PWA manifest**

`public/manifest.webmanifest` today only lists the 32 and 180 icons. Replace those files, and optionally add 192/512 by copying `icon-192.png` and `icon-512.png` into `public/` and pasting the `landing` icons array from `manifest-icons.json`. Do not change `theme_color` or other tokens in this PR.

**OG images**

The landing `og:image` is `https://rguktong.in/rgukt-logo.png`. Leave it unless you are adding a UniZ OG card (same approach as the portal).

## Notes for the PR

- Tokens (`#0B1B3A`, `#C9D3EA`, navy scale) stay as they are.
- One PR, no API, schema, or service changes.
- Do not leave the O3 monogram in `Mark.tsx` / `O3Mark` once M1 is wired in.
- The M2 tagline lockup is for marketing / formal uses (landing hero, footer, share cards). Headers and the sidebar should stay the bare M1 wordmark.
