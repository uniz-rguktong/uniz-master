-- Create Grievance table in user schema (moved from uniz_outpass)
CREATE TABLE IF NOT EXISTS "Grievance" (
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

CREATE INDEX IF NOT EXISTS "Grievance_status_idx" ON "Grievance"("status");
CREATE INDEX IF NOT EXISTS "Grievance_createdAt_idx" ON "Grievance"("createdAt");
