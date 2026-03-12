const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasourceUrl: process.env.NOTIFICATION_DATABASE_URL || process.env.DATABASE_URL,
});
async function run() {
  const total = await prisma.studentProfile.count();
  const uploads = await prisma.uploadHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log(JSON.stringify({ total, uploads }, null, 2));
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
