# Sub-500ms Action Plan (Peak Load + DDoS Resilience)

**Target:** All production API routes **p95 < 500ms** from a real student device/browser (not just VPS origin).

**Prod API base:** `https://api-uniz.rguktong.in/api/v1`  
**Portal:** `https://uniz.rguktong.in`  
**VPS:** Mumbai (`76.13.241.174`) — same country as users  
**Path today:** Browser → Cloudflare edge → **Tunnel** → nginx → k8s gateway → service

---

## Key finding (2026-06-27)

| Where measured | `/profile/student/me` | `/academics/grades` | `/academics/attendance` |
|----------------|--------------------|-----------------------|-------------------------|
| **VPS origin** (`127.0.0.1`) | **15ms** | **16ms** | **14ms** |
| **External** (through CF tunnel) | **845ms p95** | **1983ms p95** | **1864ms p95** |

**Backend is already fast.** External slowness is almost entirely **edge + tunnel + round-trip overhead**, not Postgres or academics logic.

The Python audit script opens a **new TLS connection per request** (worst case). Browsers reuse HTTP/2 — real UX is better than the audit table, but still dominated by Cloudflare path cost until we optimize edge/round-trips.

---

## Current state

| Layer | Status |
|-------|--------|
| Edge SSL + tunnel | Fixed hostnames (`api-uniz`, `www.rguktong.in`) |
| K8s / 14 deployments | All 1/1 READY |
| **Origin student APIs** | **12–18ms** — done |
| **External student APIs** | **700–2000ms p95** — needs Phase 4/5 |
| **`/system/health` cold** | **~2.1s** (docs) — Phase 1 deployed in `34c82c5`, verify after GHA |
| Phase 0 auth audit | **Done** (`O210008`, 2026-06-27) |
| Portal preconnect API | Added in next push |

### Phase 0 auth snapshot (external, 5 runs each)

| Route | p95 | HTTP |
|-------|-----|------|
| `/academics/grades` | 1983ms | 200 |
| `/academics/attendance` | 1864ms | 200 |
| `/profile/student/me` | 845ms | 200 |
| `/academics/seating/student` | 842ms | 200 |
| `/system/health` | 843ms | 200 |

14/14 flagged SLOW externally; **0/5 hot paths SLOW at origin.**

---

## How to get sub-500ms **externally** (real users)

Backend tuning (Redis, indexes) helps **under load** but will **not** fix 800ms+ from tunnel/edge alone. Do these in priority order:

### Tier 1 — Round-trip reduction (biggest wins, low/medium effort)

| # | Action | Expected impact | Cost |
|---|--------|-----------------|------|
| 1 | **`preconnect` + `dns-prefetch` to `api-uniz.rguktong.in`** on portal | Saves 100–300ms on first API call after page load | Free |
| 2 | **Student bootstrap API** — one `GET /student/bootstrap` returns profile + grades summary + attendance summary | 3–5 round trips → 1 | Dev time |
| 3 | **Parallel fetches** on dashboard mount (`Promise.all`) — audit/fix any waterfalls | Cuts wall-clock, not per-request p95 | Free |
| 4 | **Client cache** (already partial in `useStudentData`) — extend TTL for grades/attendance during results window | Repeat navigations feel instant | Free |
| 5 | **Deploy Phase 1 docs `/health`** | Fixes cold `/system/health` externally | Free |

### Tier 2 — Cloudflare path optimization

| # | Action | Expected impact | Cost |
|---|--------|-----------------|------|
| 6 | **Cache public GETs at edge** — `Cache-Control` on `/cms/banners/public`, static assets; CF cache rule | Public routes < 50ms globally | Free |
| 7 | **Review CF security on API** — Bot Fight / Super Bot Fight / aggressive WAF on `api-uniz` adds latency; allowlist portal Origin | 50–500ms if misconfigured | Free |
| 8 | **Tunnel tuning** — `http2Origin: true`, keep-alive in cloudflared config | 20–80ms per request | Free |
| 9 | **HTTP/3** — ensure enabled on zone (default) | Minor on mobile | Free |

### Tier 3 — Architecture (if Tier 1–2 not enough)

| # | Action | Expected impact | Cost |
|---|--------|-----------------|------|
| 10 | **Grey-cloud API** (DNS-only A → Mumbai IP, nginx TLS) — same pattern as `www.uniz` fix | Removes tunnel hop; **largest external win**; exposes origin IP | Free |
| 11 | **Cloudflare Worker** at edge for cacheable authenticated reads (short TTL + cache key on student id) | Complex; 50–200ms for cache hits | Workers free tier |
| 12 | **Argo Smart Routing** | Better path selection | ~$5/mo + usage |
| 13 | **Second POP / CDN** for static portal assets only | Portal TTFB, not API | Varies |

### What **not** to prioritize first

- Postgres indexes for grades/attendance (origin already 16ms)
- More k8s replicas for read latency (not CPU-bound today)
- Mint static export for docs (helps health only, not student APIs)

---

## Verification toolkit

| Script | Purpose |
|--------|---------|
| `scripts/run-latency-suite.sh` | Master runner |
| `scripts/audit-prod-latency.py` | Public / health (`INSECURE_SSL=1` on macOS) |
| `scripts/audit-auth-latency.py` | Authenticated routes (`TOKEN`, `STUDENT_USER`) |
| `scripts/test-student-apis.sh` | Smoke + per-request ms |
| `scripts/peak-load-profile.sh` | Peak-traffic profile |

### Measure like a browser (external)

```bash
# External (through Cloudflare — realistic for users)
export TOKEN='<student_token>'
export STUDENT_USER=O210008
export INSECURE_SSL=1
python3 scripts/audit-auth-latency.py

# Origin (server only — confirms backend is fast)
ssh root@76.13.241.174
BASE_URL=https://127.0.0.1/api/v1 TOKEN='...' python3 scripts/audit-auth-latency.py
```

---

## Phased execution

```
Phase 0 ✅ measure
Phase 1 ✅ docs /health + gateway (deployed 34c82c5)
Phase 3 ✅ gateway cron + cache (deployed 34c82c5)
Phase 5 → external round-trip (preconnect, bootstrap API, CF cache, tunnel tune)
Phase 2 → Redis/indexes (only if origin p95 rises under peak load)
Phase 4 → peak/DDoS simulation + rate limits
```

### Phase 5 — External sub-500ms (NEW, current focus)

- [x] Portal `preconnect` to API
- [ ] Verify Phase 1 deploy: cold `/system/health` < 100ms external
- [ ] Add `GET /api/v1/student/bootstrap` (profile + grades + attendance in one response)
- [ ] CF cache rule for `/cms/banners/public`
- [ ] Audit CF Bot Fight / WAF on `api-uniz` subdomain
- [ ] cloudflared `http2Origin` + keep-alive
- [ ] Optional: grey-cloud `api-uniz` if tunnel hop still > 300ms after above

**Exit criteria:** External p95 < 500ms for profile, grades, attendance on 4G from India.

---

## Success metrics

| Metric | Target |
|--------|--------|
| Origin student reads | p95 < 50ms ✅ today |
| **External student reads** | **p95 < 500ms** ← main gap |
| Login (Turnstile + API) | p95 < 800ms |
| `/system/health` cold | p95 < 100ms after Phase 1 |
| Peak 2× concurrency | origin p95 < 500ms; external within Tier 1–2 budget |
