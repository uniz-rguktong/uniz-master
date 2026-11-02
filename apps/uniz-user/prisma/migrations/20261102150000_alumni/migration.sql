-- Additive only: alumni profiles (claimed by graduated students) and alumni job posts.
CREATE TABLE IF NOT EXISTS "AlumniProfile" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "branch" TEXT NOT NULL DEFAULT '',
    "batch" TEXT NOT NULL DEFAULT '',
    "graduationYear" INTEGER,
    "company" TEXT NOT NULL DEFAULT '',
    "jobTitle" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "linkedinUrl" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "visible" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AlumniProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AlumniProfile_username_key" ON "AlumniProfile"("username");
CREATE INDEX IF NOT EXISTS "AlumniProfile_visible_idx" ON "AlumniProfile"("visible");

CREATE TABLE IF NOT EXISTS "AlumniJob" (
    "id" UUID NOT NULL,
    "postedBy" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'full-time',
    "applyUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "deadline" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlumniJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AlumniJob_active_idx" ON "AlumniJob"("active");
