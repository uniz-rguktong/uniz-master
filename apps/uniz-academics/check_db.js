const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
    },
  },
});

async function check() {
  const grades = await prisma.grade.findMany({
    where: { studentId: "o210008" },
  });
  console.log("Grades found for o210008:", grades.length);

  const allGrades = await prisma.grade.count();
  console.log("Total grades in DB:", allGrades);

  const subjects = await prisma.subject.count();
  console.log("Total subjects in DB:", subjects);
}

check().finally(() => prisma.$disconnect());
