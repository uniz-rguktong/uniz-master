# Supabase Egress Investigation — Ornate-Ts Student App

> **Date**: 2026-03-11  
> **Project**: Ornate-Ts (Student App for EMS)  
> **Backend**: Supabase (Postgres) via Prisma ORM + Cloudflare R2 for assets  
> **Issue**: Monthly egress quota exhausted

---

## 1. Summary

The Supabase egress quota is being exhausted due to a combination of **7 critical issues** in the codebase:

1. **Unbounded gallery queries** fetching ALL images from ALL albums with no limit (`getGalleryAlbums`, `getCulturalGalleryAlbums`, `getAllCulturalImages`) — **#1 offender**
2. **`getPublishedEvents` uses `include` (not `select`)** which fetches every column from the Event table including large `customFields` JSON, `description`, `rules` text — no field selection, no limit
3. **`getSportsFixturesData` has no `take` limit on the Match sub-relation** — fetches ALL matches per sport
4. **`getPlanetLeaderboard` fetches ALL `cadetProfile` records** with no limit — unbounded full table scan
5. **Polling loops**: `useLiveScores` (30s), `CentralConsole` (60s) each hitting the database repeatedly
6. **`getMyGamificationProfile` triggers `syncCadetEnergy` on every call** which runs 4+ Prisma queries per invocation, and then runs 8 more queries — causing a cascade of ~12 DB queries per Cadet Hub page load
7. **Multiple pages fetch identical data independently**: `getPublishedEvents` is called on Home, Missions, Culturals, and hologram-stats API — 4× the same unbounded query

> [!CAUTION]
> The combination of unbounded gallery queries (returning potentially hundreds of image URLs), unbounded event queries, and 30-second polling creates a multiplicative egress problem that grows with every new album, event, or user session.

---

## 2. Queries Causing High Egress

