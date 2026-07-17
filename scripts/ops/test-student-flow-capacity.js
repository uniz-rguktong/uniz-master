#!/usr/bin/env node
/**
 * Student flow capacity test:
 *   login → /profile/student/me → /academics/grades → /academics/attendance
 *   → /academics/student/registration/pdf (bytes discarded, never written)
 *
 * Run on VPS:
 *   CONFIRM=1 USERS_FILE=/tmp/users.tsv CONCURRENCY=250 DURATION_SEC=60 \
 *     THINK_TIME_MS=3000 CAPTCHA_TOKEN='...' \
 *     NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/ops/test-student-flow-capacity.js
 *
 * USERS_FILE lines: username\tpassword
 */
const fs = require("fs");

const BASE_URL =
  process.env.BASE_URL || "https://api-uniz.rguktong.in/api/v1";
const USERS_FILE = process.env.USERS_FILE || "";
const CONCURRENCY = Number.parseInt(process.env.CONCURRENCY || "100", 10);
const DURATION_SEC = Number.parseInt(process.env.DURATION_SEC || "60", 10);
const MAX_CONCURRENCY = Number.parseInt(
  process.env.MAX_CONCURRENCY || "1000",
  10,
);
const REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.REQUEST_TIMEOUT_MS || "20000",
  10,
);
const THINK_TIME_MS = Number.parseInt(process.env.THINK_TIME_MS || "3000", 10);
const CAPTCHA_TOKEN =
  process.env.CAPTCHA_TOKEN ||
  "uniz_loadtest_token_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP";
const INCLUDE_LOGIN = process.env.INCLUDE_LOGIN !== "0";
const TOKEN_ONLY = process.env.TOKEN_ONLY === "1";
const SKIP_PDF = process.env.SKIP_PDF === "1";

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}

if (process.env.CONFIRM !== "1") {
  fail("Set CONFIRM=1 to run production student-flow load.");
}
if (!USERS_FILE || !fs.existsSync(USERS_FILE)) {
  fail("USERS_FILE must exist (username\\tpassword or username\\ttoken lines).");
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

const users = fs
  .readFileSync(USERS_FILE, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [username, secret] = line.split("\t");
    return { username, secret };
  })
  .filter((u) => u.username && u.secret);

if (users.length < CONCURRENCY) {
  fail(`Need ${CONCURRENCY} users; USERS_FILE has ${users.length}.`);
}

const phases = [
  "login",
  "me",
  "grades",
  "attendance",
  "pdf",
].filter(
  (p) =>
    ((INCLUDE_LOGIN && !TOKEN_ONLY) || p !== "login") &&
    (!SKIP_PDF || p !== "pdf"),
);

const stats = {
  flows: 0,
  flowOk: 0,
  phase: Object.fromEntries(
    phases.map((name) => [
      name,
      { ok: 0, fail: 0, bytes: 0, latency: [] },
    ]),
  ),
};

function record(phase, ok, ms, bytes = 0) {
  const bucket = stats.phase[phase];
  if (!bucket) return;
  if (ok) bucket.ok += 1;
  else bucket.fail += 1;
  bucket.bytes += bytes;
  bucket.latency.push(ms);
}

