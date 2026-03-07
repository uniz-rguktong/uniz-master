-- CreateTable
CREATE TABLE "Outpass" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentGender" TEXT NOT NULL DEFAULT 'M',
    "reason" TEXT NOT NULL,
    "fromDay" TIMESTAMP(3) NOT NULL,
    "toDay" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL DEFAULT 0,
    "requestedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "issuedBy" TEXT NOT NULL DEFAULT 'none',
    "issuedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    "rejectedBy" TEXT NOT NULL DEFAULT 'none',
    "rejectedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutTime" TIMESTAMP(3),
    "checkedInTime" TIMESTAMP(3),
    "currentLevel" TEXT NOT NULL DEFAULT 'caretaker',
    "approvalLogs" JSONB,

    CONSTRAINT "Outpass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outing" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentGender" TEXT NOT NULL DEFAULT 'M',
    "reason" TEXT NOT NULL,
    "fromTime" TIMESTAMP(3) NOT NULL,
    "toTime" TIMESTAMP(3) NOT NULL,
    "hours" INTEGER NOT NULL DEFAULT 0,
    "requestedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "issuedBy" TEXT NOT NULL DEFAULT 'none',
    "issuedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    "rejectedBy" TEXT NOT NULL DEFAULT 'none',
    "rejectedTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutTime" TIMESTAMP(3),
    "checkedInTime" TIMESTAMP(3),
    "currentLevel" TEXT NOT NULL DEFAULT 'caretaker',
    "approvalLogs" JSONB,

    CONSTRAINT "Outing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
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

-- CreateTable
CREATE TABLE "OtpLog" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "OtpLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Outpass_studentId_idx" ON "Outpass"("studentId");

-- CreateIndex
CREATE INDEX "Outpass_isApproved_isRejected_isExpired_idx" ON "Outpass"("isApproved", "isRejected", "isExpired");

-- CreateIndex
CREATE INDEX "Outing_studentId_idx" ON "Outing"("studentId");

-- CreateIndex
CREATE INDEX "Outing_isApproved_isRejected_isExpired_idx" ON "Outing"("isApproved", "isRejected", "isExpired");

-- CreateIndex
CREATE INDEX "Grievance_status_idx" ON "Grievance"("status");

-- CreateIndex
CREATE INDEX "Grievance_createdAt_idx" ON "Grievance"("createdAt");
