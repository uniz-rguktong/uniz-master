-- Additive only: new tables for faculty leave and duties.
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" UUID NOT NULL,
    "facultyId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "fromDate" DATE NOT NULL,
    "toDate" DATE NOT NULL,
    "days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_hod',
    "hodBy" TEXT,
    "hodAt" TIMESTAMP(3),
    "hodNote" TEXT,
    "deanBy" TEXT,
    "deanAt" TIMESTAMP(3),
    "deanNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LeaveBalance" (
    "id" UUID NOT NULL,
    "facultyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveType" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DutyAssignment" (
    "id" UUID NOT NULL,
    "facultyId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "dutyType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DutyAssignment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeaveRequest_facultyId_idx" ON "LeaveRequest"("facultyId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_department_idx" ON "LeaveRequest"("status", "department");
CREATE UNIQUE INDEX IF NOT EXISTS "LeaveBalance_facultyId_year_leaveType_key" ON "LeaveBalance"("facultyId", "year", "leaveType");
CREATE INDEX IF NOT EXISTS "DutyAssignment_facultyId_date_idx" ON "DutyAssignment"("facultyId", "date");
CREATE INDEX IF NOT EXISTS "DutyAssignment_department_date_idx" ON "DutyAssignment"("department", "date");
