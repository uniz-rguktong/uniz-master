-- CreateTable
CREATE TABLE "StaffRecord" (
    "id" UUID NOT NULL,
    "personType" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL DEFAULT '',
    "designation" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "cadre" TEXT NOT NULL DEFAULT '',
    "employmentType" TEXT NOT NULL DEFAULT 'regular',
    "joinedOn" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceEvent" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fromValue" TEXT NOT NULL DEFAULT '',
    "toValue" TEXT NOT NULL DEFAULT '',
    "details" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffRecord_personType_personId_key" ON "StaffRecord"("personType", "personId");
CREATE INDEX "StaffRecord_department_idx" ON "StaffRecord"("department");
CREATE INDEX "ServiceEvent_staffId_date_idx" ON "ServiceEvent"("staffId", "date");

-- AddForeignKey
ALTER TABLE "ServiceEvent" ADD CONSTRAINT "ServiceEvent_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
