import { PrismaClient } from "@prisma/client";
import { mapGradeToPoint } from "./src/utils/helpers.util";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testRemedial() {
  const studentId = "TEST_STUDENT_001";
  const subjectCode = "CSE-E1-SEM-1-01";
  const semesterId = "SEM-1";

  console.log("--- Testing Remedial Logic ---");

  // 1. Get subject
  const subject = await prisma.subject.findUnique({
    where: { code: subjectCode },
  });
  if (!subject) {
    console.error("Subject not found!");
    return;
  }

  // 2. Clear existing test data
  await prisma.grade.deleteMany({
    where: { studentId, subjectId: subject.id, semesterId },
  });

  console.log("Stage 1: Inserting initial FAIL (R)");
  // Simulate first upload: Student fails
  const initialGrade = 0; // 'R'
  await prisma.grade.create({
    data: {
      studentId,
      subjectId: subject.id,
      semesterId,
      grade: initialGrade,
      batch: "O21",
      isRemedial: false,
    },
  });

  let gradeRec = await prisma.grade.findUnique({
    where: {
      studentId_subjectId_semesterId: {
        studentId,
        subjectId: subject.id,
        semesterId,
      },
    },
  });
  console.log("Initial Record:", gradeRec);

  console.log("\nStage 2: Uploading Remedial PASS (EX)");
  // Simulate second upload: Student passes remedial
  const newGrade = 10; // 'EX'

  // Logic from upload.service.ts
  const existingGrade = await prisma.grade.findUnique({
    where: {
      studentId_subjectId_semesterId: {
        studentId,
        subjectId: subject.id,
        semesterId,
      },
    },
  });

  let isRemedial = existingGrade?.isRemedial || false;
  if (existingGrade && existingGrade.grade === 0 && newGrade !== 0) {
    isRemedial = true;
  }

  await prisma.grade.upsert({
    where: {
      studentId_subjectId_semesterId: {
        studentId,
        subjectId: subject.id,
        semesterId,
      },
    },
    update: { grade: newGrade, isRemedial, updatedAt: new Date() },
    create: {
      studentId,
      subjectId: subject.id,
      semesterId,
      grade: newGrade,
      isRemedial,
    },
  });

  gradeRec = await prisma.grade.findUnique({
    where: {
      studentId_subjectId_semesterId: {
        studentId,
        subjectId: subject.id,
        semesterId,
      },
    },
  });
  console.log("Updated Record (Should be Remedial):", gradeRec);

  if (gradeRec?.isRemedial === true) {
    console.log("\n✅ SUCCESS: Record marked as remedial!");
  } else {
    console.log("\n❌ FAILURE: Record NOT marked as remedial.");
  }

  // Cleanup
  // await prisma.grade.deleteMany({ where: { studentId } });
}

testRemedial()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
