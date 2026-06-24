-- AlterEnum: add HOD_REVIEW status to the semester workflow state machine
ALTER TYPE "SemesterStatus" ADD VALUE IF NOT EXISTS 'HOD_REVIEW';

-- AlterTable: semester configuration (academic year, batch, program, dates)
ALTER TABLE "AcademicSemester"
  ADD COLUMN IF NOT EXISTS "academicYear" TEXT,
  ADD COLUMN IF NOT EXISTS "batch" TEXT,
  ADD COLUMN IF NOT EXISTS "program" TEXT DEFAULT 'B.Tech',
  ADD COLUMN IF NOT EXISTS "registrationStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "registrationEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "semesterStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "semesterEnd" TIMESTAMP(3);

-- AlterTable: per-semester offering metadata
ALTER TABLE "BranchAllocation"
  ADD COLUMN IF NOT EXISTS "subjectType" TEXT DEFAULT 'CORE',
  ADD COLUMN IF NOT EXISTS "electiveGroupName" TEXT DEFAULT '';

-- AlterTable: registration submission timestamp
ALTER TABLE "Registration"
  ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);

-- AlterTable: denormalized subject snapshot for volatile subjects
ALTER TABLE "Grade"
  ADD COLUMN IF NOT EXISTS "subjectCode" TEXT,
  ADD COLUMN IF NOT EXISTS "subjectName" TEXT;

ALTER TABLE "Attendance"
  ADD COLUMN IF NOT EXISTS "subjectCode" TEXT,
  ADD COLUMN IF NOT EXISTS "subjectName" TEXT;

-- CreateTable: elective groups (a group of choices students pick from)
CREATE TABLE IF NOT EXISTS "ElectiveGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "semesterId" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "academicYear" TEXT DEFAULT '',
    "groupCode" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "selectionLimit" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectiveGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ElectiveGroup_semesterId_branch_groupCode_key" ON "ElectiveGroup"("semesterId", "branch", "groupCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ElectiveGroup_semesterId_idx" ON "ElectiveGroup"("semesterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ElectiveGroup_branch_idx" ON "ElectiveGroup"("branch");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ElectiveGroup_semesterId_fkey'
  ) THEN
    ALTER TABLE "ElectiveGroup" ADD CONSTRAINT "ElectiveGroup_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "AcademicSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill denormalized subject snapshots from catalog + overrides
UPDATE "Grade" g
SET
  "subjectCode" = s.code,
  "subjectName" = COALESCE(NULLIF(TRIM(g."subjectNameOverride"), ''), s.name)
FROM "Subject" s
WHERE g."subjectId" = s.id
  AND (g."subjectCode" IS NULL OR g."subjectName" IS NULL);

UPDATE "Attendance" a
SET
  "subjectCode" = s.code,
  "subjectName" = COALESCE(NULLIF(TRIM(a."subjectNameOverride"), ''), s.name)
FROM "Subject" s
WHERE a."subjectId" = s.id
  AND (a."subjectCode" IS NULL OR a."subjectName" IS NULL);
