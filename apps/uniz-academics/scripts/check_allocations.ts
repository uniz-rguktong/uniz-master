import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sem = await prisma.academicSemester.findFirst({
    where: { name: "AY 2024-25 E3-SEM-1" },
  });

  if (!sem) {
    console.log("Semester not found");
    return;
  }

  console.log(`Semester ID: ${sem.id}`);

  const allocations = await prisma.branchAllocation.findMany({
    where: { semesterId: sem.id },
    include: { subject: true },
  });

  console.log(`Total Allocations: ${allocations.length}`);

  const approved = allocations.filter((a) => a.isApproved).length;
  console.log(`Approved Allocations: ${approved}`);

  const statusCounts = allocations.reduce((acc: any, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});
  console.log("Status Counts:", statusCounts);

  if (allocations.length > 0) {
    console.log("Sample allocation:", JSON.stringify(allocations[0], null, 2));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
