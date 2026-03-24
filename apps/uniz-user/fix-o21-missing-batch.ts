import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.studentProfile.count({
    where: { 
      batch: "",
      username: { startsWith: "O21", mode: "insensitive" }
    }
  });
  console.log(`[Inspector] Found ${count} students with missing batch but O21 username prefix.`);

  if (count > 0) {
    const updated = await prisma.studentProfile.updateMany({
      where: { 
        batch: "",
        username: { startsWith: "O21", mode: "insensitive" }
      },
      data: { batch: "O21" }
    });
    console.log(`[Migrator] Successfully updated ${updated.count} students to batch O21.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
