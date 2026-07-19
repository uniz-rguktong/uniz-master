#!/usr/bin/env node
/**
 * Perf benchmark harness for the endpoints touched by the API Performance
 * Overhaul. Measures avg/p50/p95/min/max latency + cache hit-rate per endpoint,
 * and can diff against a saved baseline to produce before/after deltas.
 *
 * Usage:
 *   BASE_URL=https://api-uniz.rguktong.in/api/v1 \
 *   STUDENT_TOKEN=<jwt> ADMIN_TOKEN=<jwt> STUDENT_ID=O210001 \
 *   node scripts/ops/perf-benchmark.mjs [--runs 10] [--save before.json] [--baseline before.json]
 *
 * Env:
 *   BASE_URL       gateway base (default prod)
 *   STUDENT_TOKEN  JWT for student-scoped endpoints (optional)
 *   ADMIN_TOKEN    JWT for admin/webmaster endpoints (optional)
 *   STUDENT_ID     student id used for grades/attendance probes (default O210001)
 *   INSECURE_SSL   set truthy to skip TLS verification (self-signed VPS)
 *   RUNS           measured runs per endpoint (default 10)
 *
 * Endpoints requiring a token you didn't supply are skipped, not failed.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const BASE = (
  process.env.BASE_URL || "https://api-uniz.rguktong.in/api/v1"
).replace(/\/$/, "");
const STUDENT_TOKEN = process.env.STUDENT_TOKEN || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const STUDENT_ID = process.env.STUDENT_ID || "O210001";
const RUNS = Number(getArg("--runs") || process.env.RUNS || 10);
const WARMUP = 2;
const SAVE = getArg("--save");
const BASELINE = getArg("--baseline");

if (process.env.INSECURE_SSL) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Endpoints exercised by the overhaul. `phase` tags which phase optimized it.
const ENDPOINTS = [
  { name: "system/health", path: "/system/health", auth: "none", phase: "-" },
  { name: "cms/banners/public", path: "/cms/banners/public", auth: "none", phase: "2 (gateway cache)" },
  { name: "cms/notifications", path: "/cms/notifications", auth: "none", phase: "2 (gateway cache)" },
  { name: "academics/semester", path: "/academics/semester", auth: "admin", phase: "3 (SQL count + cache)" },
  { name: "analytics/admin-summary", path: "/academics/analytics/admin-summary?role=webmaster", auth: "admin", phase: "3 (SQL + cache)" },
  { name: "registrations", path: "/academics/registrations", auth: "admin", phase: "3 (paginate/select)" },
  { name: "student/search", path: "/profile/student/search?query=a&limit=20", auth: "admin", phase: "3 (capped limit)" },
  { name: "profile/student/me", path: "/profile/student/me", auth: "student", phase: "0/3 (15s cache)" },
  { name: "profile/student/bootstrap", path: "/profile/student/bootstrap", auth: "student", phase: "7 (fan-in)" },
  { name: "academics/grades", path: `/academics/grades?studentId=${encodeURIComponent(STUDENT_ID)}`, auth: "student", phase: "1 (indexed)" },
  { name: "academics/attendance", path: `/academics/attendance?studentId=${encodeURIComponent(STUDENT_ID)}`, auth: "student", phase: "1 (indexed)" },
];

function tokenFor(auth) {
  if (auth === "student") return STUDENT_TOKEN;
  if (auth === "admin") return ADMIN_TOKEN;
  return "";
}

function pct(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function timeOnce(url, headers) {
  const t0 = performance.now();
  try {
    const res = await fetch(url, { headers, redirect: "manual" });
    // Drain the body so we measure full transfer, not just headers.
    await res.arrayBuffer();
    return {
      ms: performance.now() - t0,
      status: res.status,
      cache: res.headers.get("x-cache") || "",
    };
  } catch (err) {
    return { ms: null, status: 0, err: String(err?.message || err).slice(0, 80) };
  }
}

async function benchEndpoint(ep) {
  const token = tokenFor(ep.auth);
  if (ep.auth !== "none" && !token) {
    return { ...ep, skipped: `no ${ep.auth} token` };
  }
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const url = BASE + ep.path;

  for (let i = 0; i < WARMUP; i++) await timeOnce(url, headers);

  const samples = [];
  let status = 0;
  let hits = 0;
  let err;
  for (let i = 0; i < RUNS; i++) {
    const r = await timeOnce(url, headers);
    status = r.status;
    if (r.err) err = r.err;
    if (r.ms != null) samples.push(r.ms);
    if ((r.cache || "").toUpperCase() === "HIT") hits++;
  }
  if (!samples.length) return { ...ep, status, err: err || "no samples" };
  samples.sort((a, b) => a - b);
  const round = (n) => (n == null ? null : Math.round(n));
  return {
    ...ep,
    status,
    avg: round(samples.reduce((a, b) => a + b, 0) / samples.length),
    p50: round(pct(samples, 50)),
    p95: round(pct(samples, 95)),
    min: round(samples[0]),
    max: round(samples[samples.length - 1]),
    cacheHitRate: Math.round((hits / RUNS) * 100),
  };
}

function fmt(v, unit = "") {
  return v == null ? "—" : `${v}${unit}`;
}

function delta(now, was) {
  if (now == null || was == null || was === 0) return "";
  const d = Math.round(((now - was) / was) * 100);
  const sign = d > 0 ? "+" : "";
  return ` (${sign}${d}%)`;
}

(async () => {
  console.log(`# Perf benchmark — ${new Date().toISOString()}`);
  console.log(`Base: ${BASE}  runs/endpoint: ${RUNS}  student_id: ${STUDENT_ID}`);
  console.log(
    `Tokens: student=${STUDENT_TOKEN ? "yes" : "no"} admin=${ADMIN_TOKEN ? "yes" : "no"}\n`,
  );

  const baseline =
    BASELINE && existsSync(BASELINE)
      ? JSON.parse(readFileSync(BASELINE, "utf8"))
      : null;
  const baseMap = new Map((baseline?.results || []).map((r) => [r.name, r]));

  const results = [];
  for (const ep of ENDPOINTS) {
    process.stdout.write(`  benchmarking ${ep.name} … `);
    const r = await benchEndpoint(ep);
    results.push(r);
    if (r.skipped) console.log(`skipped (${r.skipped})`);
    else if (r.err) console.log(`ERR ${r.status} ${r.err}`);
    else
      console.log(
        `avg=${r.avg}ms p95=${r.p95}ms cache=${r.cacheHitRate}% (${r.status})`,
      );
  }

  console.log("\n| Endpoint | Phase | Status | avg | p50 | p95 | min | max | cacheHit |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (const r of results) {
    if (r.skipped) {
      console.log(`| ${r.name} | ${r.phase} | skipped | — | — | — | — | — | — |`);
      continue;
    }
    const b = baseMap.get(r.name);
    console.log(
      `| ${r.name} | ${r.phase} | ${r.status} | ${fmt(r.avg, "ms")}${delta(r.avg, b?.avg)} | ${fmt(r.p50, "ms")} | ${fmt(r.p95, "ms")}${delta(r.p95, b?.p95)} | ${fmt(r.min, "ms")} | ${fmt(r.max, "ms")} | ${fmt(r.cacheHitRate, "%")} |`,
    );
  }

  if (SAVE) {
    writeFileSync(
      SAVE,
      JSON.stringify({ base: BASE, at: new Date().toISOString(), runs: RUNS, results }, null, 2),
    );
    console.log(`\nSaved results to ${SAVE}`);
  }
  if (baseline) {
    console.log(`\nDeltas shown vs baseline captured ${baseline.at}`);
  }
})();
