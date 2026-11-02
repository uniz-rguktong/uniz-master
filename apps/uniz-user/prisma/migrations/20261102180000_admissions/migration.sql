-- Additive only: admission cycles, applications, application documents.
CREATE TABLE IF NOT EXISTS "AdmissionCycle" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "programs" TEXT NOT NULL DEFAULT '',
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "feeInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "instructions" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdmissionCycle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdmissionCycle_name_key" ON "AdmissionCycle"("name");

CREATE TABLE IF NOT EXISTS "Application" (
    "id" UUID NOT NULL,
    "cycleId" UUID NOT NULL,
    "refNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dob" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "program" TEXT NOT NULL,
    "board" TEXT NOT NULL DEFAULT '',
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "guardian" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reviewNote" TEXT NOT NULL DEFAULT '',
    "reviewedBy" TEXT NOT NULL DEFAULT '',
    "feeStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Application_refNo_key" ON "Application"("refNo");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_cycleId_email_key" ON "Application"("cycleId", "email");
CREATE INDEX IF NOT EXISTS "Application_cycleId_status_idx" ON "Application"("cycleId", "status");

CREATE TABLE IF NOT EXISTS "ApplicationDocument" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");
