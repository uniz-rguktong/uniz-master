# Sub-500ms Action Plan (Peak Load + DDoS Resilience)

**Target:** All production API routes **p95 < 500ms** during normal traffic, results day, registration spikes, and Cloudflare-proxied DDoS bursts.

**Prod API base:** `https://api-uniz.rguktong.in/api/v1`  
**Portal:** `https://uniz.rguktong.in`  
**Baseline audit:** `docs/PROD_API_LATENCY_AUDIT.md` (2026-06-26)  
**Phase 0 refresh:** 2026-06-27 (public probes on VPS — see below)

---

## Current state (post www + api-uniz fixes)

| Layer | Status |
|-------|--------|
| Edge SSL + tunnel | Fixed (`api-uniz.rguktong.in`, `www.rguktong.in`) |
| K8s / 14 deployments | All 1/1 READY |
| Public health probes (gateway-routed) | **p95 ~320–402ms** — under 500ms |
| **`/system/health` cold (in-cluster)** | **~2.1s** — **docs still dominates** |
| Authenticated student routes | **Not yet profiled at p95** — needs `student_token` |
| Peak / DDoS simulation | Scripts ready, not run |
| **Phase 1 + 3 code** | **In branch (not deployed):** docs nginx `/health`, gateway probe fix, cron URL fix, 15s health cache |

### Phase 0 snapshot (2026-06-27, VPS → prod)

Gateway-routed probes (5 runs, external API):

| Service | p95 |
|---------|-----|
| All critical services | 317–402ms OK |
| docs (`/docs/`) | 360ms OK (warm proxy — misleading) |

Cold aggregate via `127.0.0.1` (bypasses CF cache):

| Service | Latency |
|---------|---------|
| **docs** | **2082ms** SLOW |
| All others | 5–112ms OK |

**Conclusion:** Public API is already sub-500ms for routed health checks. The real offender remains **docs blocking cold `/system/health`**. Phase 1 implementation is started locally.

---

## Verification toolkit (do not commit secrets)

| Script | Purpose |
|--------|---------|
| `scripts/run-latency-suite.sh` | Master runner — public + auth + optional load |
| `scripts/audit-prod-latency.py` | Public / health endpoints (no auth) |
| `scripts/audit-auth-latency.py` | **Authenticated** student routes (needs `TOKEN`) |
| `scripts/mint-student-token.sh` | Obtain JWT via login (needs password + Turnstile) |
| `scripts/test-student-apis.sh` | Quick functional pass/fail on student APIs |
| `scripts/peak-load-profile.sh` | Peak-traffic profile (results / registration patterns) |
| `scripts/load_test_core.js` | Synthetic concurrent users (VPS / internal) |
| `scripts/load_test_real_students.js` | Real DB users + OTP (VPS only, invasive) |

---

## How to test authenticated routes

Production login requires **Cloudflare Turnstile** (`captchaToken`). There is no password-only bypass on prod.

### Method 1 — Browser token export (recommended for audits)

1. Sign in at `https://uniz.rguktong.in` as the test student (`O210008` / `o210008@rguktong.ac.in`).
2. DevTools → **Application** → **Local Storage** → `https://uniz.rguktong.in`
3. Copy `student_token` (JWT string).
4. Run audits:

```bash
export TOKEN='<paste student_token>'
export STUDENT_USER=O210008
python3 scripts/audit-auth-latency.py
bash scripts/test-student-apis.sh
```

Token expires (~JWT `exp`); re-export if you get 401.

### Method 2 — Login script (password + one-time captcha)

1. Sign in once in the browser; DevTools → **Network** → `login/student` → copy `captchaToken` from request body (short-lived).
2. Run:

```bash
export STUDENT_USER=O210008          # or o210008@rguktong.ac.in
export STUDENT_PASS='<password>'      # never commit
export CAPTCHA_TOKEN='<turnstile>'  # from Network tab, ~5 min TTL
eval "$(bash scripts/mint-student-token.sh)"
python3 scripts/audit-auth-latency.py
```

### Method 3 — VPS internal load test (peak simulation only)

On VPS with DB/kubectl access — creates temporary users, no Turnstile:

```bash
# On VPS only — read scripts/load_test_core.js first
CONCURRENCY=100 node scripts/load_test_core.js
```

**Do not use Method 3 for latency baseline** — synthetic users, different code paths.

### What we cannot do on prod without your help

- Automated Turnstile solve (needs real browser widget or Cloudflare test keys — prod uses live keys).
- Store student passwords in repo or scripts.

