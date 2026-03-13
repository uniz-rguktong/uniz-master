# Student App — Production Readiness Audit

**Repository:** `Ornate-Ts` (Next.js 16, React 19, TypeScript)  
**Audit Date:** March 11, 2026  
**Auditor:** GitHub Copilot — Deep Production & Performance Audit

---

## 1. Overall Assessment

The application is **not fully production-ready** in its current state, but it is closer to production quality than most projects at this stage. It has strong security headers, a working auth system, rate limiting, Redis caching on critical paths, and image optimization configured. However, several architectural concerns stand in the way of a stable production deployment:

1. **Monolithic client components** — seven files exceed 700 lines, four exceed 1,000 lines. These are not splittable by the framework and must be sent as single JS chunks to the browser.
2. **A CPU-intensive landing page** — the landing page (`/`) loads **720 frames of canvas animations** (_SceneOne_) plus a full Three.js intro animation before the user sees anything interactive. This inflicts a multi-second TTFB/LCP penalty on every first visit.
3. **Missing `<Image>` usage** — dozens of `<img>` tags in client components bypass Next.js image optimization, resulting in uncompressed, non-lazy, non-responsive images.
4. **`SectorHeader` fires a DB-backed API call on every inner page mount** — `/api/me/rank` runs a `count` query against the database on every render of `SectorHeader`, which is used on the Missions, Cadet Hub, Profile, Roadmap, Updates, and other pages simultaneously.
5. **`CentralConsole` fires an API call on every mount** — the `/api/home/hologram-stats` fetch (with 3 retry attempts) fires on every mount of `HomeClient`.
6. **`force-dynamic` on CadetHub** — this page makes 4 parallel DB queries on every request with no page-level ISR, making it expensive on every visit.
7. **Demo route exposed in production** — `/home/demo/cards` is a development test page accidentally accessible in production.
8. **Hardcoded fake data in multiple pages** — `MsMrRgukt` page, `GalleryClient`, and `FunPage` contain hardcoded placeholder participants/albums using `pravatar.cc` and Unsplash URLs.
9. **`any` types throughout** — `userProfile`, `neonStats`, `leaderboard`, `planets`, `myProfile` are all typed as `any` in server actions, client props, and page components, eliminating TypeScript's runtime safety guarantees.
10. **`getCadetLevel` and `CADET_LEVELS` are imported from `gamification-constants` but never validated client-side against real types** — this masks runtime crashes if the backend returns unexpected shapes.

Despite these problems the application has strong foundations: Next.js server components, `unstable_cache` caching on all data fetchers, ISR (`revalidate`) on branch/club/sports pages, JWT authentication, Redis rate limiting, and proper security headers including a tight CSP.

---

## 2. Routing Structure Analysis

### Architecture

The app uses Next.js App Router correctly. All authenticated content lives under `/home/**` and is protected by `src/middleware.ts` using `withAuth`. The landing page (`/`) is the cinematic intro. Login is at `/login`. Legal pages at `/terms` and `/privacy` are unprotected.

```
/                  → Landing (SceneOne canvas animation + IntroAnimation)
/login             → Auth form
/home              → Protected layout with SidebarWrapper
/home/...          → All student pages
```

### What Works Well

- **Middleware authentication** is correct: `withAuth` at `src/middleware.ts` gates all `/home/**` routes and excludes `/api/auth`, `/api/register`, `/api/health`, and static assets.
- **Redirect at `/home/branch`** correctly redirects to `/home/branches` (no dead end).
- **Dynamic routes** are correctly structured: `[slug]` for branches/clubs, `[id]` for stalls, `[id]` for verify.
- **Layout at `/home/layout.tsx`** is minimal — only injects `SidebarWrapper`, which is itself dynamically imported.

### Issues Found

