#!/usr/bin/env node
/**
 * One-off faculty username + campus password revamp.
 *
 *   node scripts/ops/login-revamp.js                 # dry-run (default)
 *   node scripts/ops/login-revamp.js --apply --confirm=LOGIN-REVAMP
 *
 * Dry-run reads AuthCredential, FacultyProfile, AdminProfile, and
 * StudentProfile, then prints a CSV. It never writes. The CSV lists faculty
 * and shared accounts only — never passwords or hashes.
 *
 * Apply resets in-scope students to {id}@rguktong and renames person-faculty
 * to firstname.lastname, with the same password template. webadmin, every
 * AdminProfile, and shared role accounts are left unchanged.
 */
"use strict";

const CONFIRM_PHRASE = "LOGIN-REVAMP";
const BATCH = 50;
const TITLES = new Set([
  "dr",
  "doctor",
  "mr",
  "mister",
  "mrs",
  "ms",
  "miss",
  "prof",
  "professor",
  "shri",
  "sri",
  "smt",
  "kumari",
  "er",
  "capt",
  "col",
  "rev",
  "sir",
  "madam",
]);

const SHARED_EXACT = new Set([
  "coe",
  "director",
  "dean",
  "swo",
  "security",
  "librarian",
  "ao",
  "dsw",
  "admin",
  "teacher",
  "faculty",
  "hod",
  "warden",
  "caretaker",
  "warden_male",
  "warden_female",
  "caretaker_male",
  "caretaker_female",
]);

const FOLD = {
  ß: "ss",
  ø: "o",
  ł: "l",
  đ: "d",
  æ: "ae",
  œ: "oe",
  þ: "th",
  ð: "d",
  ħ: "h",
  ŋ: "n",
};

