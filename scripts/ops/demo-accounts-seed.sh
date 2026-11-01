#!/usr/bin/env bash
# Seed 3 demo accounts (student, faculty, admin) on UniZ prod for the launch video.
# Usage: scripts/ops/demo-accounts-seed.sh <logins-file>
# The logins file has lines "USERNAME=password" for the 3 IDs below. Passwords are
# hashed locally with bcrypt; only hashes are sent to the pod. Runs inside the
# uniz-api pod using the app's own prisma clients (no secrets are read).
# Needs bcryptjs resolvable locally (npm ci, or NODE_PATH=/path/to/node_modules).
# Demo data is kept out of real lists: branch/section/batch/department = DEMO.
set -euo pipefail
FILE="${1:?logins file required}"
HOST="${UNIZ_HOST:-uniz-vps}"
cd "$(dirname "$0")/../.."
HASHES=$(node -e '
const fs=require("fs");const b=require("bcryptjs");const o={};
for (const l of fs.readFileSync(process.argv[1],"utf8").split("\n")) {
  const m=l.match(/^(DEMO-[A-Z]+-\d+)=(.+)$/); if(m) o[m[1]]=b.hashSync(m[2],10);
}
for (const k of ["DEMO-STUDENT-001","DEMO-FACULTY-001","DEMO-ADMIN-001"]) if(!o[k]) {console.error("missing "+k);process.exit(1)}
process.stdout.write(JSON.stringify(o));' "$FILE")

{ echo "const H=$HASHES;"; cat <<'JS'
const auth = require("/app/apps/uniz-auth/dist/utils/prisma.js").prisma;
const user = require("/app/apps/uniz-user/dist/utils/prisma.js").prisma;
(async () => {
  const accounts = [
    ["DEMO-STUDENT-001", "student"],
    ["DEMO-FACULTY-001", "teacher"],
    ["DEMO-ADMIN-001", "librarian"],
  ];
  for (const [u, role] of accounts) {
    await auth.authCredential.upsert({
      where: { username: u },
      update: { passwordHash: H[u], role, mustChangePassword: false, isDisabled: false },
      create: { username: u, passwordHash: H[u], role, mustChangePassword: false },
    });
  }
  const email = (u) => u.toLowerCase() + "@demo.uniz.invalid";
  await user.studentProfile.upsert({
    where: { username: "DEMO-STUDENT-001" }, update: {},
    create: { username: "DEMO-STUDENT-001", name: "Demo Student", email: email("DEMO-STUDENT-001"),
      gender: "Male", branch: "DEMO", year: "E1", semester: "SEM-1", section: "DEMO", batch: "DEMO",
      roomno: "DEMO-000", phone: "0000000000", fatherName: "Demo Parent", campus: "DEMO", category: "DEMO" },
  });
  await user.facultyProfile.upsert({
    where: { username: "DEMO-FACULTY-001" }, update: {},
    create: { username: "DEMO-FACULTY-001", name: "Demo Faculty", email: email("DEMO-FACULTY-001"),
      department: "DEMO", designation: "Demo Faculty", role: "teacher" },
  });
  await user.adminProfile.upsert({
    where: { username: "DEMO-ADMIN-001" }, update: {},
    create: { username: "DEMO-ADMIN-001", name: "Demo Admin", email: email("DEMO-ADMIN-001"),
      role: "librarian", designation: "Demo Admin", department: "DEMO" },
  });
  const c = await auth.authCredential.findMany({ where: { username: { startsWith: "DEMO-" } }, select: { username: true, role: true } });
  console.log(JSON.stringify(c));
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
JS
} | ssh "$HOST" 'kubectl exec -i deploy/uniz-api -c uniz-api -- sh -c "cd /app/apps/uniz-auth && node -"'
