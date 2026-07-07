-- Per-semester academic/display subject code (official RGUKT-style codes on slips & sheets).
ALTER TABLE "BranchAllocation" ADD COLUMN IF NOT EXISTS "customCode" TEXT;
