-- getSemesters aggregates registered students per semester:
--   SELECT "semesterId", COUNT(DISTINCT ...) WHERE "status" = 'REGISTERED' GROUP BY "semesterId"
-- A (status, semesterId) composite serves that filter+group directly instead of
-- scanning the whole Registration table (~20k rows) on the cold (uncached) path.
-- CONCURRENTLY cannot run inside Prisma's migration transaction, so this is a
-- plain CREATE INDEX; the table is small enough that the brief lock is a non-issue.
CREATE INDEX IF NOT EXISTS "Registration_status_semesterId_idx" ON "Registration" ("status", "semesterId");