function foldAscii(value) {
  const nfd = String(value || "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
  let out = "";
  for (const ch of nfd) out += FOLD[ch] || ch;
  return out;
}

function tokenize(value) {
  const folded = foldAscii(value)
    .replace(/['’]/g, "")
    .replace(/[-–—_/]+/g, " ")
    .toLowerCase();
  const raw = folded.split(/[^a-z0-9]+/).filter(Boolean);
  let start = 0;
  while (start < raw.length && TITLES.has(raw[start])) start += 1;
  let end = raw.length;
  while (end - 1 > start && TITLES.has(raw[end - 1])) end -= 1;
  return raw.slice(start, end);
}

function parsePersonName(name) {
  const tokens = tokenize(name);
  if (!tokens.length) return null;
  if (tokens.length === 1) {
    return { first: tokens[0], middleInitial: "", last: "" };
  }
  const last = tokens[tokens.length - 1];
  const head = tokens.slice(0, -1);
  let firstIdx = head.findIndex((token) => token.length > 1);
  if (firstIdx < 0) firstIdx = 0;
  const first = head[firstIdx];
  let middleInitial = "";
  if (firstIdx + 1 < head.length) middleInitial = head[firstIdx + 1][0];
  else if (firstIdx > 0) middleInitial = head[0][0];
  return { first, middleInitial, last };
}

function baseSlug(parts) {
  if (!parts || !parts.first) return "";
  if (!parts.last) return parts.first;
  return `${parts.first}.${parts.last}`;
}

function departmentSuffix(department) {
  const tokens = tokenize(department);
  if (!tokens.length) return "";
  if (tokens.length === 1) return tokens[0].slice(0, 12);
  return tokens
    .map((token) => token[0])
    .join("")
    .slice(0, 8);
}

function slugCandidates(parts, department) {
  if (!parts) return [];
  const base = baseSlug(parts);
  if (!base) return [];
  const list = [base];
  if (parts.middleInitial && parts.last) {
    list.push(`${parts.first}.${parts.middleInitial}.${parts.last}`);
  }
  const dept = departmentSuffix(department);
  if (dept && parts.last) list.push(`${base}.${dept}`);
  if (dept && parts.middleInitial && parts.last) {
    list.push(`${parts.first}.${parts.middleInitial}.${parts.last}.${dept}`);
  }
  return list;
}

function suffixLabel(chosen, parts, department) {
  const candidates = slugCandidates(parts, department);
  const index = candidates.indexOf(chosen);
  if (index <= 0) return index === 0 ? "" : "suffix=numeric";
  if (index === 1 && parts.middleInitial) return "suffix=middle";
  if (chosen.endsWith(`.${departmentSuffix(department)}`) && parts.middleInitial && chosen.split(".").length > 3) {
    return "suffix=middle+department";
  }
  if (departmentSuffix(department) && chosen.endsWith(`.${departmentSuffix(department)}`)) {
    return "suffix=department";
  }
  return "suffix=numeric";
}

function allocateSlug(parts, department, taken) {
  const candidates = slugCandidates(parts, department);
  for (const candidate of candidates) {
    if (!taken.has(candidate)) {
      return {
        slug: candidate,
        collision: candidate !== candidates[0],
        detail: suffixLabel(candidate, parts, department),
      };
    }
  }
  const base = candidates[0] || "user";
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base}.${n}`;
    if (!taken.has(candidate)) {
      return { slug: candidate, collision: true, detail: "suffix=numeric" };
    }
  }
  return { slug: "", collision: true, detail: "unslugable" };
}

function accountKind(username) {
  const value = String(username || "").trim().toLowerCase();
  if (!value || value === "webadmin") return "excluded";
  if (SHARED_EXACT.has(value)) return "shared";
  if (/^hod[_-]/.test(value)) return "shared";
  if (/^demo[_-]/.test(value)) return "shared";
  if (/^(warden|caretaker)[_-]/.test(value)) return "shared";
  return "person";
}

function isDeliverableEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return Boolean(local && domain && domain.includes(".") && !domain.startsWith(".") && !domain.endsWith("."));
}

function csvField(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function needsWork(cred, usernameOk) {
  const version = Number(cred && cred.tokenVersion) || 0;
  if (!usernameOk) return true;
  if (version >= 1 && cred.mustChangePassword) return false;
  if (version >= 1 && !cred.mustChangePassword) return false;
  return true;
}

function lowerMap(rows, field) {
  const map = new Map();
  for (const row of rows) {
    const key = String(row[field] || "").trim().toLowerCase();
    if (key && !map.has(key)) map.set(key, row);
  }
  return map;
}

function planLoginRevamp(state) {
  const creds = state.credentials || [];
  const faculty = state.faculty || [];
  const admins = state.admins || [];
  const students = state.students || [];
  const adminNames = new Set(
    admins.map((row) => String(row.username || "").trim().toLowerCase()).filter(Boolean),
  );
  adminNames.add("webadmin");

  const credByUser = lowerMap(creds, "username");
  const credByEmail = new Map();
  for (const cred of creds) {
    const email = String(cred.realEmail || "").trim().toLowerCase();
    if (email && !credByEmail.has(email)) credByEmail.set(email, cred);
  }
  const studentEmail = lowerMap(students, "username");

  const excluded = (username, role) => {
    const kind = accountKind(username);
    if (kind === "excluded" || kind === "shared") return kind;
    if (adminNames.has(String(username || "").trim().toLowerCase())) return "excluded";
    if (String(role || "").trim().toLowerCase() === "webadmin") return "excluded";
    return "person";
  };

  const people = [];
  const shared = [];
  const reviews = [];
  const matchedCredIds = new Set();

  const sortedFaculty = [...faculty].sort((a, b) => {
    const byName = String(a.username || "").localeCompare(String(b.username || ""));
    if (byName) return byName;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });

  for (const row of sortedFaculty) {
    const username = String(row.username || "").trim();
    const kind = excluded(username, row.role);
    let cred = credByUser.get(username.toLowerCase()) || null;
    if (!cred) {
      const email = String(row.email || "").trim().toLowerCase();
      if (email) cred = credByEmail.get(email) || null;
    }
    if (!cred) {
      cred =
        creds.find((item) => {
          const email = String(item.realEmail || "").trim().toLowerCase();
          const at = email.lastIndexOf("@");
          return at > 0 && email.slice(0, at) === username.toLowerCase();
        }) || null;
    }
    if (kind === "shared") {
      shared.push({ row, cred });
      if (cred) matchedCredIds.add(cred.id);
      continue;
    }
    if (kind === "excluded") {
      if (cred) matchedCredIds.add(cred.id);
      continue;
    }
    if (!cred) {
      reviews.push({
        kind: "faculty",
        oldUsername: username,
        newUsername: "",
        collision: "no",
        action: "review",
        detail: "no auth credential; left unchanged",
      });
      continue;
    }
    matchedCredIds.add(cred.id);
    people.push({ row, cred });
  }

  const taken = new Set();
  for (const cred of creds) {
    taken.add(String(cred.username || "").trim().toLowerCase());
  }
  for (const row of faculty) {
    taken.add(String(row.username || "").trim().toLowerCase());
  }

  const facultyActions = [];
  const rows = [];
  for (const person of people) {
    const oldUsername = String(person.row.username || "").trim();
    const own = [
      oldUsername.toLowerCase(),
      String(person.cred.username || "").trim().toLowerCase(),
    ];
    for (const name of own) taken.delete(name);
    const parts = parsePersonName(person.row.name || "");
    const allocated = parts ? allocateSlug(parts, person.row.department, taken) : null;
    if (!allocated || !allocated.slug) {
      rows.push({
        kind: "faculty",
        oldUsername,
        newUsername: "",
        collision: "no",
        action: "review",
        detail: "name could not be slugged; left unchanged",
      });
      for (const name of own) taken.add(name);
      continue;
    }
    taken.add(allocated.slug);
    const usernameOk = person.cred.username.toLowerCase() === allocated.slug;
    const reset = needsWork(person.cred, usernameOk);
    const profileEmail = String(person.row.email || "").trim().toLowerCase();
    const storedReal = String(person.cred.realEmail || "").trim().toLowerCase();
    const realEmail = isDeliverableEmail(storedReal)
      ? storedReal
      : isDeliverableEmail(profileEmail)
        ? profileEmail
        : `${oldUsername.toLowerCase()}@rguktong.ac.in`;
    const action = !usernameOk ? "rename" : reset ? "reset-password" : "unchanged";
    rows.push({
      kind: "faculty",
      oldUsername,
      newUsername: allocated.slug,
      collision: allocated.collision ? "yes" : "no",
      action,
      detail: allocated.detail,
    });
    facultyActions.push({
      authId: person.cred.id,
      facultyId: person.row.id,
      oldUsername,
      newUsername: allocated.slug,
      realEmail,
      rename: !usernameOk || person.row.username !== allocated.slug,
      reset,
    });
  }

  for (const entry of shared) {
    const oldUsername = String(entry.row.username || entry.cred?.username || "").trim();
    const parts = parsePersonName(entry.row.name || "");
    const proposed = parts ? slugCandidates(parts, entry.row.department)[0] || "" : "";
    const collision = proposed && taken.has(proposed) ? "yes" : "no";
    rows.push({
      kind: "shared",
      oldUsername,
      newUsername: proposed,
      collision,
      action: "leave-unchanged",
      detail: "shared role account; not modified",
    });
  }

  const seenReview = new Set(reviews.map((row) => row.oldUsername.toLowerCase()));
  for (const cred of creds) {
    if (matchedCredIds.has(cred.id)) continue;
    const kind = excluded(cred.username, cred.role);
    if (kind === "excluded") continue;
    if (kind === "shared") {
      rows.push({
        kind: "shared",
        oldUsername: cred.username,
        newUsername: "",
        collision: "no",
        action: "leave-unchanged",
        detail: "shared role account; not modified",
      });
      continue;
    }
    const role = String(cred.role || "").trim().toLowerCase();
    if (role === "student") continue;
    if (seenReview.has(String(cred.username || "").toLowerCase())) continue;
    reviews.push({
      kind: "faculty",
      oldUsername: cred.username,
      newUsername: "",
      collision: "no",
      action: "review",
      detail: "no faculty profile; left unchanged",
    });
  }
  rows.push(...reviews);

  const facultyCredIds = new Set(facultyActions.map((item) => item.authId));
  const studentActions = [];
  let studentsToReset = 0;
  let studentsSkipped = 0;
  for (const cred of creds) {
    const role = String(cred.role || "").trim().toLowerCase();
    if (role !== "student") continue;
    if (facultyCredIds.has(cred.id)) continue;
    if (excluded(cred.username, cred.role) !== "person") continue;
    const reset = needsWork(cred, true);
    if (!reset) {
      studentsSkipped += 1;
      continue;
    }
    studentsToReset += 1;
    const profile = studentEmail.get(String(cred.username || "").trim().toLowerCase());
    const storedReal = String(cred.realEmail || "").trim().toLowerCase();
    const profileMail = String(profile?.email || "").trim().toLowerCase();
    const realEmail = isDeliverableEmail(storedReal)
      ? storedReal
      : isDeliverableEmail(profileMail)
        ? profileMail
        : `${String(cred.username || "").trim().toLowerCase()}@rguktong.ac.in`;
    studentActions.push({
      authId: cred.id,
      username: String(cred.username || "").trim(),
      realEmail,
      reset: true,
    });
  }

  const adminRows = [...adminNames].sort().map((username) => ({
    kind: "admin",
    oldUsername: username,
    newUsername: "",
    collision: "no",
    action: "excluded",
    detail: "admin account left unchanged",
  }));

  const counts = {
    students_to_reset: studentsToReset,
    students_skipped: studentsSkipped,
    faculty_to_reset: facultyActions.filter((item) => item.reset).length,
    faculty_to_rename: facultyActions.filter((item) => item.rename).length,
    faculty_unchanged: rows.filter((row) => row.kind === "faculty" && row.action === "unchanged").length,
    shared_unchanged: rows.filter((row) => row.action === "leave-unchanged").length,
    admins_excluded: adminRows.length,
    review: rows.filter((row) => row.action === "review").length,
  };

  return {
    rows: [...rows, ...adminRows],
    counts,
    facultyActions,
    studentActions,
  };
}

function renderCsv(plan) {
  const lines = [
    `# students_to_reset=${plan.counts.students_to_reset}`,
    `# students_skipped=${plan.counts.students_skipped}`,
    `# faculty_to_reset=${plan.counts.faculty_to_reset}`,
    `# faculty_to_rename=${plan.counts.faculty_to_rename}`,
    `# faculty_unchanged=${plan.counts.faculty_unchanged}`,
    `# shared_unchanged=${plan.counts.shared_unchanged}`,
    `# admins_excluded=${plan.counts.admins_excluded}`,
    `# review=${plan.counts.review}`,
    "kind,old_username,new_username,collision,action,detail",
  ];
  for (const row of plan.rows) {
    lines.push(
      [
        row.kind,
        row.oldUsername,
        row.newUsername,
        row.collision,
        row.action,
        row.detail,
      ]
        .map(csvField)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function isWriteSql(sql) {
  const stripped = String(sql || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim()
    .toLowerCase();
  return /^(update|insert|delete|alter|drop|create|truncate|grant|revoke)\b/.test(stripped);
}

async function loadState(authQuery, userQuery) {
  const credentials = await authQuery(
    'SELECT id, username, role, "mustChangePassword", "tokenVersion", "realEmail" FROM "AuthCredential"',
  );
  const faculty = await userQuery(
    'SELECT id, username, name, email, department, role FROM "FacultyProfile"',
  );
  const admins = await userQuery('SELECT username FROM "AdminProfile"');
  const students = await userQuery('SELECT username, email FROM "StudentProfile"');
  return {
    credentials: credentials.rows,
    faculty: faculty.rows,
    admins: admins.rows,
    students: students.rows,
  };
}

function parseArgs(argv) {
  let mode = process.env.LOGIN_REVAMP_MODE || "dry-run";
  let confirm = process.env.LOGIN_REVAMP_CONFIRM || "";
  for (const arg of argv) {
    if (arg === "--dry-run") mode = "dry-run";
    else if (arg === "--apply") mode = "apply";
    else if (arg.startsWith("--confirm=")) confirm = arg.slice("--confirm=".length);
  }
  if (mode !== "apply" && mode !== "dry-run") mode = "dry-run";
  return { mode, confirm };
}

function safeCode(error) {
  return (error && error.code) || "error";
}

function getPgPool(connString) {
  const { Pool } = require("pg");
  let schema = "public";
  let cleaned = connString;
  const parts = String(connString).split("?");
  if (parts.length > 1) {
    cleaned = parts[0];
    const query = new URLSearchParams(parts[1]);
    if (query.has("schema")) schema = query.get("schema");
  }
  const pool = new Pool({ connectionString: cleaned });
  pool.on("connect", (client) => {
    client.query(`SET search_path TO "${schema.replace(/"/g, "")}", public`);
  });
  return pool;
}

async function withTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await fn(client);
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* already closed */
    }
    throw error;
  } finally {
    client.release();
  }
}

async function hashTemplates(values) {
  const bcrypt = require("bcryptjs");
  const out = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await bcrypt.hash(values[index], 10);
    }
  }
  const workers = Math.min(4, Math.max(values.length, 1));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

async function applyPlan(authPool, userPool, plan) {
  const faculty = plan.facultyActions.filter((item) => item.reset || item.rename);
  const students = plan.studentActions.filter((item) => item.reset);
  let facultyUpdated = 0;
  let studentsUpdated = 0;
  let batches = 0;

  for (let offset = 0; offset < faculty.length; offset += BATCH) {
    const batch = faculty.slice(offset, offset + BATCH);
    const hashes = await hashTemplates(batch.map((item) => `${item.newUsername}@rguktong`));
    await withTransaction(authPool, async (client) => {
      for (let i = 0; i < batch.length; i += 1) {
        const item = batch[i];
        await client.query(
          `UPDATE "AuthCredential"
             SET username = $1,
                 "passwordHash" = $2,
                 "mustChangePassword" = true,
                 "tokenVersion" = "tokenVersion" + 1,
                 "realEmail" = $3,
                 "updatedAt" = NOW()
           WHERE id = $4`,
          [item.newUsername, hashes[i], item.realEmail, item.authId],
        );
        if (item.rename) {
          await client.query(
            `UPDATE "OtpLog" SET username = $1 WHERE lower(username) = lower($2)`,
            [item.newUsername, item.oldUsername],
          );
        }
      }
    });
    await withTransaction(userPool, async (client) => {
      for (const item of batch) {
        if (!item.rename) continue;
        await client.query(
          `UPDATE "FacultyProfile" SET username = $1, "updatedAt" = NOW() WHERE id = $2`,
          [item.newUsername, item.facultyId],
        );
        await client.query(
          `UPDATE "PushSubscription" SET username = $1, "updatedAt" = NOW() WHERE lower(username) = lower($2)`,
          [item.newUsername, item.oldUsername],
        );
      }
    });
    facultyUpdated += batch.length;
    batches += 1;
  }

  for (let offset = 0; offset < students.length; offset += BATCH) {
    const batch = students.slice(offset, offset + BATCH);
    const hashes = await hashTemplates(
      batch.map((item) => `${item.username.toLowerCase()}@rguktong`),
    );
    await withTransaction(authPool, async (client) => {
      for (let i = 0; i < batch.length; i += 1) {
        const item = batch[i];
        await client.query(
          `UPDATE "AuthCredential"
             SET "passwordHash" = $1,
                 "mustChangePassword" = true,
                 "tokenVersion" = "tokenVersion" + 1,
                 "realEmail" = CASE WHEN "realEmail" = '' THEN $2 ELSE "realEmail" END,
                 "updatedAt" = NOW()
           WHERE id = $3`,
          [hashes[i], item.realEmail, item.authId],
        );
      }
    });
    studentsUpdated += batch.length;
    batches += 1;
  }

  return { facultyUpdated, studentsUpdated, batches };
}

async function clearStatusCache() {
  const url = process.env.REDIS_URL || (process.env.LOGIN_REVAMP_IN_CLUSTER === "1" ? "redis://uniz-redis:6379" : "");
  if (!url) return 0;
  let Redis;
  try {
    Redis = require("ioredis");
  } catch {
    return 0;
  }
  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
  });
  try {
    await client.connect();
    let cursor = "0";
    let removed = 0;
    do {
      const reply = await client.scan(cursor, "MATCH", "user:status:*", "COUNT", 200);
      cursor = reply[0];
      const keys = reply[1] || [];
      if (keys.length) {
        removed += keys.length;
        await client.del(...keys);
      }
    } while (cursor !== "0");
    return removed;
  } finally {
    client.disconnect();
  }
}