| Issue | File | Severity |
|-------|------|----------|
| `/home/demo/cards` is a dev-only test page exposed in production | `src/app/home/demo/cards/page.tsx` | High — remove or gate with `NODE_ENV` |
| `SectorHeader` calls `/api/me/rank` on **every mount** — used in 8+ pages | `src/components/layout/SectorHeader.tsx:59` | High |
| No `<Suspense>` boundaries on any page | All pages | Medium |
| No `loading.tsx` files under any route | All routes | Medium |
| Announcement count is not surfaced in the `/home/updates` route — it fetches on page load but no stale-while-revalidate | `src/app/home/updates/page.tsx` | Low |

### Routing Recommendations

- **Create `loading.tsx`** in high-traffic routes (`/home/missions`, `/home/gallery`, `/home/cadet-hub`) to show skeleton UIs during server-side data fetching.
- **Remove `/home/demo`** or add a production guard: `if (process.env.NODE_ENV !== 'development') redirect('/home')`.
- **Add `<Suspense>` wrappers** in server page components around expensive queries.

---

## 3. Slow Pages

Pages are listed from most to least likely to cause slow loading.

| Page | File | Lines | Issue |
|------|------|-------|-------|
| Landing (`/`) | `src/app/page.tsx` → `SceneOne.tsx` / `IntroAnimation.tsx` | 846 + 416 | Loads 720 frames of canvas images + Three.js particles before any interaction. Blocks LCP until `onComplete`. |
| Missions | `src/app/home/missions/MissionsClient.tsx` | **1,324** | Largest file. 200+ lines of inline `@keyframes` CSS written into DOM via `dangerouslySetInnerHTML`. Full filter UI + registry in one component. Fetches up to 250 events server-side. |
| Gallery | `src/app/home/gallery/GalleryClient.tsx` | **1,173** | Hardcoded `BRANCHES` and `CLUBS` arrays with Unsplash URLs + full album viewer + lightbox + photogrid all in one file. Uses `<img>` (not `<Image>`) for every gallery card. |
| Cadet Hub | `src/app/home/cadet-hub/CadetHubClient.tsx` | **1,022** | `force-dynamic` → 4 DB queries on every request. 1,000-line client component. Leaderboard of 50 cadets rendered in full. |
| Culturals | `src/app/home/fest/culturals/CulturalsClient.tsx` | **977** | Dynamically loads `DomeGallery`, `CircularGallery`, `ScrollMorphHero` — 3 separate heavy bundles. Inline `StarField` canvas animation. |
| Roadmap | `src/app/home/roadmap/RoadmapClient.tsx` | **881** | `framer-motion` `useMotionValue`, `useTransform`, `animate`, `AnimatePresence` — all for a timeline page. Fetches 250 events. |
| BranchDetail | `src/app/home/branches/[slug]/BranchDetailClient.tsx` | **785** | Per-branch detail page exceeds safe size. Custom drag carousel implementation with 20+ `useRef`s and event listeners. |
| About | `src/app/home/about/page.tsx` | **463** | Page is `'use client'`, disabling SSR entirely. Uses `useScroll`, `useTransform`, `useSpring` — 3 complex motion hooks. |
| Sponsors | `src/app/home/sponsors/page.tsx` | **417** | Entirely static content but `'use client'` with 20+ motion elements. Could be a pure server component. |
| MsMrRgukt | `src/app/home/fun/ms-mr-rgukt/page.tsx` | **446** | Entirely fake/placeholder data. `i.pravatar.cc` images are fetched from an external CDN on every view. |

---

## 4. Heavy Components

