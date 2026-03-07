-- AlterTable
ALTER TABLE "BranchAllocation" ALTER COLUMN "academicYear" SET DEFAULT 'E1';

-- CreateTable
CREATE TABLE "SeatingArrangement" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "seatNumber" TEXT,
    "examName" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "time" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeatingArrangement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeatingArrangement_studentId_idx" ON "SeatingArrangement"("studentId");

-- CreateIndex
CREATE INDEX "SeatingArrangement_semesterId_idx" ON "SeatingArrangement"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "SeatingArrangement_studentId_subjectId_semesterId_examName_key" ON "SeatingArrangement"("studentId", "subjectId", "semesterId", "examName");

-- AddForeignKey
ALTER TABLE "SeatingArrangement" ADD CONSTRAINT "SeatingArrangement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatingArrangement" ADD CONSTRAINT "SeatingArrangement_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "AcademicSemester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