/** Dry-run only: students whose only mailbox is empty, invalid, or the id@rguktong.ac.in placeholder. */
function studentMailboxReport(state) {
  const profiles = lowerMap(state.students || [], "username");
  const counts = { real: 0, empty: 0, placeholder: 0, invalid: 0 };
  const missing = [];
  for (const cred of state.credentials || []) {
    if (String(cred.role || "").trim().toLowerCase() !== "student") continue;
    if (accountKind(cred.username) !== "person") continue;
    const id = String(cred.username || "").trim().toLowerCase();
    const placeholder = `${id}@rguktong.ac.in`;
    const candidates = [cred.realEmail, profiles.get(id) && profiles.get(id).email]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);
    const real = candidates.find((email) => isDeliverableEmail(email) && email !== placeholder);
    if (real) {
      counts.real += 1;
      continue;
    }
    if (candidates.includes(placeholder)) counts.placeholder += 1;
    else if (candidates.length) counts.invalid += 1;
    else counts.empty += 1;
    missing.push(id);
  }
  const flags = { mustChange: 0, bumped: 0 };
  let webadmin = "missing";
  for (const cred of state.credentials || []) {
    const name = String(cred.username || "").trim().toLowerCase();
    if (name === "webadmin") {
      webadmin = `tokenVersion=${Number(cred.tokenVersion) || 0} mustChangePassword=${Boolean(cred.mustChangePassword)}`;
    }
    if (String(cred.role || "").trim().toLowerCase() !== "student") continue;
    if (accountKind(cred.username) !== "person") continue;
    if (cred.mustChangePassword) flags.mustChange += 1;
    if ((Number(cred.tokenVersion) || 0) >= 1) flags.bumped += 1;
  }
  const mask = (id) => (id.length <= 4 ? "****" : `${id.slice(0, 3)}${"*".repeat(id.length - 4)}${id.slice(-1)}`);
  return [
    `# students_real_email=${counts.real}`,
    `# students_no_real_email=${missing.length}`,
    `# students_no_email_empty=${counts.empty}`,
    `# students_no_email_placeholder=${counts.placeholder}`,
    `# students_no_email_invalid=${counts.invalid}`,
    `# students_must_change_password=${flags.mustChange}`,
    `# students_token_version_bumped=${flags.bumped}`,
    `# webadmin ${webadmin}`,
    `# students_no_email_sample=${missing.slice(0, 10).map(mask).join(" ")}`,
  ].join("\n") + "\n";
}

