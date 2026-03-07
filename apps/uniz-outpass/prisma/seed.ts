import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding Outpass Service...");

  // 1. Clean up old data
  try {
    await prisma.outpass.deleteMany();
    await prisma.outing.deleteMany();
    console.log(" Deleted old outpass/outing data.");
  } catch (e) {
    console.warn("  Could not clean old data, proceeding...");
  }

  // 2. We don't necessarily seed outpasses, but we could add a sample one
  /*
  await prisma.outpass.create({
    data: {
      studentId: 'O210008',
      reason: 'Home Visit',
      fromDay: new Date(),
      toDay: new Date(Date.now() + 86400000 * 2),
      days: 2,
      currentLevel: 'caretaker'
    }
  });
  console.log(' Seeded Sample Outpass');
  */

  console.log(" Outpass Service reset finished (no default seed required).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
