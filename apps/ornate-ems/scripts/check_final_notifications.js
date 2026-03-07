const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkNotifications() {
  console.log("Checking recent notifications...");

  // 1. Get Admins for MECH and EEE
  // Assuming 'branch' is a field on Admin.
  const admins = await prisma.admin.findMany({
    where: {
      branch: { in: ["MECH", "EEE"] },
    },
  });

  console.log("Target Admins Found:", admins.length);
  admins.forEach((a) => console.log(`- ${a.name} (${a.branch}) - ${a.id}`));

  // 2. Fetch recent notifications
  const notifications = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: {
      recipientName: true,
      recipientRole: true,
      message: true,
      createdAt: true,
      senderName: true,
    },
  });

  console.log("\n--- Recent Notifications ---");
  if (notifications.length === 0) {
    console.log("No recent notifications found.");
  } else {
    notifications.forEach((n) => {
      console.log(
        `[${n.createdAt.toISOString()}] To: ${n.recipientName} (${n.recipientRole})`,
      );
      console.log(`   Msg: ${n.message}`);
      console.log("---");
    });
  }
}

checkNotifications()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
