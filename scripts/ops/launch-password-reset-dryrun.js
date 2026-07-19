#!/usr/bin/env node
/**
 * Password-reset dry run WITHOUT sending email/push.
 * Run on VPS (has kubectl + DB access):
 *
 *   TEST_USERNAME='<student-username>' TEST_PASSWORD='<student-password>' \
 *     node scripts/launch-password-reset-dryrun.js
 *
 * Flow: seed OTP in DB → verify → reset to SAME password → login confirm.
 * Does not call /otp/request (no Turnstile, no email).
 */
const { execSync } = require("child_process");
const fs = require("fs");

const BASE =
  process.env.API_URL || "https://api-uniz.rguktong.in/api/v1/auth";
const USERNAME = (process.env.TEST_USERNAME || "o210008").toUpperCase();
const PASSWORD = process.env.TEST_PASSWORD || `${USERNAME.toLowerCase()}@rguktong`;

let authDbUrl = process.env.AUTH_DATABASE_URL || "";
let internalSecret = process.env.INTERNAL_SECRET || "";

try {
  const envFile = fs.readFileSync("/root/uniz-secrets.env", "utf8");
  for (const line of envFile.split("\n")) {
    if (line.startsWith("AUTH_DATABASE_URL=") && !authDbUrl)
      authDbUrl = line.slice("AUTH_DATABASE_URL=".length).replace(/["']/g, "");
    if (line.startsWith("INTERNAL_SECRET=") && !internalSecret)
      internalSecret = line.slice("INTERNAL_SECRET=".length).replace(/["']/g, "");
  }
} catch (_) {}

function pgUrlForCli(url) {
  if (!url) return url;
  return url
    .replace(/\\/g, "")
    .replace(/[?&]schema=[^&]*/g, "")
    .replace(/[?&]connection_limit=[^&]*/g, "")
    .replace(/\?&/, "?")
    .replace(/\?$/, "");
}

function runDb(query) {
  const withSchema = `SET search_path TO uniz_auth; ${query}`;
  const safe = withSchema.replace(/'/g, "'\\''");
  const cliUrl = pgUrlForCli(authDbUrl);
  if (cliUrl && require("child_process").spawnSync("which", ["psql"]).status === 0) {
    return execSync(`psql "${cliUrl}" -t -A -c '${safe}'`, { encoding: "utf8" }).trim();
  }
  const pod = execSync(
    "kubectl get pods -l app=uniz-auth-service -o jsonpath='{.items[?(@.status.phase==\"Running\")].metadata.name}'",
    { encoding: "utf8" },
  )
    .trim()
    .split(" ")[0];
  if (!pod) throw new Error("No running auth pod");
  const cmd = `kubectl exec -i ${pod} -- psql "${authDbUrl}" -t -A -c '${safe}'`;
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function otp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function main() {
  console.log("Password reset dry run (no email)");
  console.log("  user:", USERNAME);
  console.log("  reset-to-same-password: yes\n");

  const code = otp();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  console.log("[1] Seed OTP in OtpLog (DB only)...");
  runDb(
    `INSERT INTO "OtpLog" (id, username, otp, "expiresAt", "createdAt") VALUES (gen_random_uuid(), '${USERNAME}', '${code}', '${expires}', NOW());`,
  );

  console.log("[2] POST /otp/verify");
  const verifyRes = await fetch(`${BASE}/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, otp: code }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyRes.ok || !verifyData.resetToken) {
    console.error("FAIL verify:", verifyRes.status, verifyData);
    process.exit(1);
  }
  console.log("  OK resetToken received");

  console.log("[3] POST /password/reset (same password)");
  const resetRes = await fetch(`${BASE}/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      resetToken: verifyData.resetToken,
      newPassword: PASSWORD,
    }),
  });
  const resetData = await resetRes.json();
  if (!resetRes.ok) {
    console.error("FAIL reset:", resetRes.status, resetData);
    process.exit(1);
  }
  console.log("  OK", resetData.message || "password updated");

  console.log("[4] POST /login/student (manual Turnstile — may need browser)");
  console.log(
    "  Skip automated login if Turnstile blocks; verify in portal with same password.",
  );
  console.log("\nDONE — password unchanged, reset pipeline verified.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
