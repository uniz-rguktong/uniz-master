# API Performance Overhaul

A phased, production-safe performance pass across every UniZ backend service, the
gateway, caching, Prisma/Postgres, inter-service calls, the frontend fetching
layer, and infra tuning. Each phase shipped as its own reviewed PR.

## How to measure (Phase 9 guardrails)

### Endpoint benchmark harness
`scripts/ops/perf-benchmark.mjs` times the hot endpoints touched by this overhaul
(avg / p50 / p95 / min / max + cache-hit rate) and can diff against a saved
baseline.

```bash
# Capture a baseline (e.g. before deploying a phase)
BASE_URL=https://api-uniz.rguktong.in/api/v1 \
STUDENT_TOKEN=<jwt> ADMIN_TOKEN=<jwt> STUDENT_ID=O210001 \
node scripts/ops/perf-benchmark.mjs --runs 15 --save before.json

# Re-run after and print % deltas vs the baseline
node scripts/ops/perf-benchmark.mjs --runs 15 --baseline before.json --save after.json
```

Endpoints requiring a token you don't supply are skipped (not failed), so it also
works unauthenticated for the public/edge probes.

### Slow-query logging (temporary, prod-safe)
Every runtime Prisma client (auth/user/academics/notifications) supports an
env-gated slow-query probe — **off by default, zero overhead when unset**:

```bash
SLOW_QUERY_MS=200   # log any query slower than 200ms as `[slow-query] <ms> :: <sql>`
```

Set it on a single pod, reproduce the slow flow, read the logs, then unset.

### Load tests (pre-existing)
Reuse the existing toolkit under `scripts/ops/`: `k6/`, `load_test_core.js`,
`load_test_real_students.js`, `run-latency-suite.sh`, `peak-load-profile.sh`,
`audit-prod-latency.py`, and `test-hpa-autoscale.sh`.

---

## Per-phase changes & expected impact

### Phase 0 — Quick wins (no contract change)
- Enabled `compression()` on notifications/files/mail/academics (gateway already
  had gzip). **Smaller payloads over the wire.**
- Shrunk oversized JSON body limits (academics 50mb→20mb, notifications 2mb→1mb).
- Standardized prod Prisma `log: ["error"]`.
- Removed a blocking `redis.keys("profile:v2:*")` scan (`KEYS` is O(N) and blocks
  single-threaded Redis).
- Fixed rate limiters: re-enabled mail limiter, realistic outpass cap, moved the
  grievance in-memory limiter to Redis (bounded + multi-replica correct).

### Phase 1 — Case normalization (unblocks indexes)
- Data is canonically cased (uppercase `studentId`, normalized `username`), so
  dropped `mode:"insensitive"` on hot lookups (grades, attendance, OTP, profiles)
  which had been forcing sequential scans. **Exact matches now hit B-tree
  indexes.**
- Added `OtpLog @@index([username, createdAt])`.

### Phase 2 — Gateway "Warp Engine"
- Proxy cache now stores **raw UTF-8 JSON instead of base64** — removes ~33%
  Redis inflation + encode/decode CPU (cache key bumped `p4`→`p5`).
- Raised near-useless 1–2s cache TTLs (unauth non-CMS GET → 10s, public CMS 30s).
- Removed dead `cacheMiddleware`.

### Phase 3 — Heavy reads → SQL aggregation + cache
- `getSemesters`: replaced a ~20k-row scan + JS de-dupe with
  `COUNT(DISTINCT UPPER(TRIM(studentId))) GROUP BY` + 30s Redis cache.
- `analytics/admin-summary`: 30s Redis cache keyed by role+department.
- `searchStudents`: capped `limit` (≤100) so a caller can't pull the whole table.
- Profile `/me`: raised TTL to 15s (busted on profile writes) — collapses the
  grades/attendance/outpass enrichment fan-out under polling.

### Phase 4 — Heavy work off the request path
- `publishResults`/`publishAttendance`: fire-and-forget (progress already tracked
  in Redis + polled) instead of holding the HTTP connection open.
- Skip per-student PDF generation entirely when result emails are disabled by
  policy (was pure wasted CPU).

### Phase 5 — N+1 / loop elimination
- Upload worker: memoized semester resolution; batched + deduped cache
  invalidation once per student per job (was a cross-service HTTP POST **per
  row**).
- `initSemester`: one subject fetch + in-memory bucketing instead of a query per
  (year × branch).
- `uploadSeating`: bounded-concurrency chunked upserts.
- Notification `PUSH_BROADCAST`: bounded-concurrency chunks instead of strictly
  sequential sends; single insert for inbox (pre-generated id, no insert+update).

### Phase 6 — Inter-service hardening
- Cache login department + resolved OTP email per user (1h) — removes repeated
  user-service fan-out on the login/OTP hot path.
- Added timeouts to previously-uncapped external/background axios calls (signup
  profile writes; academics Cloudinary uploads).
- Verified already-optimal: auth-suspension hop is Redis-cached (10m, fail-open);
  turnstile uses an 800ms client; bcrypt candidate set is deduped.

### Phase 7 — Frontend fetching layer
- PDF-job polling: flat 1200ms → exponential backoff (700ms → ×1.5 → 5s ceiling).
- Confirmed the student `bootstrap` fan-in is already the primary path (request
  dedup + stale-while-revalidate session cache), and all Phase 3–6 backend
  changes were response-shape-preserving, so **no UI shape updates were needed**.

### Phase 8 — Infra tuning
- **Prisma pooling**: pinned explicit `connection_limit=5` (+15s `pool_timeout`)
  per service via the datasource URL — Prisma's default (`num_cpus*2+1` off the
  *host* CPU count) over-provisions under K8s. Worst-case aggregate across HPA
  maxes (user 4, academics 4, auth 3, notif 1) ≈ 60 connections, comfortably
  under Postgres' 100 default → **PgBouncer not needed yet**. Tunable via
  `PRISMA_CONNECTION_LIMIT` / `PRISMA_POOL_TIMEOUT`.
- **Scheduled ANALYZE**: nightly `uniz-postgres-analyze` CronJob (02:00) keeps
  planner statistics fresh on large append-heavy tables where autovacuum's
  ANALYZE thresholds lag.
- Already in place: Redis `maxmemory 384mb` + `allkeys-lru`; per-service resource
  requests/limits + HPA.
- **External / VPS-side (not in repo):** Postgres `shared_buffers`/`work_mem`
  tuning must be applied on the database host.

### Phase 9 — Measurement & guardrails
- This document, the benchmark harness, and env-gated slow-query logging above.

---

## Recording results

Fill in after running the harness against prod (paste the markdown table the
script prints):

| Endpoint | Phase | before p95 | after p95 | delta |
|---|---|---|---|---|
| _run `perf-benchmark.mjs --baseline before.json`_ | | | | |