function pct(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

async function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      ok: res.ok,
      status: res.status,
      ms: performance.now() - started,
      bytes: buf.length,
      json: (() => {
        try {
          return JSON.parse(buf.toString("utf8"));
        } catch {
          return null;
        }
      })(),
    };
  } catch (error) {
    return {
      ok: false,
      status: error?.name || "network_error",
      ms: performance.now() - started,
      bytes: 0,
      json: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function oneFlow(user) {
  // When secret looks like a JWT (session reuse), skip login.
  const looksLikeJwt = String(user.secret || "").split(".").length === 3;
  let token = looksLikeJwt || TOKEN_ONLY ? user.secret : null;

  if (!token && INCLUDE_LOGIN && !TOKEN_ONLY) {
    const login = await timedFetch(`${BASE_URL}/auth/login/student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        password: user.secret,
        captchaToken: CAPTCHA_TOKEN,
      }),
    });
    token =
      login.json?.token ||
      login.json?.accessToken ||
      login.json?.student_token ||
      null;
    record("login", Boolean(login.ok && token), login.ms, login.bytes);
    if (!token) {
      stats.flows += 1;
      return;
    }
  }

  if (!token) {
    stats.flows += 1;
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const me = await timedFetch(`${BASE_URL}/profile/student/me`, { headers });
  record("me", me.ok, me.ms, me.bytes);

  const grades = await timedFetch(`${BASE_URL}/academics/grades`, { headers });
  record("grades", grades.ok, grades.ms, grades.bytes);

  const attendance = await timedFetch(`${BASE_URL}/academics/attendance`, {
    headers,
  });
  record("attendance", attendance.ok, attendance.ms, attendance.bytes);

  // Discard PDF body after measuring — never write to disk.
  // Supports async queue (202 + poll + download).
  let pdfOk = true;
  if (!SKIP_PDF) {
    const started = performance.now();
    const pdf = await timedFetch(
      `${BASE_URL}/academics/student/registration/pdf`,
      { headers },
    );

    if (pdf.status === 202 && pdf.json?.jobId) {
      const jobId = pdf.json.jobId;
      let ready = false;
      let bytes = 0;
      const deadline = performance.now() + REQUEST_TIMEOUT_MS;
      while (performance.now() < deadline) {
        const status = await timedFetch(
          `${BASE_URL}/academics/registrations/pdf/jobs/${jobId}`,
          { headers },
        );
        if (status.json?.status === "done") {
          const file = await timedFetch(
            `${BASE_URL}/academics/registrations/pdf/jobs/${jobId}/download`,
            { headers },
          );
          ready = file.status === 200;
          bytes = file.bytes;
          break;
        }
        if (status.json?.status === "failed") break;
        await new Promise((r) => setTimeout(r, 400));
      }
      const ms = performance.now() - started;
      record("pdf", ready, ms, bytes);
      if (ready) stats.phase.pdf.okPdf = (stats.phase.pdf.okPdf || 0) + 1;
      pdfOk = ready;
    } else {
      // 200 = sync/generated; 404 = no registration slip
      record("pdf", pdf.status === 200 || pdf.status === 404, pdf.ms, pdf.bytes);
      if (pdf.status === 200) {
        stats.phase.pdf.okPdf = (stats.phase.pdf.okPdf || 0) + 1;
      }
      if (pdf.status === 404) {
        stats.phase.pdf.miss = (stats.phase.pdf.miss || 0) + 1;
      }
      pdfOk = pdf.status === 200 || pdf.status === 404;
    }
  }

  stats.flows += 1;
  if (me.ok && grades.ok && attendance.ok && pdfOk) {
    stats.flowOk += 1;
  }
}

async function worker(workerId, deadline) {
  const user = users[workerId % users.length];
  let token = TOKEN_ONLY ? user.secret : null;

  if (THINK_TIME_MS > 0) {
    await new Promise((r) => setTimeout(r, Math.random() * THINK_TIME_MS));
  }

  // Login once per worker, then reuse the session for subsequent loops.
  if (!TOKEN_ONLY && INCLUDE_LOGIN) {
    const login = await timedFetch(`${BASE_URL}/auth/login/student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: user.username,
        password: user.secret,
        captchaToken: CAPTCHA_TOKEN,
      }),
    });
    token =
      login.json?.token ||
      login.json?.accessToken ||
      login.json?.student_token ||
      null;
    record("login", Boolean(login.ok && token), login.ms, login.bytes);
    if (!token) return;
  }

  while (performance.now() < deadline) {
    await oneFlow({ username: user.username, secret: token });
    if (THINK_TIME_MS > 0) {
      const jitter = 0.75 + Math.random() * 0.5;
      await new Promise((r) => setTimeout(r, THINK_TIME_MS * jitter));
    }
  }
}

function summarizePhase(name, bucket) {
  const lat = [...bucket.latency].sort((a, b) => a - b);
  const total = bucket.ok + bucket.fail;
  return {
    name,
    total,
    ok: bucket.ok,
    fail: bucket.fail,
    avgBytes: total ? Math.round(bucket.bytes / total) : 0,
    p50: Math.round(pct(lat, 0.5)),
    p95: Math.round(pct(lat, 0.95)),
    p99: Math.round(pct(lat, 0.99)),
    max: Math.round(lat.at(-1) || 0),
    okPdf: bucket.okPdf || 0,
    miss: bucket.miss || 0,
  };
}

async function main() {
  console.log("=== Student flow capacity test ===");
  console.log(`base=${BASE_URL}`);
  console.log(`concurrency=${CONCURRENCY}`);
  console.log(`users=${users.length}`);
  console.log(`duration=${DURATION_SEC}s`);
  console.log(`think_time=${THINK_TIME_MS}ms`);
  console.log(`include_login=${INCLUDE_LOGIN && !TOKEN_ONLY}`);
  console.log(`token_only=${TOKEN_ONLY}`);
  console.log(`phases=${phases.join(",")}`);

  const started = performance.now();
  const deadline = started + DURATION_SEC * 1000;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, id) => worker(id, deadline)),
  );
  const elapsed = (performance.now() - started) / 1000;

  console.log("=== Result ===");
  console.log(`flows=${stats.flows} flow_ok=${stats.flowOk}`);
  console.log(`flow_rps=${(stats.flows / elapsed).toFixed(1)}`);
  for (const name of phases) {
    const s = summarizePhase(name, stats.phase[name]);
    const extra =
      name === "pdf"
        ? ` pdf200=${s.okPdf} pdf404=${s.miss}`
        : "";
    console.log(
      `${s.name}: n=${s.total} ok=${s.ok} fail=${s.fail} avgBytes=${s.avgBytes} ` +
        `p50=${s.p50}ms p95=${s.p95}ms p99=${s.p99}ms max=${s.max}ms${extra}`,
    );
  }

  const loginFail = stats.phase.login?.fail || 0;
  const loginTotal = (stats.phase.login?.ok || 0) + loginFail;
  const loginErrRate = loginTotal ? loginFail / loginTotal : 0;
  const hardFail =
    stats.flows > 0 && stats.flowOk / stats.flows < 0.98
      ? 1
      : loginErrRate > 0.02
        ? 1
        : 0;
  process.exitCode = hardFail;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
