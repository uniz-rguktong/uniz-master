-- Webadmin overview summary reads StudentProfile with
--   COUNT(*) FILTER (WHERE "isSuspended" = false AND "isPresentInCampus" = ...)
-- and Grievance with GROUP BY category, status. These composites match those
-- filters so the aggregates do not seq-scan as the tables grow.
CREATE INDEX IF NOT EXISTS "StudentProfile_isSuspended_isPresentInCampus_idx"
  ON "StudentProfile" ("isSuspended", "isPresentInCampus");

CREATE INDEX IF NOT EXISTS "Grievance_category_status_idx"
  ON "Grievance" ("category", "status");