| File | Query | Problem |
|------|-------|---------|
| [gallery.ts:37](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts#L37) | `getGalleryAlbums()` — `prisma.galleryAlbum.findMany` with `include: { GalleryImage }` | **No `take` limit, no pagination, fetches ALL images in ALL albums.** Uses `include` (full columns), not `select`. No cache. Called by Gallery page. |
| [gallery.ts:192](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts#L192) | `getCulturalGalleryAlbums()` — same pattern | **No `take` limit** on albums or images. Uses `include` with `GalleryImage: { orderBy }` — fetches every image. No cache. |
| [gallery.ts:262](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts#L262) | `getAllCulturalImages()` — `prisma.galleryImage.findMany` | **No `take` limit** — fetches ALL cultural images (just URLs, but unbounded count). No cache. |
| [gallery.ts:167](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts#L167) | `getPromoVideos()` — `prisma.promoVideo.findMany` | **No `take` limit.** Uses `include` not `select`. No cache. |
| [events.ts:116](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/events.ts#L116) | `getPublishedEvents()` — `prisma.event.findMany` with `include` | **No `take` limit, uses `include` instead of `select`** — fetches ALL columns from Event table including large `customFields` JSON, `description`, `rules`. |
| [sports.ts:425](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/sports.ts#L425) | `getSportsFixturesData()` — Match sub-query | Missing `take` on `Match` relation — fetches **ALL matches per sport** with no cap. |
| [gamification.ts:234](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/actions/gamification.ts#L234) | `getPlanetLeaderboard()` — `prisma.cadetProfile.findMany` | **No limit** — fetches ALL cadet profiles to aggregate by branch. Full table scan. |
| [stalls.ts:18](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/stalls.ts#L18) | `getStalls()` — `prisma.stall.findMany` | **No `select`** — fetches all columns from Stall table. |
| [stalls.ts:61](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/stalls.ts#L61) | `getStallsPromoVideos()` — `prisma.promoVideo.findMany` | **No `take` limit.** Uses `include`. No cache. |
| [videos.ts:15](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/videos.ts#L15) | `getPromoVideos()` (videos.ts) — `prisma.promoVideo.findMany` | **No `take` limit**, no `select` — fetches all columns. |
| [winners.ts:20](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/winners.ts#L20) | `getEventWinners()` — `winnerAnnouncement.findMany` | **No `take` limit**. `positions` JSON field could be large. |
| [winners.ts:39](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/winners.ts#L39) | `getSportWinners()` — `sportWinnerAnnouncement.findMany` | **No `take` limit**. Same issue. |
| [best-outgoing.ts:21](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/best-outgoing.ts#L21) | `getBestOutgoingStudents()` — `bestOutgoingStudent.findMany` | **No `take` limit**, no `select`. Fetches all columns including `photo` URL, `achievements` array. |
| [profile.ts:79](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/actions/profile.ts#L79) | `getMyProfile()` — `prisma.user.findUnique` with `include` | Uses deep `include` chains: `Registration → Event`, `Team → Event + TeamMember`. No `select` — fetches all columns. |
| [profile.ts:238](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/actions/profile.ts#L238) | `getStudentProfileByEmail()` — deeply nested includes | 3 levels of nested `include`: `User → TeamMember → Team → SportTeam → Sport`. Massive payload per call. |

---

## 3. Components Causing Repeated Requests

| Component | Issue |
|-----------|-------|
| [CentralConsole.tsx:29-54](file:///Users/saikumar/Desktop/Ornate-Ts/src/components/CentralConsole.tsx#L29-L54) | Fetches `/api/home/hologram-stats` on mount + every **60 seconds** with `cache: 'no-store'`. This route calls `getPublishedEvents()` which is the unbounded events query. Every user session generates ~1440 requests/day. |
| [useLiveScores.ts:37-47](file:///Users/saikumar/Desktop/Ornate-Ts/src/hooks/useLiveScores.ts#L37-L47) | Polls `/api/scores` every **30 seconds** via `setInterval`. Every user on the sports page generates ~2880 requests/day. |
| [UpdatesTicker.tsx:9-22](file:///Users/saikumar/Desktop/Ornate-Ts/src/components/UpdatesTicker.tsx#L9-L22) | Fetches `/api/scores` on mount. Used in branch/club detail pages, meaning the same scores data can be fetched by multiple components simultaneously. |
| [gamification.ts:257-267](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/actions/gamification.ts#L257-L290) | `getMyGamificationProfile()` calls `syncCadetEnergy(user.id)` which runs **4 Prisma queries** (user+registrations+teamMembers+transactions), then `getMyGamificationProfile` runs **8 more queries** (cadetProfile, transactions, leaderboardCount, registrations, sportRegistrations, teamMembers, user+registrations, rank). **~12 DB queries per Cadet Hub page load.** |

---

## 4. Polling or Looping Requests

| Location | Interval | What it fetches | Requests/day per user |
|----------|----------|-----------------|----------------------|
| [useLiveScores.ts:41](file:///Users/saikumar/Desktop/Ornate-Ts/src/hooks/useLiveScores.ts#L41) | **30 seconds** | `GET /api/scores` → DB query for all LIVE/COMPLETED matches | **~2,880** |
| [CentralConsole.tsx:49](file:///Users/saikumar/Desktop/Ornate-Ts/src/components/CentralConsole.tsx#L49) | **60 seconds** | `GET /api/home/hologram-stats` → calls `getPublishedEvents()` (unbounded) | **~1,440** |

> [!WARNING]
> With just **10 concurrent users** on the home page, the CentralConsole alone generates **14,400 requests/day** to the database. At 30s polling, the live scores component adds another **28,800 requests/day** for 10 users. Each request returns data that traverses the Supabase → internet → client pipeline, consuming egress bandwidth.

**Non-DB polling (safe, no egress issue):**
- `fest/page.tsx` — `setInterval(tick, 1000)` — UI-only counter, no fetch
- `culturals/CulturalsClient.tsx` — `setInterval(setNow, 60000)` — UI clock, no fetch
- `RoadmapClient.tsx`, `HighlightsSection.tsx`, `PlanetaryScanner.tsx` — UI animation timers, no fetch

---

## 5. Large Payload Queries

### 🔴 Critical: `getGalleryAlbums()` — [gallery.ts:36-67](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts#L36-L67)
```typescript
// Fetches ALL albums with ALL images — no limit, no pagination
const albums = await prisma.galleryAlbum.findMany({
    where: { isArchived: false },
    include: {
        GalleryImage: { orderBy: { uploadedAt: 'desc' } }, // ALL images
        Admin: { select: { id, name, role, branch, clubId } }
    },
    orderBy: { createdAt: 'desc' },
    // NO `take` — fetches every album + every image
});
```
**Impact**: If there are 50 albums × 20 images = 1,000 image records fetched as JSON. Each record has `id`, `url`, `caption`, `albumId`, `uploadedAt`. The image URLs alone (Cloudflare R2 URLs ~100 chars each) = ~100KB just for URLs.

### 🔴 Critical: `getPublishedEvents()` — [events.ts:116-132](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/events.ts#L116-L132)
```typescript
const events = await prisma.event.findMany({
    where: { status: 'PUBLISHED' },
    include: { // 'include' fetches ALL columns
        _count: { select: { Registration: true } },
        Admin_Event_creatorIdToAdmin: { select: { branch, clubId } },
        Admin_EventCoordinators: { select: { name, phone, email } },
    },
    orderBy: { date: 'asc' },
    // NO `take` — fetches all published events
    // NO `select` — fetches ALL Event columns including large fields
});
```
**Impact**: Every `Event` row has `description`, `rules`, `customFields` (JSON), `bannerUrl`, etc. — potentially **5-10KB per event**. With 100 events, this is **500KB-1MB per query**. This query runs on Home page, Missions page, Culturals page, and hologram-stats API — **4× per page navigation path**.

### 🟡 Medium: `getStudentProfileByEmail()` — [profile.ts:238-273](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/actions/profile.ts#L238-L273)
```typescript
const userData = await prisma.user.findUnique({
    where: { email },
    include: {
        Registration: { include: { Event: { select: ... } } },
        Team: { include: { Event, TeamMember, SportTeam: { include: { Sport } } } },
        TeamMember: { include: { Team: { include: { Event, SportTeam: { include: Sport } } } } }
    },
});
```
**Impact**: 3 levels of nested includes. A user with 10 registrations, 5 teams, and team memberships generates a deeply nest JSON payload.

### 🟡 Medium: `getPlanetLeaderboard()` — [gamification.ts:234-253](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/actions/gamification.ts#L234-L253)
```typescript
const cadets = await prisma.cadetProfile.findMany({
    include: { User: { select: { branch: true } } },
    // NO `take` — fetches ALL cadet profiles
});
```
**Impact**: If 500+ students have profiles, this fetches 500+ rows just to aggregate by branch. Should use `groupBy` instead.

---

## 6. Duplicate Fetch Patterns

### `getPublishedEvents()` called from **4 different entry points**:

| Page/Route | File | Cache | Call |
|------------|------|-------|------|
| Home page | [home/page.tsx:17](file:///Users/saikumar/Desktop/Ornate-Ts/src/app/home/page.tsx#L17) | `unstable_cache` (60s) | `getPublishedEvents()` |
| Missions page | [missions/page.tsx:17](file:///Users/saikumar/Desktop/Ornate-Ts/src/app/home/missions/page.tsx#L17) | `unstable_cache` (60s) | `getPublishedEvents()` |
| Culturals page | [culturals/page.tsx:10](file:///Users/saikumar/Desktop/Ornate-Ts/src/app/home/fest/culturals/page.tsx#L10) | `unstable_cache` (60s) | `getPublishedEvents()` |
| Hologram Stats API | [hologram-stats/route.ts:70](file:///Users/saikumar/Desktop/Ornate-Ts/src/app/api/home/hologram-stats/route.ts#L70) | `revalidate: 60` + polled every 60s | `getPublishedEvents()` |

> [!NOTE]
> `getPublishedEvents()` does use `unstable_cache` with a 60s revalidation. This helps **within a single server instance**, but:
> - On Vercel/serverless, each cold function invocation rebuilds the cache
> - The hologram-stats API is polled every 60s by every active client via `CentralConsole`
> - The cache key `['published-events']` is shared, but the query itself is the full unbounded events query

### `/api/scores` fetched from **2 components independently**:
- [useLiveScores.ts](file:///Users/saikumar/Desktop/Ornate-Ts/src/hooks/useLiveScores.ts#L23) — polls every 30s
- [UpdatesTicker.tsx](file:///Users/saikumar/Desktop/Ornate-Ts/src/components/UpdatesTicker.tsx#L11) — fetches on mount

If both components are rendered on the same page, they make **duplicate requests**.

### User registration checks duplicated:
- [missions/page.tsx:24-41](file:///Users/saikumar/Desktop/Ornate-Ts/src/app/home/missions/page.tsx#L24-L41) queries `prisma.user.findUnique` with `include: { Registration, Team, TeamMember }`
- [culturals/page.tsx:23-29](file:///Users/saikumar/Desktop/Ornate-Ts/src/app/home/fest/culturals/page.tsx#L23-L29) runs the **exact same query** 

Both pages independently fetch the same user registration data when navigating between Missions → Culturals.

---

## 7. Storage / Asset Egress

### R2 Image URLs — Indirect Supabase Egress
- Images are stored on **Cloudflare R2**, not Supabase Storage, so direct image downloads don't count against Supabase egress.
- However, the **gallery queries** fetch image URL metadata from the Supabase database. Each URL string (~100 chars) × hundreds of images = significant database response payloads.

### `getGalleryAlbums()` — All Image Metadata
- [gallery.ts:37](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts#L37): Fetches `GalleryImage` records (id, url, caption, uploadedAt, albumId) for ALL images in ALL active albums.
- **No cache, no limit, no pagination** — the comment on line 34 even says: *"not suitable for caching due to 2MB limit"*

### `getAllCulturalImages()` — Unbounded URL List
- [gallery.ts:261](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts#L261): Returns ALL cultural image URLs. If there are 200 cultural images, this returns a 200-element string array on every Culturals page load.

### Certificate Downloads
- [certificates/download/[id]/route.ts](file:///Users/saikumar/Desktop/Ornate-Ts/src/app/api/certificates/download/%5Bid%5D/route.ts): Uses R2 presigned URLs for actual downloads — the binary file egress goes through R2, not Supabase. **This is not a significant Supabase egress concern.**

### `next.config.ts` Image Optimization
- [next.config.ts:24-48](file:///Users/saikumar/Desktop/Ornate-Ts/next.config.ts#L24-L48): Properly configured with `image/avif`, `image/webp` formats and R2 remote patterns. Next.js Image component handles optimization. ✅

---

## 8. Recommended Fixes

### 🔴 Fix 1: Add `take` limits and `select` to Gallery Queries

**File**: [gallery.ts](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts)

```diff
 // getGalleryAlbums — add take + limit images per album + add cache
 export async function getGalleryAlbums(): Promise<AlbumData[]> {
     const albums = await prisma.galleryAlbum.findMany({
         where: { isArchived: false },
-        include: {
-            GalleryImage: { orderBy: { uploadedAt: 'desc' } },
+        select: {
+            id: true,
+            title: true,
+            description: true,
+            coverImage: true,
+            tags: true,
+            GalleryImage: {
+                select: { id: true, url: true, caption: true },
+                orderBy: { uploadedAt: 'desc' },
+                take: 20,  // Only first 20 images per album
+            },
             Admin: {
                 select: { id: true, name: true, role: true, branch: true, clubId: true }
             }
         },
         orderBy: { createdAt: 'desc' },
+        take: 30,  // Cap total albums
     });
```

Apply the same pattern to `getCulturalGalleryAlbums()`.

For `getAllCulturalImages()`:
```diff
     const images = await prisma.galleryImage.findMany({
         where: { ... },
         select: { url: true },
-        orderBy: { uploadedAt: 'desc' }
+        orderBy: { uploadedAt: 'desc' },
+        take: 50,  // Cap at 50 images
     });
```

**Estimated savings**: ~60% reduction on Gallery page egress.

---

### 🔴 Fix 2: Switch `getPublishedEvents` from `include` to `select`

**File**: [events.ts](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/events.ts)

```diff
 export const getPublishedEvents = unstable_cache(
     async (): Promise<MissionData[]> => {
         const events = await prisma.event.findMany({
             where: { status: 'PUBLISHED' },
-            include: {
+            select: {
+                id: true,
+                title: true,
+                shortDescription: true,
+                date: true,
+                endDate: true,
+                venue: true,
+                category: true,
+                eventType: true,
+                price: true,
+                maxCapacity: true,
+                registrationOpen: true,
+                teamSizeMin: true,
+                teamSizeMax: true,
+                customFields: true,
                 _count: { select: { Registration: true } },
                 Admin_Event_creatorIdToAdmin: {
                     select: { branch: true, clubId: true }
                 },
                 Admin_EventCoordinators: {
                     select: { name: true, phone: true, email: true },
                 },
             },
             orderBy: { date: 'asc' },
+            take: 100,  // Hard cap
         });
```

**Estimated savings**: ~70% reduction per events query (eliminates `description`, `rules`, `bannerUrl`, unused columns).

---

### 🔴 Fix 3: Add `take` to `getSportsFixturesData` Match sub-query

**File**: [sports.ts](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/sports.ts)

```diff
 export async function getSportsFixturesData(): Promise<SportData[]> {
     const sports = await prisma.sport.findMany({
         where: { isActive: true },
         select: {
             ...
             Match: {
                 select: { ... },
                 orderBy: [{ date: 'asc' }, { matchOrder: 'asc' }],
+                take: 50,  // Limit matches per sport
             },
         },
         take: 50,
     });
```

---

### 🔴 Fix 4: Also add Redis cache to `getSportsFixturesData` and `getSportsScheduleData`

These two functions are the only sports data fetchers **without any cache**. They hit the DB on every page load.

```typescript
// Add the same Redis cache pattern used in getSportsStandingsData
const cacheKey = 'sports:fixtures';
const redis = await getRedis();
if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
}
// ... query ...
if (redis && data.length > 0) {
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 30); // 30s cache
}
```

---

### 🟡 Fix 5: Replace `getPlanetLeaderboard` full scan with aggregation

**File**: [gamification.ts](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/actions/gamification.ts)

```diff
 export async function getPlanetLeaderboard() {
-    const cadets = await prisma.cadetProfile.findMany({
-        include: { User: { select: { branch: true } } },
-    });
-    // ... manual aggregation in JS
+    // Use Prisma groupBy to aggregate at the database level
+    const results = await prisma.$queryRaw`
+        SELECT u.branch, SUM(cp."totalEnergy") as energy, COUNT(*)::int as cadets
+        FROM "CadetProfile" cp
+        JOIN "User" u ON u.id = cp."userId"
+        WHERE u.branch IS NOT NULL
+        GROUP BY u.branch
+        ORDER BY energy DESC
+    `;
```

**Estimated savings**: From fetching N rows (all profiles) to 5-6 rows (per branch).

---

### 🟡 Fix 6: Reduce polling frequency or use visibility-based polling

**File**: [useLiveScores.ts](file:///Users/saikumar/Desktop/Ornate-Ts/src/hooks/useLiveScores.ts)

```diff
-export function useLiveScores(pollInterval = 30000) {
+export function useLiveScores(pollInterval = 120000) { // 2 minutes instead of 30s
     ...
     useEffect(() => {
         const controller = new AbortController();
+        // Only poll when tab is visible
+        const handleVisibility = () => {
+            if (document.hidden) return;
+            fetchScores(controller.signal);
+        };
+        document.addEventListener('visibilitychange', handleVisibility);

         fetchScores(controller.signal);
         const interval = setInterval(() => fetchScores(controller.signal), pollInterval);

         return () => {
             controller.abort();
             clearInterval(interval);
+            document.removeEventListener('visibilitychange', handleVisibility);
         };
     }, [fetchScores, pollInterval]);
```

**File**: [CentralConsole.tsx](file:///Users/saikumar/Desktop/Ornate-Ts/src/components/CentralConsole.tsx)

```diff
-        const interval = window.setInterval(fetchStats, 60000);
+        const interval = window.setInterval(fetchStats, 300000); // 5 minutes
```

Or better: **remove the polling entirely** and rely on the server-side `revalidate: 60` on the hologram-stats route.

---

### 🟡 Fix 7: Deduplicate `syncCadetEnergy` from `getMyGamificationProfile`

**File**: [gamification.ts:267](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/actions/gamification.ts#L267)

```diff
     // Auto-sync on fetch to ensure data is fresh
-    await syncCadetEnergy(user.id);
+    // Sync is already triggered by server actions (register, attend, etc.)
+    // Remove auto-sync to prevent 4+ extra DB queries on every page load
```

`syncCadetEnergy` runs **4 Prisma queries** (user with deep includes + all transactions). Calling it on every Cadet Hub page load doubles the query count. The sync should only happen during actual energy-earning actions (event registration, profile update, etc.).

---

### 🟢 Fix 8: Add `select` to Stalls, Videos, Winners, Best Outgoing queries

**File**: [stalls.ts:18](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/stalls.ts#L18)
```diff
 const stalls = await prisma.stall.findMany({
     where: { status: { not: 'Vacant' } },
+    select: {
+        id: true, name: true, stallNo: true, teamName: true,
+        bidAmount: true, description: true, type: true, status: true,
+    },
     orderBy: { stallNo: 'asc' },
+    take: 50,
 });
```

**File**: [videos.ts:15](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/videos.ts#L15) — add `take: 20`

**File**: [winners.ts:20](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/winners.ts#L20) — add `take: 50`

**File**: [best-outgoing.ts:21](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/best-outgoing.ts#L21) — add `take: 20`

---

### 🟢 Fix 9: Add `take` limits and `select` to uncapped video/promo queries

**Files**: [gallery.ts:167](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts#L167), [gallery.ts:231](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/gallery.ts#L231), [stalls.ts:61](file:///Users/saikumar/Desktop/Ornate-Ts/src/lib/data/stalls.ts#L61)

All `promoVideo.findMany` calls should have `take: 20` and use `select` instead of `include`.

---

## 9. Estimated Egress Reduction

| Fix | Estimated Reduction | Rationale |
|-----|---------------------|-----------|
| Fix 1: Gallery query limits | **40-50% of gallery egress** | Prevents fetching hundreds of image records; caps at ~30 albums × 20 images |
| Fix 2: Events `select` + `take` | **60-70% of events egress** | Eliminates `description`, `rules`, `customFields` columns; ~5-10KB savings per event |
| Fix 3: Fixtures Match limit | **30-40% of fixtures egress** | Caps matches per sport at 50 instead of unlimited |
| Fix 4: Add Redis cache to uncached sports queries | **50-80% of sports hits** | Prevents repeated DB hits on popular pages |
| Fix 5: Planet leaderboard aggregation | **90-95%** | From N rows to 5-6 rows |
| Fix 6: Reduce polling | **75-85% of polling egress** | From 30s→120s and 60s→300s means 4-5× fewer requests |
| Fix 7: Remove auto-sync | **~50% of Cadet Hub queries** | Eliminates 4+ unnecessary queries per page load |
| Fix 8+9: Minor query optimizations | **10-20%** | Cumulative savings from field selection and limits |

### Overall Estimated Egress Reduction: **60-75%**

> [!IMPORTANT]
> The **highest-impact, easiest fixes** are:
> 1. Add `take` limits to gallery queries (**5 minutes of work, biggest impact**)
> 2. Switch events from `include` to `select` (**10 minutes, eliminates large JSON fields**)
> 3. Reduce polling intervals (**2 minutes, cuts thousands of daily requests**)
> 
> These 3 fixes alone could reduce egress by **50-60%**.