| Component | File | Lines | Problem |
|-----------|------|-------|---------|
| `SceneOne` | `src/components/scene/SceneOne.tsx` | **846** | Pre-loads 720 canvas frames (6 sets × 120 frames each) from R2 CDN. 22 `useRef`s. Uses GSAP `ScrollTrigger` + RAF loop. Runs before user sees anything. |
| `IntroAnimation` | `src/components/scene/IntroAnimation.tsx` | **416** | Creates a full Three.js scene (1,500 particles, SVG loader) just for an intro. Blocks `SceneOne` from rendering. |
| `CompanionBot` | `src/components/CompanionBot.tsx` | **684** | 684-line `'use client'` component rendered globally in root layout. Contains story navigation, full chat panels, GSAP animation refs, and routing. Mounted on **every page** including landing. |
| `MissionsClient` | `src/app/home/missions/MissionsClient.tsx` | **1,324** | Embeds `@keyframes` via `dangerouslySetInnerHTML` on every render. Mixes 3 view modes (grid/list/card), multi-step filter dropdown, mission detail modal, and registration logic in one file. |
| `GalleryClient` | `src/app/home/gallery/GalleryClient.tsx` | **1,173** | Contains hardcoded `BRANCHES` + `CLUBS` config arrays (which are duplicated from `BranchDetailClient`). Mixes album explorer, lightbox, photo grid, and DomeGallery trigger in one file. |
| `SolarSystem3D` | `src/components/SolarSystem3D.tsx` | — | Calls `useLoader(THREE.TextureLoader, [...])` per planet — each planet is a separate texture load. 15 planets = 15 parallel texture fetches on mount. No `<Suspense>` boundary. |
| `CentralConsole` | `src/components/CentralConsole.tsx` | **335** | Makes an HTTP `fetch('/api/home/hologram-stats')` with 3 retries on every mount. Mounted on every visit to `/home`. |
| `SectorHeader` | `src/components/layout/SectorHeader.tsx` | — | Fires `fetch('/api/me/rank')` (which runs two DB queries: `findUnique` + `count`) on every mount. Used on 8+ pages. |
| `CircularGallery` (ui) | `src/components/ui/CircularGallery.tsx` | **768** | Uses `@use-gesture/react` + canvas. 768-line component with duplicated copy at `src/components/CircularGallery.tsx` (633 lines). |

---

## 5. UI / Graphics Impact

### Heavy Graphics Identified

**1. Canvas Frame Sequence — `SceneOne.tsx` / `sceneConstants.ts`**

The landing page loads **720 individual JPEG/WEBP frames** split across 6 sets of 120 frames (`FRAME_COUNT_1`–`FRAME_COUNT_6`), all hosted on an R2 CDN. These are streamed and drawn to canvas as the user scrolls. This is a deliberate cinematic approach, but:

- Every user must download hundreds of images before they can scroll past the intro.
- There is no progressive loading or resolution bucketing for mobile.
- `setIsLoaded` only fires when all 6 × 120 frames are preloaded.

**2. Three.js SolarSystem (`SolarSystem3D.tsx`)**

- 15 planets, each with its own `useLoader(THREE.TextureLoader, ...)` — 15 parallel texture network requests on mount.
- Sphere geometry of `args={[2.5, 64, 64]}` per planet — 64 × 64 segments renders a high-poly mesh per planet.
- A `pointLight` per planet (`15 × pointLight`) — expensive fragment shader pass per light.
- HTML labels using `@react-three/drei`'s `<Html>` per planet — DOM-in-WebGL is known to be expensive.

**3. Three.js Intro Animation (`IntroAnimation.tsx`)**

- Full Three.js renderer created on component mount: 1,500 star particles with custom shader material, camera, fog, SVG logo parsed by `SVGLoader` from `three-stdlib`, GSAP timeline.
- Runs before `SceneOne` is shown.
- WebGL context is created, animated, then destroyed — adds significant startup cost.

**4. Multiple Inline Starfield Canvases**

- `CulturalsClient` defines its own inline `StarField` using `requestAnimationFrame` at 30 FPS with 150 particles.
- `CadetHubClient` imports a `StarField` component dynamically.
- `src/components/core/Visuals/StarField.tsx` appears to be a separate implementation.
- This means multiple RAF loops may run simultaneously on the same page if sub-components share the layout.

**5. Unoptimized `<img>` Tags**

Numerous components use `<img>` instead of Next.js `<Image>`. This bypasses:
- AVIF/WebP format conversion (configured in `next.config.ts`)
- Automatic lazy loading
- Responsive `srcset`/`sizes`
- Blur placeholder

Files affected: `GalleryClient.tsx` (8+ `<img>` instances), `VideoSections.tsx`, `HighlightsSection.tsx`, `CompanionBot.tsx` (`/assets/Pingo_Bot.png`), `display-cards.tsx`, `morphing-card-stack.tsx`.

