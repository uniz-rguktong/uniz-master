const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const g = await prisma.grade.deleteMany({});
    const a = await prisma.attendance.deleteMany({});
    console.log(
      `Tables truncated. Deleted Grades: ${g.count}, Attendance: ${a.count}`,
    );
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
