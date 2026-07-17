#!/usr/bin/env node
/**
 * Read-only authenticated capacity test.
 *
 * TOKEN_FILE must contain one JWT per line. Tokens are never logged.
 * Run in stages and watch the cluster separately:
 *
 *   CONFIRM=1 TOKEN_FILE=/tmp/tokens CONCURRENCY=100 DURATION_SEC=45 \
 *     node scripts/ops/test-authenticated-capacity.js
 */
const fs = require("fs");

const BASE_URL =
  process.env.BASE_URL || "https://api-uniz.rguktong.in/api/v1";
const TOKEN_FILE = process.env.TOKEN_FILE || "";
const CONCURRENCY = Number.parseInt(process.env.CONCURRENCY || "100", 10);
const DURATION_SEC = Number.parseInt(process.env.DURATION_SEC || "45", 10);
const MAX_CONCURRENCY = Number.parseInt(
  process.env.MAX_CONCURRENCY || "500",
  10,
);
const REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.REQUEST_TIMEOUT_MS || "10000",
  10,
);
const THINK_TIME_MS = Number.parseInt(process.env.THINK_TIME_MS || "0", 10);
const ROUTES = (
  process.env.ROUTES ||
  "/profile/student/me,/academics/grades,/academics/attendance"
)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}

if (process.env.CONFIRM !== "1") {
  fail("Set CONFIRM=1 to run authenticated production load.");
}
if (!TOKEN_FILE || !fs.existsSync(TOKEN_FILE)) {
  fail("TOKEN_FILE must point to a newline-delimited JWT file.");
}
if (!Number.isInteger(CONCURRENCY) || CONCURRENCY < 1) {
  fail("CONCURRENCY must be a positive integer.");
}
if (CONCURRENCY > MAX_CONCURRENCY) {
  fail(`CONCURRENCY exceeds hard cap ${MAX_CONCURRENCY}.`);
}
if (!Number.isInteger(DURATION_SEC) || DURATION_SEC < 1 || DURATION_SEC > 180) {
  fail("DURATION_SEC must be between 1 and 180.");
}
if (!Number.isInteger(THINK_TIME_MS) || THINK_TIME_MS < 0 || THINK_TIME_MS > 10000) {
  fail("THINK_TIME_MS must be between 0 and 10000.");
}

const tokens = fs
  .readFileSync(TOKEN_FILE, "utf8")
  .split(/\r?\n/)
  .map((token) => token.trim())
  .filter(Boolean);

if (tokens.length < CONCURRENCY) {
  fail(
    `Need at least ${CONCURRENCY} distinct tokens; TOKEN_FILE has ${tokens.length}.`,
  );
}

const stats = {
  total: 0,
  ok: 0,
  errors: 0,
  status: new Map(),
  route: new Map(),
  latency: [],
};

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

async function request(workerId, sequence) {
  const route = ROUTES[(workerId + sequence) % ROUTES.length];
  const token = tokens[workerId % tokens.length];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = performance.now();

  try {
    const response = await fetch(`${BASE_URL}${route}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "uniz-authenticated-capacity-test/1.0",
      },
      signal: controller.signal,
    });
    await response.arrayBuffer();
    const latency = performance.now() - started;
    stats.total += 1;
    stats.latency.push(latency);
    increment(stats.status, response.status);
    increment(stats.route, route);
    if (response.ok) stats.ok += 1;
    else stats.errors += 1;
  } catch (error) {
    stats.total += 1;
    stats.errors += 1;
    increment(stats.status, error?.name || "network_error");
  } finally {
    clearTimeout(timeout);
  }
}

async function worker(workerId, deadline) {
  let sequence = 0;
  if (THINK_TIME_MS > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * THINK_TIME_MS),
    );
  }
  while (performance.now() < deadline) {
    await request(workerId, sequence);
    sequence += 1;
    if (THINK_TIME_MS > 0) {
      const jitter = 0.75 + Math.random() * 0.5;
      await new Promise((resolve) =>
        setTimeout(resolve, THINK_TIME_MS * jitter),
      );
    }
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

async function main() {
  console.log("=== Authenticated capacity test ===");
  console.log(`base=${BASE_URL}`);
  console.log(`concurrency=${CONCURRENCY}`);
  console.log(`distinct_tokens=${tokens.length}`);
  console.log(`duration=${DURATION_SEC}s`);
  console.log(`think_time=${THINK_TIME_MS}ms`);
  console.log(`routes=${ROUTES.join(",")}`);

  const started = performance.now();
  const deadline = started + DURATION_SEC * 1000;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, id) => worker(id, deadline)),
  );
  const elapsedSec = (performance.now() - started) / 1000;

  stats.latency.sort((a, b) => a - b);
  const errorRate = stats.total ? (stats.errors / stats.total) * 100 : 100;

  console.log("=== Result ===");
  console.log(`requests=${stats.total}`);
  console.log(`ok=${stats.ok}`);
  console.log(`errors=${stats.errors}`);
  console.log(`error_rate=${errorRate.toFixed(2)}%`);
  console.log(`rps=${(stats.ok / elapsedSec).toFixed(1)}`);
  console.log(
    `latency_ms p50=${percentile(stats.latency, 0.5).toFixed(0)} ` +
      `p95=${percentile(stats.latency, 0.95).toFixed(0)} ` +
      `p99=${percentile(stats.latency, 0.99).toFixed(0)} ` +
      `max=${(stats.latency.at(-1) || 0).toFixed(0)}`,
  );
  console.log(`statuses=${JSON.stringify(Object.fromEntries(stats.status))}`);
  console.log(`route_counts=${JSON.stringify(Object.fromEntries(stats.route))}`);

  if (errorRate > 1 || percentile(stats.latency, 0.95) > 1000) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