**6. Blur Effects at Scale**

`blur-[150px]` on animated, looping `motion.div` elements (`planet-view/page.tsx`) triggers expensive GPU compositing every animation frame. The planet-view page runs two `motion.div` elements with continuous scale and position animations of 100%+ viewport dimensions.

---

## 6. Bundle Size Analysis

### Dependencies Contributing to Large Bundles

| Dependency | Version | Impact | Notes |
|------------|---------|--------|-------|
| `three` + `@react-three/fiber` + `@react-three/drei` + `three-stdlib` | Latest | **Very High** | Full Three.js ecosystem (~2–3 MB minified). Only used for `SolarSystem3D` and `IntroAnimation`. Both are dynamically imported, but the chunks are large. |
| `framer-motion` | v12.35.0 | **High** | Used pervasively across virtually every page and component. v12 is tree-shakeable but the breadth of usage (AnimatePresence, layout animations, drag, scroll transforms) means most of the library is included. |
| `gsap` + `@gsap/react` | v3.14.2 | High | `ScrollTrigger` imported globally in `SceneOne`. `gsap` itself is 50KB+. |
| `@aws-sdk/client-s3` + `@aws-sdk/client-ses` + `@aws-sdk/s3-request-presigner` | ^3.x | **High** | AWS SDK v3 modular packages are included in the server bundle. These should never reach client chunks. Verify they are only in Server Components/API routes. |
| `lenis` | v1.3.17 | Medium | Smooth-scroll library. Only used in `SmoothScroll.tsx`. |
| `ogl` | v1.0.11 | Medium | WebGL library used by `CircularGallery`. This is in addition to Three.js. Two different WebGL libraries are bundled. |
| `ioredis` | v5.10.0 | Low | Server-only. Confirm it is never imported in client components. |
| `lucide-react` | v0.577.0 | Medium | Lucide is tree-shakeable but 40+ different icons are imported across the app. Valid usage, but some icons are imported inline in config objects (e.g., `SIDEBAR_LINKS` in `HomeClient.tsx` creates JSX as data, preventing tree-shaking of those icons). |
| `next-auth` | v4 | Low | Server-side primarily. Session used on client via `useSession` only. |
| `react-qr-code` | v2.0.18 | Low | Used in certificate/profile pages only. |

### Key Bundle Size Issues

**1. `HomeClient.tsx` imports icons as JSX in config arrays**

```tsx
// src/app/home/HomeClient.tsx
const SIDEBAR_LINKS = {
  core: [
    { label: 'STORIES', icon: <BookOpen size={18} />, url: '/home/stories' },
    ...
  ],
```

When JSX elements (`<BookOpen size={18} />`) are embedded in static config objects, the bundler cannot tree-shake the icon components referenced only in those objects. All 18 imported icons from `lucide-react` in `HomeClient.tsx` are locked into the chunk.

**2. Two WebGL libraries coexist**

`three` (used by `SolarSystem3D`, `IntroAnimation`) and `ogl` (used by `CircularGallery`) are both bundled. These cannot be merged. Total WebGL payload exceeds 3 MB+ before compression.

**3. `experimental.cpus: 1` in `next.config.ts`**

```ts
experimental: {
  cpus: 1,
}
```

This is set to avoid DB connection saturation during build. While safe with Supabase pooler limits, it makes builds significantly slower in CI/CD pipelines.

**4. No bundle analysis configured**

There is no `@next/bundle-analyzer` setup. Bundle composition is unknown without running an explicit analysis.

---

## 7. Rendering Performance

### Issues Identified

**1. `SectorHeader` fetches on every mount (no deduplication)**

```tsx
// src/components/layout/SectorHeader.tsx:59
useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/me/rank')
        .then(r => r.json())
        ...
}, [session?.user?.id]);
```

Every page that renders `SectorHeader` fires two DB queries (`findUnique` on `CadetProfile` + `count` on all profiles). If a user opens Missions, then Gallery, then Cadet Hub — 3 × `/api/me/rank` calls, each running the same queries. There is no client-side cache, no stale-while-revalidate, and no deduplication.

