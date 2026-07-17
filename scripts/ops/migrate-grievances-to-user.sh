#!/usr/bin/env bash
# One-time: copy Grievance rows from uniz_outpass schema → uniz_user schema.
#
# Usage (on VPS / with psql access):
#   DATABASE_URL='postgresql://...' bash scripts/ops/migrate-grievances-to-user.sh
#
# Safe to re-run: ON CONFLICT DO NOTHING (by id).
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL required}"

psql "$DATABASE_URL" <<'SQL'
CREATE TABLE IF NOT EXISTS uniz_user."Grievance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "studentEmail" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Grievance_status_idx" ON uniz_user."Grievance"("status");
CREATE INDEX IF NOT EXISTS "Grievance_createdAt_idx" ON uniz_user."Grievance"("createdAt");

INSERT INTO uniz_user."Grievance" (
  id, "studentId", "studentEmail", category, description,
  "isAnonymous", status, "resolvedBy", resolution, "resolvedAt", "createdAt"
)
SELECT
  id, "studentId", "studentEmail", category, description,
  "isAnonymous", status, "resolvedBy", resolution, "resolvedAt", "createdAt"
FROM uniz_outpass."Grievance"
ON CONFLICT (id) DO NOTHING;

SELECT
  (SELECT COUNT(*) FROM uniz_outpass."Grievance") AS outpass_count,
  (SELECT COUNT(*) FROM uniz_user."Grievance") AS user_count;
SQL

echo "[migrate] grievance copy complete"
