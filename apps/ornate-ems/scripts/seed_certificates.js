const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding certificate-ready events...");

  // Find an admin to be the creator
  const admin = await prisma.admin.findFirst();
  if (!admin) {
    console.error(
      "No admin found. Please create an admin in the database first.",
    );
    return;
  }

  const eventsData = [
    {
      title: "Global Tech Summit 2025",
      category: "Technical",
      date: new Date("2025-05-15"),
      creatorId: admin.id,
      certificateStatus: "DRAFT",
      venue: "Main Auditorium",
      description: "A global tech summit",
      maxCapacity: 500,
      price: 0,
    },
    {
      title: "Annual Sports Meet 2025",
      category: "Sports",
      date: new Date("2025-06-20"),
      creatorId: admin.id,
      certificateStatus: "DRAFT",
      venue: "Stadium",
      description: "Annual sports meet",
      maxCapacity: 1000,
      price: 0,
    },
    {
      title: "Cultural Fest: Kalakriti 2025",
      category: "Cultural",
      date: new Date("2025-07-10"),
      creatorId: admin.id,
      certificateStatus: "DRAFT",
      venue: "Open Air Theater",
      description: "Cultural festival",
      maxCapacity: 2000,
      price: 0,
    },
  ];

  for (const data of eventsData) {
    const existing = await prisma.event.findFirst({
      where: { title: data.title },
    });

    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data: data,
      });
      console.log(`Updated event: ${data.title}`);
    } else {
      await prisma.event.create({
        data: data,
      });
      console.log(`Created event: ${data.title}`);
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