**2. `CentralConsole` retries on every mount**

```tsx
// src/components/CentralConsole.tsx:37
for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch('/api/home/hologram-stats');
    ...
}
```

Three retries for hologram stats are run on every home page visit without any client cache. If the API is slow, the user waits up to three round-trips before the CentralConsole stabilizes.

**3. `AboutPage` is `'use client'` unnecessarily**

`src/app/home/about/page.tsx` is marked `'use client'` and uses `useScroll`, `useTransform`, `useSpring` from `framer-motion`. All of the content is static. The page should be a server component with only scroll-animated sections wrapped in a client child component.

**4. `SponsorPage` is `'use client'` unnecessarily**

`src/app/home/sponsors/page.tsx` (417 lines) is entirely static content with motion animations. All data is hardcoded in the file. Zero server fetches. This entire page could be a server component — only the motion wrapper needs to be a client component.

**5. Re-renders on `HomeClient.tsx` due to state explosion**

`HomeClient.tsx` declares 10 separate `useState` hooks at the top level:

```tsx
const [activeMissionTab, setActiveMissionTab] = useState('missions');
const [activeScannerTab, setActiveScannerTab] = useState('branches');
const [showLeftPanel, setShowLeftPanel] = useState(false);
const [showRightPanel, setShowRightPanel] = useState(false);
const [selectedPlanet, setSelectedPlanet] = useState<string | null>('sun');
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [sidebarSearch, setSidebarSearch] = useState('');
const [isDesktop, setIsDesktop] = useState(true);
const [isHoloVisibleMobile, setIsHoloVisibleMobile] = useState(true);
const [isHoloVisibleDesktop, setIsHoloVisibleDesktop] = useState(true);
```

Any state change (e.g., `isDesktop` on resize) re-renders the entire component tree including `SolarSystem3D` (Three.js), `MissionsPanel`, `ScannerPanel`, and the SVG navigation layers. `SolarSystem3D` is wrapped in `dynamic` but once mounted it re-renders on every parent state change. The `isDesktop` resize handler runs without debouncing.

**6. Window resize listener without debouncing**

```tsx
// src/app/home/HomeClient.tsx
useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);
```

`setIsDesktop` fires on every pixel of resize, triggering `useMemo` recalculations and potential Three.js re-renders during window dragging.

**7. `AnimatedCounter` in `About` page causes React scheduling issues**

```tsx
// src/app/home/about/page.tsx
if (isInView && display < value) {
    setTimeout(() => setDisplay(prev => Math.min(prev + Math.ceil(value / 40), value)), 30);
}
```

This calls `setState` inside render (the render body, not a `useEffect`). This is a React anti-pattern that can cause infinite re-render loops and scheduling warnings. It will not throw in production but causes unnecessary repeated reconciliation.

**8. `MissionsClient` inlines `@keyframes` CSS on every render**

```tsx
// src/app/home/missions/MissionsClient.tsx
const shimmerStyles = `@keyframes shimmer { ... }`;
...
<style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />
```

This re-inserts a `<style>` block into the DOM on every render of `MissionsClient`. It should be moved to `globals.css`.

**9. Texture loading in `SolarSystem3D` — per-planet loaders, no preload**

Each `Planet` component calls `useLoader(THREE.TextureLoader, [planet.texture])`. With 8 branch planets + sun + additional celestial bodies, this creates up to 15 sequential/parallel network requests for textures when the home page mounts.

---

## 8. Data Fetching Efficiency

### Server-side (Good patterns observed)

- **`unstable_cache`** is used on all `lib/data/*.ts` files: `announcements`, `events`, `fest-settings`, `stalls`, `gallery`, `videos`, `winners`, `best-outgoing`, `branch-detail`.
- **`Promise.all`** used correctly in all page server components to run parallel fetches — `MissionsPage`, `HomePage`, `CadetHubPage` all batch their fetches.
- **ISR `revalidate`** is set on sports (`300s`), fixtures/results (`30s`), branches (`60s`), clubs (`60s`).
- The `/api/scores` API route has Redis cache with a 10-second TTL — correct for live scores.

