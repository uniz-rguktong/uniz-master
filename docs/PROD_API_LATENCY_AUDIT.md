# Production API Latency Audit & Sub-500ms Plan

**Status:** Audit complete — fixes not started  
**Date:** 2026-06-26  
**Target:** All production API routes sub-500ms (p95)  
**Audit script:** `scripts/ops/audit-prod-latency.py`  
**Full action plan:** `docs/SUB_500MS_ACTION_PLAN.md`  
**Authenticated test script:** `scripts/ops/test-student-apis.sh`  
**Auth latency audit:** `scripts/ops/audit-auth-latency.py`  
**Master suite:** `scripts/run-latency-suite.sh`

---

## Executive Summary

| Category | Status |
|----------|--------|
| **Critical path APIs** (auth, profile, cms, academics, requests, files, mail, notifications, grievance) | All **8–25ms** — well under 500ms |
| **Primary offender** | **`docs` service — ~1,100–1,400ms** on cold health probe |
| **Aggregate health** | **`/system/health` cold ~636–1,423ms** (blocked by docs); cached ~7–10ms |
| **Authenticated student/admin APIs** | **Not yet profiled** — needs JWT + Turnstile login |

Only **one service** clearly violates the 500ms target today. Everything else on the health/gateway path is fast.

---

## How the Audit Was Run

Audited against **production** from the VPS:

```bash
curl -sk -H "Host: api-uniz.rguktong.in" "https://127.0.0.1/api/v1/..."
```

This bypasses broken external SSL on `api-uniz.rguktong.in` through Cloudflare Tunnel. External HTTPS to the API subdomain was failing with SSL handshake errors at audit time, so browser/mobile latency from the public internet was **not** measured directly.

Re-run from VPS:

```bash
python3 scripts/ops/audit-prod-latency.py
```

Or in-cluster breakdown:

```bash
curl -sk -H "Host: api-uniz.rguktong.in" \
  "https://127.0.0.1/api/v1/system/health?t=$(date +%s)"
```

---

## Measured Latency (Production, Gateway Path)

### Individual service health via `/api/v1/{service}/health`

| Service | Avg latency | vs 500ms |
|---------|-------------|----------|
| auth | ~3–15ms | OK |
| profile | ~14ms | OK |
| cms | ~13ms | OK |
| academics | ~15ms | OK |
| requests | ~14ms | OK |
| files | ~8ms | OK |
| mail | ~12ms | OK |
| notifications | ~14ms | OK |
| grievance | ~14ms | OK |
| cron | ~15ms | OK |
| **docs** | **~1,100–1,400ms (cold)** | **SLOW** |

### Public-ish endpoints

| Endpoint | Latency | Notes |
|----------|---------|-------|
| `GET /api/v1/cms/banners/public` | ~3–14ms | OK |
| `GET /api/v1/cms/notifications` | ~3ms | OK |
| `GET /api/v1/system/health` (cached) | ~7–10ms | OK |
| `GET /api/v1/system/health` (cold) | **~636–1,423ms** | SLOW — docs dominates |

### In-cluster direct probe (docs)

| URL | Latency |
|-----|---------|
| `http://uniz-docs-service:3333/health` | ~585ms |
| `http://uniz-docs-service:3333/` | Similar slow path via `mint dev` |

---

## Root Cause: Docs Service

The docs container runs a **Mintlify dev server in production**:

```dockerfile
# apps/uniz-docs/Dockerfile
CMD (mint dev --port 4000 --no-open &) && socat TCP-LISTEN:3333,fork,reuseaddr TCP:127.0.0.1:4000
```

The gateway health check hits docs at **`/`** (not `/health`), which triggers the full Mint dev SSR pipeline:

```typescript
// apps/uniz-gateway/src/index.ts (~line 246)
const path = name === "docs" ? "/" : "/health";
await internalClient.get(`${url.replace(/\/$/, "")}${path}`);
```

Docs is marked optional in the aggregate, but **`Promise.all` still waits for it**, so cold `/system/health` is as slow as the slowest probe (~1.4s).

---

## Secondary Issues (Not Latency Blockers Today)

### 1. `serviceMap.cron` bug

Cron health may probe outpass instead of cron:

```typescript
// apps/uniz-gateway/src/index.ts (~line 159)
cron:
  process.env.OUTPASS_SERVICE_URL ||
  process.env.CRON_SERVICE_URL ||
  "http://uniz-outpass-service.default.svc.cluster.local:3003",
```

Cron showed ~15ms in the latest run (likely outpass `/health`), so this is a **correctness bug**, not the current latency culprit.

### 2. `cms` shares `USER_SERVICE_URL` with profile

Intentional alias to user service — not a separate bottleneck.

### 3. External SSL on `api-uniz.rguktong.in`

Blocks running `scripts/ops/audit-prod-latency.py` from outside the VPS until tunnel/Total TLS is fixed.

### 4. Authenticated endpoints not audited

