-- BestOutgoingStudent schema update for Super Admin outgoing students
-- 1) Rename cgpa -> rating
-- 2) Remove deprecated fields placementStatus and package

ALTER TABLE "BestOutgoingStudent"
  RENAME COLUMN "cgpa" TO "rating";

ALTER TABLE "BestOutgoingStudent"
  DROP COLUMN IF EXISTS "placementStatus",
  DROP COLUMN IF EXISTS "package";