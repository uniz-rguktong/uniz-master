-- Additive only: invigilation duties built from SeatingArrangement halls.
CREATE TABLE IF NOT EXISTS "ExamDuty" (
    "id" UUID NOT NULL,
    "semesterId" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "facultyUsername" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'invigilator',
    "swapTo" TEXT,
    "swapReason" TEXT,
    "swapStatus" TEXT,
    "swapDecidedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExamDuty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExamDuty_semesterId_examName_room_date_facultyUsername_key" ON "ExamDuty"("semesterId", "examName", "room", "date", "facultyUsername");
CREATE INDEX IF NOT EXISTS "ExamDuty_facultyUsername_date_idx" ON "ExamDuty"("facultyUsername", "date");
CREATE INDEX IF NOT EXISTS "ExamDuty_semesterId_examName_idx" ON "ExamDuty"("semesterId", "examName");