### Client-side (Issues)

**1. `/api/me/rank` is called on every `SectorHeader` mount — no deduplication**

The endpoint runs:
```sql
SELECT totalEnergy FROM CadetProfile WHERE userId = $1
SELECT COUNT(*) FROM CadetProfile WHERE totalEnergy > $energy
```
Both queries on every page mount. With 8 pages using `SectorHeader`, a student browsing the app generates 8 separate rank queries per session. The rank should be cached in the session JWT or in a short-lived Redis key.

**2. `/api/home/hologram-stats` has no client-side caching**

`CentralConsole.tsx` fetches hologram stats with up to 3 retries on every mount. The API route (`src/app/api/home/hologram-stats/route.ts`) calls `getPublishedEvents(200)` which has `unstable_cache` on the server side, but the client re-fetches on every home page visit because there is no `Cache-Control` response header or `SWR`-style dedup.

**3. `useLiveScores` polling is manual, not SSE/WebSocket**

```tsx
// src/hooks/useLiveScores.ts
useEffect(() => {
    const controller = new AbortController();
    fetchScores(controller.signal);
    return () => { controller.abort(); };
}, [fetchScores]);
```

`useLiveScores` only fetches once per mount — this is actually fine. However, `UpdatesTicker.tsx` separately calls `fetch('/api/scores')` on mount creating a second fetch to the same endpoint from the same page if `UpdatesTicker` is shown alongside a page using `useLiveScores`.

**4. Gallery page fetches 45 albums × 30 images each**

```ts
// src/app/home/gallery/page.tsx
const albums = await getGalleryAlbums(45, 30);
```

This fetches up to 45 albums with 30 images each = up to 1,350 image URLs sent to the client in a single JSON payload. Most are never rendered until a user drills into an album. The `lib/data/gallery.ts` has no `unstable_cache` wrapper — this runs a live DB query on every page visit.

**5. `getPublishedEvents(250)` called on three separate pages**

Missions (`page.tsx`), Roadmap (`page.tsx`), and HomePage (`page.tsx`) all independently call `getPublishedEvents(250)`. The function wraps `unstable_cache`, so the second and third calls should hit cache — but each call is keyed separately (Missions fetches with limit 250, Roadmap with 250, Home with 200), creating three different cache entries. A unified cache key would be more efficient.

---

## 9. Required Optimizations

### Priority 1 — Critical (affects every user)

**1. Remove demo route from production**
```tsx
// src/app/home/demo/cards/page.tsx — add guard:
if (process.env.NODE_ENV === 'production') redirect('/home');
```

**2. Move `@keyframes` from `MissionsClient` to `globals.css`**

Remove `<style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />` from `MissionsClient.tsx`. Move the `shimmer`, `scanning`, `float-node`, and `ambient-pulse` keyframes to `src/app/globals.css`.

**3. Cache `/api/me/rank` response client-side or in session**

Option A: Store rank in session JWT (extended on login via `syncCadetEnergy`).  
Option B: Cache the response in `SectorHeader` using `localStorage` with a 5-minute TTL.  
Option C: Add `Cache-Control: private, max-age=300` to `/api/me/rank` response.

**4. Debounce window resize in `HomeClient.tsx`**

```tsx
const handleResize = useCallback(() => {
    clearTimeout(resizeTimer.current);
    resizeTimer.current = setTimeout(() => {
        setIsDesktop(window.innerWidth >= 640);
    }, 150);
}, []);
```

**5. Fix `AnimatedCounter` anti-pattern in `about/page.tsx`**

Move counter logic into `useEffect`:
```tsx
useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
        setDisplay(prev => {
            if (prev >= value) { clearInterval(interval); return value; }
            return Math.min(prev + Math.ceil(value / 40), value);
        });
    }, 30);
    return () => clearInterval(interval);
}, [isInView, value]);
```

