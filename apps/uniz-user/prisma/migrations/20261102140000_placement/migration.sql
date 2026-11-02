-- Additive only: placement companies, drives, applications, offers.
CREATE TABLE IF NOT EXISTS "Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL DEFAULT '',
    "contact" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Company_name_key" ON "Company"("name");

CREATE TABLE IF NOT EXISTS "PlacementDrive" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "ctcLpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "branches" TEXT NOT NULL DEFAULT '',
    "batches" TEXT NOT NULL DEFAULT '',
    "minCgpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxBacklogs" INTEGER NOT NULL DEFAULT 99,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlacementDrive_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PlacementDrive_status_deadline_idx" ON "PlacementDrive"("status", "deadline");
CREATE INDEX IF NOT EXISTS "PlacementDrive_companyId_idx" ON "PlacementDrive"("companyId");

CREATE TABLE IF NOT EXISTS "DriveApplication" (
    "id" UUID NOT NULL,
    "driveId" UUID NOT NULL,
    "studentId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "resumeUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'applied',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DriveApplication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DriveApplication_driveId_username_key" ON "DriveApplication"("driveId", "username");
CREATE INDEX IF NOT EXISTS "DriveApplication_username_idx" ON "DriveApplication"("username");

CREATE TABLE IF NOT EXISTS "Offer" (
    "id" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "driveId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "ctcLpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'offered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Offer_applicationId_key" ON "Offer"("applicationId");
CREATE INDEX IF NOT EXISTS "Offer_username_idx" ON "Offer"("username");
CREATE INDEX IF NOT EXISTS "Offer_companyId_idx" ON "Offer"("companyId");