async function runLoginRevamp(options) {
  const mode = options.mode || "dry-run";
  const state = await loadState(options.authQuery, options.userQuery);
  const plan = planLoginRevamp(state);
  if (mode !== "apply") return { plan, applied: null, mailbox: studentMailboxReport(state) };
  if (options.confirm !== CONFIRM_PHRASE) {
    const error = new Error("confirm");
    error.code = "CONFIRM_REQUIRED";
    throw error;
  }
  if (!options.authPool || !options.userPool) {
    const error = new Error("pools");
    error.code = "POOLS_REQUIRED";
    throw error;
  }
  const applied = await applyPlan(options.authPool, options.userPool, plan);
  return { plan, applied };
}

async function main() {
  const { mode, confirm } = parseArgs(process.argv.slice(2));
  const authUrl = process.env.AUTH_DATABASE_URL || "";
  const userUrl = process.env.USER_DATABASE_URL || "";
  if (!authUrl || !userUrl) {
    console.error("AUTH_DATABASE_URL and USER_DATABASE_URL are required");
    process.exit(1);
  }
  if (mode === "apply" && confirm !== CONFIRM_PHRASE) {
    console.error("Refusing to apply without --confirm=LOGIN-REVAMP");
    process.exit(1);
  }

  const authPool = getPgPool(authUrl);
  const userPool = getPgPool(userUrl);
  const authQuery = (sql, params) => {
    if (mode !== "apply" && isWriteSql(sql)) {
      const error = new Error("dry-run write");
      error.code = "DRY_RUN_WRITE";
      throw error;
    }
    return authPool.query(sql, params);
  };
  const userQuery = (sql, params) => {
    if (mode !== "apply" && isWriteSql(sql)) {
      const error = new Error("dry-run write");
      error.code = "DRY_RUN_WRITE";
      throw error;
    }
    return userPool.query(sql, params);
  };

  try {
    const result = await runLoginRevamp({
      mode,
      confirm,
      authQuery,
      userQuery,
      authPool,
      userPool,
    });
    if (mode !== "apply") {
      const csv = renderCsv(result.plan);
      process.stdout.write("---LOGIN-REVAMP-CSV---\n");
      process.stdout.write(result.mailbox || "");
      process.stdout.write(csv);
      process.stdout.write("---END-LOGIN-REVAMP-CSV---\n");
      if (process.env.LOGIN_REVAMP_CSV) {
        require("fs").writeFileSync(process.env.LOGIN_REVAMP_CSV, csv);
      }
      return;
    }
    let cacheKeys = 0;
    try {
      cacheKeys = await clearStatusCache();
    } catch (error) {
      console.error(`cache_clear=${safeCode(error)}`);
    }
    process.stdout.write(
      [
        `students_updated=${result.applied.studentsUpdated}`,
        `faculty_updated=${result.applied.facultyUpdated}`,
        `batches=${result.applied.batches}`,
        `cache_keys_cleared=${cacheKeys}`,
        `students_to_reset=${result.plan.counts.students_to_reset}`,
        `faculty_to_reset=${result.plan.counts.faculty_to_reset}`,
        `shared_unchanged=${result.plan.counts.shared_unchanged}`,
        `admins_excluded=${result.plan.counts.admins_excluded}`,
      ].join("\n") + "\n",
    );
  } catch (error) {
    console.error(`login-revamp ${mode} failed: ${safeCode(error)}`);
    process.exitCode = 1;
  } finally {
    await authPool.end();
    await userPool.end();
  }
}

module.exports = {
  parsePersonName,
  tokenize,
  baseSlug,
  allocateSlug,
  slugCandidates,
  accountKind,
  planLoginRevamp,
  renderCsv,
  isWriteSql,
  runLoginRevamp,
  needsWork,
};

if (require.main === module) {
  main();
}
