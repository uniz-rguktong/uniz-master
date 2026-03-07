-- CreateEnum
CREATE TYPE "SemesterStatus" AS ENUM ('DRAFT', 'DEAN_REVIEW', 'APPROVED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('DEAN_PENDING', 'HOD_REVIEW', 'APPROVED');

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "isRemedial" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AcademicSemester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SemesterStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSemester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "photo" TEXT,
    "department" TEXT NOT NULL,
    "designation" TEXT DEFAULT 'Assistant Professor',
    "role" TEXT NOT NULL DEFAULT 'FACULTY',
    "bio" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchAllocation" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "academicYear" TEXT DEFAULT 'E4',
    "subjectId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "customName" TEXT,
    "customCredits" INTEGER,
    "status" "AllocationStatus" NOT NULL DEFAULT 'DEAN_PENDING',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "electiveGroupId" TEXT DEFAULT '',
    "electiveLimit" INTEGER DEFAULT 1,

    CONSTRAINT "BranchAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_email_key" ON "Faculty"("email");

-- CreateIndex
CREATE INDEX "Faculty_department_idx" ON "Faculty"("department");

-- CreateIndex
CREATE INDEX "BranchAllocation_branch_idx" ON "BranchAllocation"("branch");

-- CreateIndex
CREATE INDEX "BranchAllocation_semesterId_idx" ON "BranchAllocation"("semesterId");

-- CreateIndex
CREATE INDEX "BranchAllocation_academicYear_idx" ON "BranchAllocation"("academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "BranchAllocation_branch_subjectId_semesterId_key" ON "BranchAllocation"("branch", "subjectId", "semesterId");

-- CreateIndex
CREATE INDEX "Registration_studentId_idx" ON "Registration"("studentId");

-- CreateIndex
CREATE INDEX "Registration_semesterId_idx" ON "Registration"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_studentId_subjectId_semesterId_key" ON "Registration"("studentId", "subjectId", "semesterId");

-- AddForeignKey
ALTER TABLE "BranchAllocation" ADD CONSTRAINT "BranchAllocation_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchAllocation" ADD CONSTRAINT "BranchAllocation_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "AcademicSemester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "AcademicSemester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
