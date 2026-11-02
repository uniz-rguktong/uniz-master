-- Additive only: clubs, members, events, consultancy projects.
CREATE TABLE IF NOT EXISTS "Club" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'technical',
    "description" TEXT NOT NULL DEFAULT '',
    "coordinators" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Club_name_key" ON "Club"("name");

CREATE TABLE IF NOT EXISTS "ClubMember" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClubMember_clubId_username_key" ON "ClubMember"("clubId", "username");
CREATE INDEX IF NOT EXISTS "ClubMember_username_idx" ON "ClubMember"("username");

CREATE TABLE IF NOT EXISTS "ClubEvent" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "venue" TEXT NOT NULL DEFAULT '',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "infoItemId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClubEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ClubEvent_clubId_idx" ON "ClubEvent"("clubId");

CREATE TABLE IF NOT EXISTS "ConsultancyProject" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "faculty" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "valueInr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConsultancyProject_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ConsultancyProject_status_idx" ON "ConsultancyProject"("status");
