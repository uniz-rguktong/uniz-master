#!/usr/bin/env bash
# Remove the launch-video demo accounts and any rows keyed to them.
# Usage: scripts/ops/demo-accounts-cleanup.sh
# Deletes only rows whose username/studentId/etc. equals one of the 3 demo IDs.
set -euo pipefail
HOST="${UNIZ_HOST:-uniz-vps}"
cat <<'JS' | ssh "$HOST" 'kubectl exec -i deploy/uniz-api -c uniz-api -- sh -c "cd /app/apps/uniz-auth && node -"'
const IDS = ["DEMO-STUDENT-001", "DEMO-FACULTY-001", "DEMO-ADMIN-001"];
const KEYS = ["username", "studentId", "facultyId", "uploadedBy", "createdBy", "resolvedBy", "postedBy"];
const clients = {
  auth: "/app/apps/uniz-auth/dist/utils/prisma.js",
  user: "/app/apps/uniz-user/dist/utils/prisma.js",
  academics: "/app/apps/uniz-academics/dist/utils/prisma.util.js",
};
(async () => {
  for (const [name, path] of Object.entries(clients)) {
    let p;
    try { const m = require(path); p = m.prisma || m.default; } catch (e) { console.log(name, "skip"); continue; }
    const models = p._runtimeDataModel?.models || {};
    for (const [model, def] of Object.entries(models)) {
      const fields = def.fields.filter((f) => KEYS.includes(f.name) && f.type === "String").map((f) => f.name);
      if (!fields.length) continue;
      const key = model[0].toLowerCase() + model.slice(1);
      const r = await p[key].deleteMany({ where: { OR: fields.map((f) => ({ [f]: { in: IDS } })) } });
      if (r.count) console.log(name, model, "deleted", r.count);
    }
  }
  console.log("done");
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
JS
