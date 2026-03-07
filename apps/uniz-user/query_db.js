const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasourceUrl:
    "postgresql://neondb_owner:REDACTED_DB_KEY@ep-red-queen-a12hqixj.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&schema=notifications_v2",
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
