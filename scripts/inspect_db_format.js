const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const subjects = await prisma.subject.findMany({
    take: 5,
    select: { code: true, semester: true },
  });
  console.log("Sample Subjects:", JSON.stringify(subjects, null, 2));

  const grades = await prisma.grade.findMany({
    where: { studentId: "O210008" },
    take: 5,
    select: { subjectId: true, semesterId: true, grade: true },
  });
  console.log("Sample Grades for O210008:", JSON.stringify(grades, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