`scripts/ops/test-student-apis.sh` exists but was not run. Academics/grades/attendance/DB-heavy paths may behave differently under load.

---

## Fix Plan (Ordered, One-by-One)

### Phase 0 — Baseline & Monitoring (~1 hour)

1. Commit and wire **`scripts/ops/audit-prod-latency.py`** into deploy or a weekly cron on the VPS.
2. Fix external SSL on `api-uniz.rguktong.in` (Total TLS or tunnel ingress config) so prod can be measured from anywhere.
3. Run authenticated audit with `scripts/ops/test-student-apis.sh` using a prod student JWT — capture p50/p95 for top 20 mobile app routes.

**Success criteria:** Repeatable audit script; full external HTTPS access to API.

---

### Phase 1 — P0: Fix docs (~1.4s → target <50ms)

**Expected impact:** Fixes the only service over 500ms; cold `/system/health` should drop from ~1.4s to ~20–50ms.

| Step | Change | Effort |
|------|--------|--------|
| 1a | Replace `mint dev` with **`mint build` + static server** (nginx, `serve`, or Mint static output) in `apps/uniz-docs/Dockerfile` | Medium |
| 1b | Add lightweight **`GET /health`** returning `{ status: "ok" }` without rendering docs | Small |
| 1c | Change gateway probe from `/` → **`/health`** for docs | Small |
| 1d | Deploy and re-run audit; confirm docs <50ms cold | Verify |

**Key files:**

- `apps/uniz-docs/Dockerfile`
- `apps/uniz-gateway/src/index.ts` (health probe path)

---

### Phase 2 — P1: Harden `/system/health` Aggregate

**Expected impact:** Even if docs regresses, health stays fast.

| Step | Change |
|------|--------|
| 2a | Probe optional services (docs) with a **shorter timeout** (e.g. 200ms) — don't let them block the aggregate |
| 2b | Or run optional probes **fire-and-forget** / exclude from `Promise.all` critical path |
| 2c | Consider increasing cache TTL from **2s → 10–30s** for dashboard polling |
| 2d | Re-measure cold `/system/health` — target **<100ms** |

**Key file:** `apps/uniz-gateway/src/index.ts` (health cache + probe logic)

---

### Phase 3 — P2: Gateway Config Fixes

| Step | Change |
|------|--------|
| 3a | Fix `serviceMap.cron` to use **`CRON_SERVICE_URL` first**, fallback to `uniz-cron-service:3008` |
| 3b | Verify cron health reports `uniz-cron-service` not outpass |

**Key file:** `apps/uniz-gateway/src/index.ts` (`serviceMap`)

---

### Phase 4 — P3: Authenticated Endpoint Audit

After Phase 0 external access + JWT:

1. Run `test-student-apis.sh` against prod with 5 runs per endpoint.
2. Flag any route with **p95 > 500ms**.
3. Likely suspects if any are slow:
   - Academics: grades, attendance, timetable (DB joins)
   - Bulk upload endpoints (`apps/uniz-user/src/controllers/bulk.controller.ts`)
   - File upload/download via files service
4. Fix slow routes one-by-one: add indexes, reduce N+1 queries, pagination, response caching.

**Success criteria:** All audited student-facing routes p95 < 500ms.

---

### Phase 5 — Infra (Parallel, Not API Code)

| Item | Why |
|------|-----|
| Enable **Total TLS** for `www.*` nested hosts | Fixes SSL handshake on www subdomains |
| Confirm Cloudflare Tunnel routing for `api.uniz` | Enables external prod latency testing |
| Optional: CDN cache for public CMS banners | Already fast; low priority |

---

## Recommended Execution Order

```
Phase 1 (docs)  →  Phase 2 (health aggregate)  →  Phase 3 (cron map)  →  Phase 4 (auth APIs)
         ↑
    biggest win (~1.3s saved)
```

**Bottom line:** Production APIs are already fast except **docs**. Fixing the docs Dockerfile and health probe should get sub-500ms on all currently measured endpoints. The remaining risk is **unaudited authenticated routes**, which Phase 4 covers.

---

## Related Infrastructure Context (2026-06-26)

- VPS: `root@76.13.241.174`, repo at `/root/uniz-master-main`
- Cloudflare Tunnel: `uniz-vps` (healthy); main hosts proxied via tunnel
- Deploy: self-hosted GitHub Actions runner on VPS (`self-hosted, linux, uniz-vps`)
- `www.*` nested hosts may still need Total TLS for edge SSL

---

## Checklist When Resuming Work

- [ ] Re-run `scripts/ops/audit-prod-latency.py` and compare to baseline above
- [ ] Confirm external `https://api-uniz.rguktong.in` SSL works
- [ ] Phase 1: docs static build + `/health` probe
- [ ] Phase 2: optional-service timeout on aggregate health
- [ ] Phase 3: fix `serviceMap.cron`
- [ ] Phase 4: authenticated endpoint audit with prod JWT
- [ ] Update this doc with post-fix measurements
