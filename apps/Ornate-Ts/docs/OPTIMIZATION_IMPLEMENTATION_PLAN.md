# Ornate '26 Student App — Optimization Implementation Plan

> **Source:** Production Readiness Audit (March 11, 2026)  
> **Objective:** Resolve all issues flagged in the audit to bring the app to a production-stable state before the fest launch.  
> **Current Score:** 54/100 → **Target Score:** 80+/100

---

## Table of Contents

1. [Priority Overview](#priority-overview)
2. [Phase 1: Critical Fixes](#phase-1-critical-fixes-priority-1)
3. [Phase 2: High-Impact Performance](#phase-2-high-impact-performance-priority-2)
4. [Phase 3: Moderate Improvements](#phase-3-moderate-improvements-priority-3)
5. [Verification Checklist](#verification-checklist)

---

## Priority Overview

| Priority | Count | Estimated Effort | Impact |
|----------|-------|-----------------|--------|
| Phase 1 — Critical | 6 tasks | 2–3 days | Unblocks production deployment |
| Phase 2 — High Impact | 6 tasks | 3–5 days | Significant UX + DB load reduction |
| Phase 3 — Moderate | 6 tasks | 1–2 weeks | Maintainability + long-term perf |

---

## Phase 1: Critical Fixes (Priority 1)

These issues affect every user on every page load. Fix before any production deployment.

---

### Task 1.1 — Remove Demo Route from Production

**Problem:** `/home/demo/cards` is a development test page accessible to every logged-in student.  
**File:** `src/app/home/demo/cards/page.tsx`  
**Risk:** Low code risk, high deployment risk.

**Fix:**
```tsx
import { redirect } from 'next/navigation';

export default function DemoCardsPage() {
    if (process.env.NODE_ENV === 'production') {
        redirect('/home');
    }
    // ... existing demo content ...
}
```

**Acceptance Criteria:**
- [ ] In production build, visiting `/home/demo/cards` redirects to `/home`
- [ ] In development, the page still renders normally

---

### Task 1.2 — Move Inline `@keyframes` to `globals.css`

**Problem:** `MissionsClient.tsx` injects a `<style>` block with `@keyframes` CSS via `dangerouslySetInnerHTML` on every render. This adds DOM mutation cost on every state change in the largest client component (1,324 lines).  
**File:** `src/app/home/missions/MissionsClient.tsx` → `src/app/globals.css`

**Step 1 — Identify all keyframes in MissionsClient:**

```bash
# Run to find the shimmerStyles block
grep -n "shimmerStyles\|dangerouslySetInnerHTML\|@keyframes" src/app/home/missions/MissionsClient.tsx
```

**Step 2 — Move keyframes to `globals.css`:**

Add to the bottom of `src/app/globals.css`:
```css
/* ── MissionsClient Animations ── */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes scanning {
  0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
  50% { opacity: 1; transform: scaleX(1); }
}

@keyframes float-node {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes ambient-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
```

**Step 3 — Remove from `MissionsClient.tsx`:**

Delete the `shimmerStyles` constant and the `<style dangerouslySetInnerHTML={{ __html: shimmerStyles }} />` element from the JSX return.

**Acceptance Criteria:**
- [ ] No `dangerouslySetInnerHTML` in `MissionsClient.tsx`
- [ ] Shimmer/scanning/float/pulse animations still work visually
- [ ] React DevTools shows no `<style>` node being inserted on re-renders

---

### Task 1.3 — Cache `/api/me/rank` to Stop Per-Page DB Queries

**Problem:** `SectorHeader.tsx` calls `fetch('/api/me/rank')` on every mount. The endpoint runs two Prisma queries (a `findUnique` + a `count`) with no caching. With `SectorHeader` used on 8+ pages, a single navigation session generates 8 separate DB round-trips for the same data.  
**Files:** `src/app/api/me/rank/route.ts`, `src/components/layout/SectorHeader.tsx`

**Step 1 — Add Redis caching in the route handler:**

```ts
// src/app/api/me/rank/route.ts
import { redis } from '@/lib/redis';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const cacheKey = `rank:${userId}`;

    // Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
        return NextResponse.json(JSON.parse(cached), {
            headers: { 'X-Cache': 'HIT' }
        });
    }

    // ... existing Prisma queries ...
    const result = { rank, totalEnergy, totalCadets };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));

    return NextResponse.json(result, {
        headers: {
            'Cache-Control': 'private, max-age=300',
            'X-Cache': 'MISS'
        }
    });
}
```

**Step 2 — Invalidate rank cache when energy changes:**

Find the server action(s) that call `syncCadetEnergy` or update `totalEnergy` in Prisma (likely in `src/lib/actions/`). Add cache invalidation after energy updates:
```ts
await redis.del(`rank:${userId}`);
```

**Acceptance Criteria:**
- [ ] First visit to any page with `SectorHeader` populates Redis cache
- [ ] Subsequent page navigations return `X-Cache: HIT`
- [ ] Cache is invalidated after completing a mission/earning energy
- [ ] DB query count for rank reduced from 8/session to 1–2/session

---

### Task 1.4 — Debounce Window Resize in `HomeClient.tsx`

**Problem:** The resize handler calls `setIsDesktop` on every pixel of movement, triggering full re-renders of the `HomeClient` tree (which includes `SolarSystem3D`, `MissionsPanel`, `ScannerPanel`, and 9 other memoized children).  
**File:** `src/app/home/HomeClient.tsx`

**Fix:**
```tsx
// Add ref for debounce timer at top of component
const resizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

// Replace the existing resize useEffect:
useEffect(() => {
    const handleResize = () => {
        if (resizeTimer.current) clearTimeout(resizeTimer.current);
        resizeTimer.current = setTimeout(() => {
            setIsDesktop(window.innerWidth >= 640);
        }, 150);
    };
    handleResize(); // run once on mount (no debounce needed here)
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimer.current) clearTimeout(resizeTimer.current);
    };
}, []);
```

**Acceptance Criteria:**
- [ ] Dragging the window edge does not fire rapid state updates
- [ ] Desktop/mobile layout still switches correctly at 640px
- [ ] No memory leak from the timeout ref

---

### Task 1.5 — Fix `AnimatedCounter` Anti-Pattern in `about/page.tsx`

**Problem:** The `AnimatedCounter` component in `src/app/home/about/page.tsx` calls `setState` inside the render function body (not inside `useEffect`), which schedules repeated re-renders without a stable exit condition. This is a React anti-pattern that causes unnecessary reconciliation work on the About page.  
**File:** `src/app/home/about/page.tsx`

**Fix — Replace the AnimatedCounter render-time setState with a useEffect:**
```tsx
function AnimatedCounter({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        const interval = setInterval(() => {
            setDisplay(prev => {
                const next = Math.min(prev + Math.ceil(value / 40), value);
                if (next >= value) {
                    clearInterval(interval);
                    return value;
                }
                return next;
            });
        }, 30);
        return () => clearInterval(interval);
    }, [isInView, value]);

    return <span ref={ref}>{display}</span>;
}
```

**Acceptance Criteria:**
- [ ] About page counter animates from 0 to target value when scrolled into view
- [ ] `clearInterval` is called when target is reached
- [ ] React DevTools shows no unexpected re-renders after counter completes
- [ ] `useEffect` cleanup runs on unmount

---

### Task 1.6 — Replace `<img>` with `<Image>` in Key Components

**Problem:** Multiple components use native `<img>` tags which bypass Next.js image optimization (no AVIF/WebP, no lazy loading, no responsive `srcset`). This is especially impactful on the Gallery and Fun pages where large images are loaded.

**Files to update:**

| File | `<img>` count | Priority |
|------|-------------|----------|
| `src/app/home/gallery/GalleryClient.tsx` | 8+ | High |
| `src/app/home/fun/ms-mr-rgukt/page.tsx` | ~10 | High |
| `src/components/CompanionBot.tsx` | 1 (Pingo_Bot.png) | Medium |
| `src/components/ui/display-cards.tsx` | 1–2 | Medium |
| `src/components/ui/morphing-card-stack.tsx` | 1–2 | Medium |

**Replacement pattern for external images (Unsplash/pravatar):**
```tsx
import Image from 'next/image';

// Before:
<img src={item.image} alt={item.name} className="w-full h-full object-cover" />

// After:
<Image
    src={item.image}
    alt={item.name}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, 400px"
    loading="lazy"
/>
```

**Replacement pattern for local assets:**
```tsx
// Before:
<img src="/assets/Pingo_Bot.png" alt="Pingo" width={60} height={60} />

// After:
<Image
    src="/assets/Pingo_Bot.png"
    alt="Pingo"
    width={60}
    height={60}
    priority={false}
/>
```

**For GalleryClient specifically** — the `CategoryCard` and `AlbumCard` components use `<img src={item.image}>` with Unsplash URLs. These URLs must be added to `next.config.ts` `remotePatterns` if not already present:
```ts
// next.config.ts — verify these are already in remotePatterns:
{ hostname: 'images.unsplash.com' },
{ hostname: 'i.pravatar.cc' },
```

**Acceptance Criteria:**
- [ ] No `<img>` tags remain in the 5 listed files (except where inside SVG)
- [ ] Gallery images load in WebP/AVIF format (verify in DevTools Network tab)
- [ ] Images are lazy-loaded by default (not loaded until in viewport)
- [ ] No `<Image>`-related runtime errors for missing `width`/`height` props

---

## Phase 2: High-Impact Performance (Priority 2)

These fixes significantly reduce database load and improve perceived performance. Implement after Phase 1 is complete and verified.

---

### Task 2.1 — Add `unstable_cache` to `getGalleryAlbums`

**Problem:** `src/lib/data/gallery.ts` is the only data fetcher that does NOT use `unstable_cache`. Every gallery page visit runs a raw Prisma query fetching up to 45 albums × 30 images each (1,350 image URL records in one payload).  
**File:** `src/lib/data/gallery.ts`

**Fix:**
```ts
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';

export const getGalleryAlbums = unstable_cache(
    async (limit: number = 30, imageLimit: number = 20) => {
        return prisma.galleryAlbum.findMany({
            take: limit,
            where: { isPublished: true },
            orderBy: { createdAt: 'desc' },
            include: {
                images: {
                    take: imageLimit,
                    orderBy: { order: 'asc' },
                },
            },
        });
    },
    ['gallery-albums'],
    { revalidate: 300, tags: ['gallery'] }
);
```

Also add a revalidate directive to the gallery page:
```ts
// src/app/home/gallery/page.tsx
export const revalidate = 300;
```

**Acceptance Criteria:**
- [ ] Second gallery page visit does not hit the database (check Prisma query logs)
- [ ] Cache invalidates after 5 minutes (300s)
- [ ] `revalidateTag('gallery')` can be called from admin actions to force refresh

---

### Task 2.2 — Add `loading.tsx` Skeleton Screens to Slow Routes

**Problem:** There are no `loading.tsx` files in the app, so every page shows a blank white screen during server-side data fetching. This is particularly bad for Missions (250 events), Gallery (1,350 records), and Cadet Hub (4 DB queries).

**Create the following files:**

**`src/app/home/missions/loading.tsx`**
```tsx
export default function MissionsLoading() {
    return (
        <div className="min-h-screen bg-black p-6 space-y-4">
            <div className="h-10 w-64 bg-white/5 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-48 bg-white/5 rounded-lg animate-pulse" />
                ))}
            </div>
        </div>
    );
}
```

**`src/app/home/gallery/loading.tsx`**
```tsx
export default function GalleryLoading() {
    return (
        <div className="min-h-screen bg-black p-6 space-y-4">
            <div className="h-10 w-48 bg-white/5 rounded animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
                ))}
            </div>
        </div>
    );
}
```

**`src/app/home/cadet-hub/loading.tsx`**
```tsx
export default function CadetHubLoading() {
    return (
        <div className="min-h-screen bg-black p-6 space-y-6">
            <div className="h-12 w-72 bg-white/5 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
                ))}
            </div>
            <div className="h-96 bg-white/5 rounded-lg animate-pulse" />
        </div>
    );
}
```

Style these to match the app's dark/neon aesthetic. Add `Orbitron` font class and appropriate glow borders to match the existing design language.

**Acceptance Criteria:**
- [ ] Navigating to `/home/missions` shows skeleton immediately while data loads
- [ ] Navigating to `/home/gallery` shows skeleton immediately
- [ ] Navigating to `/home/cadet-hub` shows skeleton immediately
- [ ] Skeletons are visually consistent with the dark/neon theme
- [ ] No flash of unstyled content (FOUC) between loading and loaded states

---

### Task 2.3 — Convert Static `'use client'` Pages to Server Components

**Problem:** `sponsors/page.tsx` (417 lines) and the top section of `about/page.tsx` (463 lines) are `'use client'` pages despite having no dynamic data. Marking them `'use client'` disables SSR entirely, sends more JavaScript to the browser, and prevents streaming.

**`sponsors/page.tsx` — Full conversion:**

1. Remove `'use client'` directive from the top of the file.
2. Extract only the motion-animated sections into a new `SponsorsMotion.tsx` client component:
```tsx
// src/app/home/sponsors/SponsorsMotion.tsx
'use client';
import { motion } from 'framer-motion';
// ... motion-only wrapper around sponsor cards ...
```
3. Keep the main `page.tsx` as a server component that renders `<SponsorsMotion />`.

**`about/page.tsx` — Partial conversion:**

1. Remove `'use client'` from `about/page.tsx`.
2. Extract `AnimatedCounter` and `useScroll`/`useTransform` usage into `AboutMotionSections.tsx`.
3. The static text content (title, mission text, team names) renders server-side and streams to the browser immediately.

**Acceptance Criteria:**
- [ ] `sponsors/page.tsx` has no `'use client'` directive
- [ ] Sponsor page still renders all motion animations correctly
- [ ] `about/page.tsx` has no top-level `'use client'` directive
- [ ] Static text on About page is visible in page source (server-rendered)
- [ ] No runtime errors from hooks used outside client components

---

### Task 2.4 — Reduce `SolarSystem3D` Polygon Count and Lights

**Problem:** Each planet uses `sphereGeometry args={[size, 64, 64]}` (4,096 triangles per sphere) and a personal `pointLight`. The home page runs this for 8+ planets simultaneously, with `useFrame` updating all orbits every RAF tick.  
**File:** `src/components/SolarSystem3D.tsx`

**Step 1 — Reduce sphere geometry segments:**
```tsx
// Before:
<sphereGeometry args={[size, 64, 64]} />

// After:
<sphereGeometry args={[size, 32, 32]} />
```
This halves the triangle count per planet (from 4,096 to 1,024 triangles) with minimal visual difference once textures are applied.

**Step 2 — Replace per-planet `pointLight` with shared scene lighting:**
```tsx
// Before — inside each Planet component:
<pointLight intensity={0.8} distance={50} />

// After — once in the parent Canvas:
<ambientLight intensity={0.4} />
<directionalLight position={[10, 10, 5]} intensity={1.2} />
// Remove all pointLight from Planet components
```

**Step 3 — Verify no visual regression** by comparing screenshots before/after.

**Acceptance Criteria:**
- [ ] Planet geometry changed to `[size, 32, 32]` for all planets
- [ ] No per-planet `pointLight` remains
- [ ] Scene uses shared `ambientLight` + `directionalLight`
- [ ] Planets still look visually correct with textures applied
- [ ] Frame rate on the home page improves (check with Chrome DevTools Performance tab)

---

### Task 2.5 — Add Cache-Control Headers to Hologram-Stats API

**Problem:** `CentralConsole.tsx` fetches `/api/home/hologram-stats` on every home page mount with no cache. The underlying data fetcher (`getPublishedEvents(200)`) is `unstable_cache`'d on the server, but the HTTP response has no caching headers, so the browser fetches it fresh every visit.  
**File:** `src/app/api/home/hologram-stats/route.ts`

**Fix:**
```ts
// In the route.ts GET handler, update the return statement:
return NextResponse.json(result, {
    headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
});
```

This tells:
- `s-maxage=60` — CDN/edge caches result for 60 seconds
- `stale-while-revalidate=300` — serve stale while regenerating for up to 5 minutes
- Browser will also cache the response for 60 seconds, skipping the `fetch` on navigation

**Acceptance Criteria:**
- [ ] Second home page visit within 60 seconds shows `from cache` in DevTools Network tab
- [ ] `CentralConsole` still displays accurate stats
- [ ] No stale data visible beyond 5 minutes

---

### Task 2.6 — Fix CadetHub Force-Dynamic (Switch to ISR + Client Auth Fetch)

**Problem:** `src/app/home/cadet-hub/page.tsx` has `export const dynamic = 'force-dynamic'`, which disables all ISR and runs 4 parallel Prisma queries on every visit. The leaderboard and planet stats are not user-specific, but `myProfile` is.

**Step 1 — Split server and client data concerns:**

Public data (leaderboard, planet stats, NeonCore totals) → ISR with `revalidate = 60`  
User-specific data (`myProfile`) → client-side fetch after mount

**Step 2 — Update `page.tsx`:**
```ts
// src/app/home/cadet-hub/page.tsx
// Remove:
export const dynamic = 'force-dynamic';

// Add:
export const revalidate = 60;

// In the page component, pass myProfile as null initially:
const [neonStats, leaderboard, planetLeaderboard] = await Promise.all([
    getNeonCoreStats(),
    getLeaderboard(50),
    getPlanetLeaderboard(),
]);
// Remove getMyGamificationProfile() from server fetch
```

**Step 3 — Add a client-side fetch for `myProfile` in `CadetHubClient.tsx`:**
```tsx
// At top of CadetHubClient component:
const [myProfile, setMyProfile] = useState<CadetProfile | null>(null);
useEffect(() => {
    fetch('/api/me/gamification')
        .then(r => r.json())
        .then(setMyProfile);
}, []);
```

**Step 4 — Create `/api/me/gamification/route.ts`** if it doesn't exist, returning the authenticated user's gamification profile.

**Acceptance Criteria:**
- [ ] `force-dynamic` removed from `cadet-hub/page.tsx`
- [ ] Public leaderboard data is ISR-cached (60s revalidate)
- [ ] User's own profile loads via client-side fetch after page mount
- [ ] No regression in displaying personal rank/energy/badges
- [ ] Second visit within 60 seconds serves from ISR cache (no DB hit for leaderboard)

---

## Phase 3: Moderate Improvements (Priority 3)

These improve long-term maintainability and further reduce bundle sizes. Implement after Phase 2.

---

### Task 3.1 — Split `MissionsClient.tsx` (1,324 lines)

**Problem:** The entire Missions UI — filter bar, 3 view modes, registration modal, team management — is in a single 1,324-line file. This cannot be code-split by the Next.js bundler and is difficult to maintain.

**Target file structure:**
```
src/app/home/missions/
  MissionsClient.tsx       ← Orchestrator only (~200 lines, imports sub-components)
  components/
    MissionsFilterBar.tsx  ← Search input + multi-level filter dropdown
    MissionCard.tsx        ← Single mission grid/list/stack card (shared)
    MissionDetailModal.tsx ← Full-screen event detail + registration trigger
    MissionRegister.tsx    ← Multi-step team create/join/confirm flow
```

**Extraction order:**

1. **`MissionDetailModal.tsx`** — extract the modal that opens when a mission is clicked. It's a large self-contained section with its own state (`step`, `teamCode`, `registeredTeams`).
2. **`MissionsFilterBar.tsx`** — extract the dropdown filter and search. Accepts `filters` state and `setFilters` as props.
3. **`MissionCard.tsx`** — extract the card rendering into a pure presentational component accepting a `mission` prop.
4. **`MissionsClient.tsx`** — becomes an orchestrator: imports `MissionsFilterBar`, `MissionCard`, `MissionDetailModal`, manages top-level state, handles `filteredMissions` with `useMemo`.

**Add `useMemo` to `filteredMissions` during refactor:**
```tsx
const filteredMissions = useMemo(() => {
    return events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || event.category === selectedCategory;
        const matchesType = selectedType === 'ALL' || event.eventType === selectedType;
        return matchesSearch && matchesCategory && matchesType;
    });
}, [events, searchQuery, selectedCategory, selectedType]);
```

**Acceptance Criteria:**
- [ ] `MissionsClient.tsx` is under 250 lines after refactor
- [ ] All extracted components are under 300 lines each
- [ ] `filteredMissions` is wrapped in `useMemo`
- [ ] Full mission filtering, detail view, and registration flow still works
- [ ] No regression in 3 view modes (grid / list / stack)

---

### Task 3.2 — Split `GalleryClient.tsx` (1,173 lines)

**Problem:** Album browser, lightbox viewer, photo grid, search/filter, and static config arrays are all in a single 1,173-line file.

**Target file structure:**
```
src/app/home/gallery/
  GalleryClient.tsx         ← Orchestrator (~200 lines)
  components/
    GalleryFilterBar.tsx    ← Category tabs + search input
    GalleryAlbumGrid.tsx    ← Album card grid view
    GalleryAlbumViewer.tsx  ← Drill-in album photo view
    GalleryLightbox.tsx     ← Full-screen photo lightbox overlay
```

**Separate the hardcoded static config:**

The `BRANCHES` and `CLUBS` arrays in `GalleryClient.tsx` (used for category images) are duplicated from `BranchDetailClient.tsx`. Move them to a shared constants file:
```
src/lib/data/branch-constants.ts  ← shared BRANCHES and CLUBS arrays
```
Import from both `GalleryClient` and `BranchDetailClient`.

**Acceptance Criteria:**
- [ ] `GalleryClient.tsx` is under 250 lines
- [ ] `BRANCHES` / `CLUBS` arrays exist only once in the codebase
- [ ] Lightbox, album drill-in, and photo grid all still work
- [ ] No visual regression

---

### Task 3.3 — Remove Unused `CircularGallery` Duplicate

**Problem:** Two versions of the same component exist:
- `src/components/CircularGallery.tsx` (633 lines)
- `src/components/ui/CircularGallery.tsx` (768 lines)

The `ui/` version is what gets dynamically imported in production (by `CulturalsClient`, `clubs/[slug]`). The root-level `CircularGallery.tsx` appears unused.

**Steps:**

1. Confirm no imports point to `src/components/CircularGallery.tsx`:
```bash
grep -r "from.*components/CircularGallery" src/ --include="*.tsx" --include="*.ts"
```

2. If only `components/ui/CircularGallery` is imported, delete the duplicate:
```bash
# Only after confirming zero imports in step 1
del src\components\CircularGallery.tsx
```

3. If both are imported from different places, migrate all import sites to `src/components/ui/CircularGallery.tsx` and then delete the duplicate.

**Acceptance Criteria:**
- [ ] Only one `CircularGallery` file exists in the codebase
- [ ] All pages using `CircularGallery` still render correctly
- [ ] No "module not found" build errors

---

### Task 3.4 — Move `CompanionBot` to `/home` Layout Only

**Problem:** `CompanionBotWrapper` is imported in the root layout (`src/app/layout.tsx`), making it globally mounted on **every** page — including the landing page (`/`), `/login`, `/terms`, and `/privacy`. The bot is only relevant inside `/home/**`.  
**Files:** `src/app/layout.tsx` → `src/app/home/layout.tsx`

**Step 1 — Remove from root layout:**
```tsx
// src/app/layout.tsx — Remove:
import CompanionBotWrapper from '@/components/CompanionBotWrapper';
// Remove: <CompanionBotWrapper /> from the JSX
```

**Step 2 — Add to home layout:**
```tsx
// src/app/home/layout.tsx — Add:
import CompanionBotWrapper from '@/components/CompanionBotWrapper';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SidebarWrapper />
            {children}
            <CompanionBotWrapper />
        </>
    );
}
```

**Acceptance Criteria:**
- [ ] CompanionBot does not render on `/` (landing page)
- [ ] CompanionBot does not render on `/login`
- [ ] CompanionBot still renders and functions on all `/home/**` pages
- [ ] Landing page bundle size is reduced (verify CompanionBot chunk is not loaded on `/`)

---

### Task 3.5 — Add `revalidate` to Gallery and Roadmap Pages

**Problem:** `src/app/home/gallery/page.tsx` and `src/app/home/roadmap/page.tsx` have no `export const revalidate`, meaning they may re-render on every request. Once `getGalleryAlbums` has `unstable_cache` (Task 2.1), the cache will handle the DB layer — but adding explicit revalidation ensures the page route itself benefits from ISR.  
**Files:** `src/app/home/gallery/page.tsx`, `src/app/home/roadmap/page.tsx`

**Fix for gallery:**
```ts
// src/app/home/gallery/page.tsx — add at top:
export const revalidate = 300; // 5 minutes
```

**Fix for roadmap:**
```ts
// src/app/home/roadmap/page.tsx — add at top:
export const revalidate = 300; // events don't change every second
```

**Acceptance Criteria:**
- [ ] Both pages have `export const revalidate = 300`
- [ ] Vercel/deployment logs show ISR regeneration at 5-minute intervals (not on every request)

---

### Task 3.6 — Replace `i.pravatar.cc` Placeholder Data in Fun Pages

**Problem:** `src/app/home/fun/ms-mr-rgukt/page.tsx` contains hardcoded fake participants (`Rahul Sharma`, `Priya Patel`, etc.) with `i.pravatar.cc` avatar URLs. This is placeholder data that will mislead users if deployed.

**Options (choose one):**

**Option A — Connect to real DB data:**
1. Create a `ms_mr_nominees` table in the Prisma schema.
2. Create a `getNominees()` data fetcher.
3. Replace the hardcoded array with a server-side fetch.

**Option B — Hide page until data exists:**
```tsx
// src/app/home/fun/ms-mr-rgukt/page.tsx — add production guard:
if (process.env.NODE_ENV === 'production' && !process.env.MS_MR_ENABLED) {
    redirect('/home/fun');
}
```
Add `MS_MR_ENABLED=true` to `.env.local` only when the feature is ready.

**Option C — Remove from `fun/` navigation** until real data is available (hide from sidebar/menu without deleting the route).

**Recommendation:** Option B is the fastest and safest for the current timeline.

**Acceptance Criteria:**
- [ ] No `i.pravatar.cc` URLs visible in the production build
- [ ] Either real data is displayed OR the route is guarded/hidden
- [ ] No external CDN dependency for user avatars in production

---

### Task 3.7 — Optimize Landing Intro Payload (`SceneOne` + `IntroAnimation`)

**Problem:** The landing route (`/`) remains a top production bottleneck due to 720-frame canvas preloading plus a Three.js intro running before meaningful interaction. This harms LCP/TBT on mid-range mobile devices.

**Files:** `src/app/page.tsx`, `src/components/scene/SceneOne.tsx`, `src/components/scene/IntroAnimation.tsx`, `src/lib/sceneConstants.ts`

**Implementation outline:**

1. Add a mobile/low-power path that skips full frame preloading and uses a static hero fallback.
2. Lazy-start heavy animations only after first user interaction or when the section is in viewport.
3. Reduce frame budget and load progressively (e.g., critical subset first, rest on idle).
4. Gate IntroAnimation for low-end contexts (reduced-motion, narrow width, save-data hints).

**Acceptance Criteria:**
- [ ] Landing route no longer blocks first paint on full 720-frame preload
- [ ] Mobile users receive a lightweight fallback experience
- [ ] Intro animation does not run unconditionally on first load for all devices
- [ ] Measurable LCP/TBT improvement on mobile profile

---

### Task 3.8 — Eliminate High-Risk Existing `any` Types

**Problem:** The codebase still contains high-risk `any` usage in profile/rank/leaderboard/gamification paths, reducing compile-time safety in production-critical surfaces.

**Files (priority targets):** `src/app/home/cadet-hub/**`, `src/app/home/profile/**`, `src/lib/actions/**`, `src/lib/data/**`

**Implementation outline:**

1. Replace `any` with explicit interfaces/types on data returned from server actions and data fetchers.
2. Add shared types for leaderboard/profile payloads in `src/types/`.
3. Ensure page props and client component props use concrete types end-to-end.

**Acceptance Criteria:**
- [ ] No `any` remains in the listed high-risk surfaces
- [ ] `npm run build` and `npx tsc --noEmit` pass with strict typing intact
- [ ] No runtime regressions from type narrowing

---

### Task 3.9 — Validate `getCadetLevel` / `CADET_LEVELS` Inputs at Runtime

**Problem:** Client usage assumes backend gamification payload shape is always valid. Unexpected shapes can crash level rendering logic.

**Files:** `src/lib/gamification-constants.ts`, `src/app/home/cadet-hub/**`, `src/app/home/profile/**`, related API/mapper files in `src/lib/`

**Implementation outline:**

1. Add a runtime guard (zod or custom validator) for gamification payloads before calling `getCadetLevel`.
2. Provide safe fallback values when payload is incomplete.
3. Log validation failures in a non-PII way for debugging.

**Acceptance Criteria:**
- [ ] Invalid gamification payloads no longer crash UI rendering
- [ ] `getCadetLevel` is called only with validated numeric inputs
- [ ] Fallback UI renders when data shape is invalid

---

### Task 3.10 — Add `<Suspense>` Boundaries for Expensive Server Routes

**Problem:** Heavy server routes have loading screens but still lack explicit suspense boundaries around expensive data sections.

**Files (minimum):** `src/app/home/missions/page.tsx`, `src/app/home/gallery/page.tsx`, `src/app/home/cadet-hub/page.tsx`, `src/app/home/roadmap/page.tsx`

**Implementation outline:**

1. Wrap heavy server-rendered sections with `<Suspense fallback={...}>`.
2. Reuse route-level loading components where appropriate.
3. Keep fallbacks consistent with neon/dark design language.

**Acceptance Criteria:**
- [ ] Suspense boundaries exist on all listed routes
- [ ] Route transitions show immediate fallback UI while server work completes
- [ ] No hydration mismatch or waterfall regressions introduced

---

### Task 3.11 — Remove Remaining Placeholder Data Beyond MS/MR Guard

**Problem:** Placeholder/static fake entries remain in non-MS/MR surfaces (notably Fun/Gallery content), which is unsafe for production credibility.

**Files:** `src/app/home/fun/**`, `src/app/home/gallery/**`, related local data/constants files

**Implementation outline:**

1. Inventory all fake/placeholder entries (dummy names, demo photos, synthetic content).
2. Replace with real DB-backed content where available.
3. If real data is unavailable, guard/hide those sections in production.

**Acceptance Criteria:**
- [ ] No fake participant/demo records are user-visible in production
- [ ] Placeholder sections are either real-data-backed or production-gated
- [ ] No broken links/cards from removed placeholders

---

### Task 3.12 — Explicit Production Log Sanitization (`auth.ts` and Related Paths)

**Problem:** Sensitive or noisy logs (e.g., email/identity traces) may leak into production runtime logs.

**Files:** `src/lib/auth.ts`, related auth/action/api files emitting user-identifier logs

**Implementation outline:**

1. Remove direct logging of user identifiers (email, phone, IDs) in production paths.
2. Replace with redacted structured logs only where operationally necessary.
3. Add a grep-based CI check to prevent reintroducing sensitive debug logs.

**Acceptance Criteria:**
- [ ] No `console.log(email)` or equivalent PII logging remains
- [ ] Production logs contain only redacted/non-sensitive auth diagnostics
- [ ] CI/check script fails if sensitive logging patterns are reintroduced

---

## Verification Checklist

After completing all three phases, run through this checklist before declaring production-ready:

### Performance
- [ ] Lighthouse Performance score ≥ 70 on mobile for `/home/missions`
- [ ] Lighthouse Performance score ≥ 80 on desktop for `/home`
- [ ] Gallery page does not hit DB on repeat visits within 5 minutes
- [ ] `/api/me/rank` returns `X-Cache: HIT` on second page navigation
- [ ] No `dangerouslySetInnerHTML` remains in render paths
- [ ] `SectorHeader` DB query count ≤ 1 per session (not per page)
- [ ] Window resize test: dragging viewport width doesn't cause visible React re-render flicker

### Security
- [ ] `/home/demo/cards` returns redirect 302 in production
- [ ] No `console.log(email)` in `auth.ts` in production build
- [ ] No placeholder personally identifiable data (`pravatar.cc`) in production

### Rendering
- [ ] About page `AnimatedCounter` does not appear in React DevTools as "max update depth exceeded"
- [ ] `MissionsClient` React DevTools shows no `<style>` node insertion on filter state changes
- [ ] All 3 `loading.tsx` screens appear when navigating to their routes
- [ ] `CompanionBot` is absent from the landing page root component tree

### Code Quality
- [ ] `CircularGallery` duplicate removed — only one version in codebase
- [ ] `BRANCHES` / `CLUBS` arrays exist in exactly one place
- [ ] `MissionsClient.tsx` file size reduced below 300 lines
- [ ] `GalleryClient.tsx` file size reduced below 300 lines
- [ ] `sponsors/page.tsx` has no `'use client'` directive
- [ ] `about/page.tsx` has no top-level `'use client'` directive

### Build
- [ ] `npm run build` completes successfully with no TypeScript errors
- [ ] `npm run lint` returns 0 errors
- [ ] No `any` types introduced by this optimization work
- [ ] Bundle analyzer (if installed) shows no AWS SDK in client chunks

---

*This plan targets the issues identified in `PRODUCTION_READINESS_AUDIT.md`. Work items reference the same file/line evidence from the audit. Do not implement tasks beyond this scope without a new audit cycle.*