**6. Replace `<img>` with Next.js `<Image>` in gallery and video components**

Components to fix: `GalleryClient.tsx`, `VideoSections.tsx`, `HighlightsSection.tsx`, `CompanionBot.tsx`, `display-cards.tsx`, `morphing-card-stack.tsx`, `fun/ms-mr-rgukt/page.tsx`, `fun/page.tsx`.

Use `next/image` with proper `width`, `height`, and `loading="lazy"`.

### Priority 2 — High Impact

**7. Wrap `getGalleryAlbums` with `unstable_cache`**

```ts
// src/lib/data/gallery.ts
import { unstable_cache } from 'next/cache';
export const getGalleryAlbums = unstable_cache(
    async (limit = 30, imageLimit = 20) => { ... },
    ['gallery-albums'],
    { revalidate: 300 }
);
```

**8. Add `loading.tsx` to slow routes**

Create `src/app/home/missions/loading.tsx`, `src/app/home/gallery/loading.tsx`, `src/app/home/cadet-hub/loading.tsx` with skeleton UIs. This surfaces the route immediately while server fetches complete.

**9. Convert static `'use client'` pages to server components**

`sponsors/page.tsx` and parts of `about/page.tsx` contain only static data with animations. Extract the animated sections into small client components:
```
sponsors/
  page.tsx           ← Server component (renders data)
  SponsorsHero.tsx   ← 'use client' (motion animations only)
```

**10. Reduce `SolarSystem3D` texture resolution and geometry**

Change sphere geometry from `64, 64` segments to `32, 32` — halves vertex count with minimal visual difference:
```tsx
<sphereGeometry args={[size, 32, 32]} />
```
Reduce per-planet `pointLight` intensity or replace with a single shared ambient light.

**11. Add `<Suspense>` in server page components**

```tsx
// src/app/home/missions/page.tsx
import { Suspense } from 'react';
export default async function MissionsPage() {
    return (
        <Suspense fallback={<MissionsSkeleton />}>
            {/* ... server data fetch ... */}
        </Suspense>
    );
}
```

### Priority 3 — Moderate Improvements

**12. Split `MissionsClient.tsx` (1,324 lines)**

Extract the following into separate files:
- `MissionsFilterBar.tsx` — filter dropdown and search
- `MissionDetailModal.tsx` — full-screen mission detail panel
- `MissionsGrid.tsx` / `MissionsList.tsx` / `MissionsStack.tsx` — three view modes

**13. Split `GalleryClient.tsx` (1,173 lines)**

Extract:
- `GalleryLightbox.tsx` — photo lightbox overlay
- `GalleryAlbumViewer.tsx` — album photo grid view
- `GalleryFilterBar.tsx` — filter and search bar

**14. Unify the two `CircularGallery` duplicates**

`src/components/CircularGallery.tsx` (633 lines) and `src/components/ui/CircularGallery.tsx` (768 lines) are two versions of the same component. The `components/CircularGallery.tsx` version appears unused (only `ui/CircularGallery` is imported via dynamic imports). Confirm and delete the unused version.

**15. Add `Cache-Control` headers to hologram-stats API**

```ts
// src/app/api/home/hologram-stats/route.ts
return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
});
```

**16. Implement ISR or `force-static` on `CadetHubPage`**

The page is `force-dynamic` and runs 4 parallel DB queries on every request. Change to ISR:
```ts
export const revalidate = 60; // regenerate every 60 seconds
// Remove: export const dynamic = 'force-dynamic';
```
Note: `myProfile` requires auth-specific data — keep that as a client-side fetch from `/api/me` after page load.

**17. Replace `i.pravatar.cc` placeholder images**

`fun/ms-mr-rgukt/page.tsx` contains hardcoded `pravatar.cc` URLs:
```tsx
{ id: "P1", name: "Rahul Sharma", img: "https://i.pravatar.cc/150?u=rahul" ... }
```
This is placeholder data. Either connect to actual backend data or remove the page from production. External avatar CDN dependency is a runtime risk.

---

## 10. Refactor Assessment

**Verdict: B — Moderate Restructuring Required**