**Test account reference:** `O210008` / `o210008@rguktong.ac.in` — password via `STUDENT_PASS` env only.

---

## Phased fix plan

### Phase 0 — Measure (next session, ~2h)

1. Run public audit: `python3 scripts/audit-prod-latency.py`
2. Export `student_token` → run `python3 scripts/audit-auth-latency.py`
3. Save output: `scripts/run-latency-suite.sh --save baseline-$(date +%F).txt`
4. Flag any route with **p95 > 500ms**

**Exit criteria:** Full route matrix with p50/p95 for public + student paths.

---

### Phase 1 — P0: Docs service (~1.6s → <50ms)

| Step | Change | File(s) |
|------|--------|---------|
| 1a | ~~Replace `mint dev` with static build~~ — no `mint build` in Mintlify CLI v4; use nginx `/health` + mint dev now; optional later: `mint export` | `apps/uniz-docs/Dockerfile`, `nginx.conf` |
| 1b | Add `GET /health` lightweight endpoint | docs service |
| 1c | Gateway probes `/health` not `/` | `apps/uniz-gateway/src/index.ts` |
| 1d | Optional: exclude docs from blocking `Promise.all` in aggregate health | gateway |

**Impact:** Fixes cold `/system/health` (~2s → ~50ms).

---

### Phase 2 — P1: Authenticated hot paths (results + registration)

Likely peak offenders (verify in Phase 0):

| Route | Service | Mitigation ideas |
|-------|---------|------------------|
| `GET /academics/grades` | academics | Index `(studentId, semesterId)`, Redis cache per student |
| `GET /academics/attendance` | academics | Same |
| `GET /academics/seating/student` | academics | Precompute seating map, cache |
| `GET /profile/student/me` | user | Single query + Redis 30s TTL |
| `POST /academics/student/register` | academics | Queue + idempotency, rate limit |
| Bulk grade upload (admin) | academics | Async job (already partial), progress polling |

---

### Phase 3 — P2: Gateway / health / config

| Step | Change |
|------|--------|
| Fix `serviceMap.cron` → `CRON_SERVICE_URL` first | `apps/uniz-gateway/src/index.ts` |
| Increase health cache 2s → 15s | gateway |
| Optional-service timeout 200ms for docs probe | gateway |

---

### Phase 4 — P3: Peak load + DDoS resilience

| Layer | Action |
|-------|--------|
| **Cloudflare** | Rate limiting rules on `/api/v1/auth/login/*`; challenge on burst; cache `GET /cms/banners/public` |
| **HPA** | Already configured — tune max replicas + CPU targets after load test |
| **Redis** | Cache grades/attendance/profile for 30–60s during results window |
| **Postgres** | Verify indexes on academics tables; pgbouncer pool size |
| **Ingress** | Confirm proxy timeouts ≥ slowest acceptable query |
| **Deploy** | Stop writing `:local` image tags on GHCR deploy path (fixed manually on VPS) |

**Peak simulation:**

```bash
# After auth baseline — on VPS, staged concurrency
CONCURRENCY=50  bash scripts/peak-load-profile.sh
CONCURRENCY=200 bash scripts/peak-load-profile.sh
```

Target: p95 stays < 500ms at expected peak; p99 < 1000ms acceptable under DDoS if Cloudflare absorbs bulk.

---

## Execution order

```
Phase 0 (measure) → Phase 1 (docs) → Phase 2 (auth hot paths) → Phase 3 (gateway) → Phase 4 (peak/DDoS)
```

---

## Next session checklist

- [x] Phase 0 public audit (2026-06-27 — see snapshot above)
- [ ] Export `student_token` for `O210008`
- [ ] `bash scripts/run-latency-suite.sh --save results/baseline.txt`
- [ ] Review routes with p95 > 500ms
- [x] Implement Phase 1 + 3 code (docs `/health` nginx, gateway probes) — **deploy pending**
- [ ] Re-run suite after deploy and compare

---

## Success metrics

| Metric | Target |
|--------|--------|
| Public health probes | p95 < 100ms |
| Student API reads | p95 < 500ms |
| Login (with Turnstile) | p95 < 800ms (external CF round-trip) |
| `/system/health` cold | p95 < 100ms after Phase 1 |
| Peak 2× normal concurrency | p95 < 500ms on grades/attendance/profile |
| DDoS (Cloudflare proxied) | Origin error rate < 0.1%; legit users unaffected |
