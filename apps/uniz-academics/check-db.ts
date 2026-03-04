import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const semesters = await prisma.academicSemester.findMany();
  console.log("Semesters:", semesters);

  const allocations = await prisma.branchAllocation.findMany({
    include: { subject: true },
  });
  console.log("Allocations count:", allocations.length);
  const cseAllocations = allocations.filter((a) => a.branch === "CSE");
  console.log(
    "CSE Allocations:",
    cseAllocations.map((a) => ({
      code: a.subject.code,
      approved: a.isApproved,
    })),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