The application does not require a full rewrite. The foundation is sound: the data layer (`lib/data/`), authentication, server actions, rate limiting, and API routes are well-constructed. The Next.js App Router architecture is used correctly.

However, the client-side layer has accumulated significant complexity without the corresponding architectural discipline. The issues fall into three categories:

**A. Monolithic client components** — files of 800–1,300 lines containing UI, business logic, animations, filter state, and network calls simultaneously. These must be broken up. This is not optional for maintainability.

**B. Performance anti-patterns** — inline CSS-in-JS `@keyframes`, unguarded API calls on every mount, `setState` in render body, no `loading.tsx` files. These are individual fixes, not architectural changes.

**C. Incomplete features** — `MsMrRgukt` contains fake data, `gallery.ts` has no cache, and `demo/cards` is accessible in production. These are gaps that need to be closed before launch.

The scope of work is approximately:
- **2–3 days** to fix Priority 1 critical issues.
- **3–5 days** to implement Priority 2 high-impact items.
- **1–2 weeks** to fully split the monolithic components.

A full frontend rewrite is unnecessary and would be counterproductive.

---

## 11. Production Readiness Scores

### Performance — 52/100

The landing page loads 720 frames plus a Three.js intro before any content is interactive. The home page runs a full WebGL solar system. Seven source files exceed 700 lines. Multiple APIs fire on every page mount without client-side caching. These issues will produce poor Core Web Vitals (LCP, TBT) on real hardware, especially mid-range mobile devices that are likely the primary audience for a college fest.

Key positives: `unstable_cache` on data fetchers, `dynamic()` for Three.js components, ISR on applicable routes, Redis cache on scores API, and image format optimization in `next.config.ts`.

### Security — 78/100

Strong results here. Security headers are comprehensive (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy). Rate limiting is implemented on login (`5/15min`), registration, and server actions. JWT with 7-day maxAge is reasonable. Auth middleware correctly gates all `/home/**` routes. Bcrypt is used for password hashing. Input validation uses `zod` in server actions.

Deductions: CSP uses `'unsafe-eval'` and `'unsafe-inline'` for scripts (required by Three.js and GSAP), reducing XSS protection. `any` typing in server actions removes type-level injection protection. `console.log` statements remain in `auth.ts` during production builds, potentially leaking email addresses to logs.

### Maintainability — 45/100

The pervasive use of `any` typing (`userProfile`, `neonStats`, `myProfile` etc.) in props, server actions, and page components eliminates TypeScript's primary benefit. Seven files over 700 lines with mixed UI/logic/data concerns are difficult to review, test, or extend. Two duplicate `CircularGallery` components and hardcoded data arrays duplicated between `GalleryClient` and `BranchDetailClient` indicate copy-paste development patterns. No unit or integration tests exist in the repository.

### Scalability — 58/100

`getPublishedEvents(250)` is called from three different pages independently. `force-dynamic` on CadetHub disables the Next.js cache for one of the most complex pages. The DB connection pool is intentionally limited to `max: 1` (required by Supabase pooler), which will cause request queuing under concurrent load. `SectorHeader` fires DB queries on every page mount by every logged-in user. Redis is used for rate limiting and scores caching, which is good — but it has no fallback to in-memory rate limiting if Redis is unavailable at launch time, only a `console.warn` and a pass-through.

### Production Readiness — 54/100

The app is deployable but not ready for a high-traffic event launch. The `demo/` page is exposed. Multiple pages contain placeholder data. The landing page performance will fail Core Web Vitals on mobile. There are no `loading.tsx` skeleton screens so users see blank routes during data fetching. The database connection is limited to 1-pool connection, which may queue under load from concurrent student registrations during the fest. The missing gallery cache means every gallery visit hits the database.

The app is ready for **low-traffic testing and staging** but needs the Priority 1 and Priority 2 fixes listed in Section 9 before it can withstand the traffic spike of an active college fest event launch.

---

*All findings in this report are based on direct code inspection of the repository. No assumptions were made that are not backed by specific file references.*
