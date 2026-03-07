require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const sportsData = [
  {
    title: "Basketball Tournament",
    category: "Indoor",
    customFields: { type: "BOYS", winnerPoints: 100, runnerPoints: 50 },
    posterUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=675&fit=crop",
    venue: "Indoor Sports Arena",
    date: new Date("2026-02-15"),
    time: "4:00 PM",
    maxCapacity: 16,
    status: "Ongoing",
    description: "Inter-branch Basketball Tournament for Boys.",
    eventType: "Competition",
  },
  {
    title: "Cricket Championship",
    category: "Outdoor",
    customFields: { type: "BOYS", winnerPoints: 150, runnerPoints: 75 },
    posterUrl:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&h=675&fit=crop",
    venue: "Main Sports Ground",
    date: new Date("2026-02-20"),
    time: "9:00 AM",
    maxCapacity: 32,
    status: "Upcoming",
    description: "Annual Cricket Championship.",
    eventType: "Competition",
  },
  {
    title: "Volleyball League",
    category: "Outdoor",
    customFields: { type: "GIRLS", winnerPoints: 80, runnerPoints: 40 },
    posterUrl:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&h=675&fit=crop",
    venue: "West Courts",
    date: new Date("2026-02-18"),
    time: "5:00 PM",
    maxCapacity: 12,
    status: "Ongoing",
    description: "Volleyball League for Girls.",
    eventType: "Competition",
  },
  {
    title: "Badminton Open",
    category: "Indoor",
    customFields: { type: "MIXED", winnerPoints: 60, runnerPoints: 30 },
    posterUrl:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&h=675&fit=crop",
    venue: "Physical Education Center",
    date: new Date("2026-02-25"),
    time: "10:00 AM",
    maxCapacity: 64,
    status: "Upcoming",
    description: "Open Badminton Tournament.",
    eventType: "Competition",
  },
  {
    title: "Kabaddi Tournament",
    category: "Outdoor",
    customFields: { type: "BOYS", winnerPoints: 100, runnerPoints: 50 },
    posterUrl:
      "https://images.unsplash.com/photo-1628548455644-8e104618ea70?w=1200&h=675&fit=crop",
    venue: "Kabaddi Ground",
    date: new Date("2026-03-05"), // TBD in mock, setting a date for DB
    time: "TBD",
    maxCapacity: 16,
    status: "Draft",
    description: "Kabaddi Tournament (Draft).",
    eventType: "Competition",
  },
  {
    title: "Kho-Kho Tournament",
    category: "Outdoor",
    customFields: { type: "BOYS", winnerPoints: 100, runnerPoints: 50 },
    posterUrl:
      "https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=1200&h=675&fit=crop",
    venue: "Kho-Kho Ground",
    date: new Date("2026-03-08"),
    time: "3:00 PM",
    maxCapacity: 16,
    status: "Draft",
    description: "Inter-branch Kho-Kho Tournament.",
    eventType: "Competition",
  },
  {
    title: "Volleyball League (Draft)",
    category: "Outdoor",
    customFields: { type: "GIRLS", winnerPoints: 80, runnerPoints: 40 },
    posterUrl:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&h=675&fit=crop",
    venue: "TBD",
    date: new Date("2026-03-10"), // TBD in mock
    time: "TBD",
    maxCapacity: 12,
    status: "Draft",
    description: "Draft Volleyball League.",
    eventType: "Competition",
  },
];

async function seedSports() {
  try {
    console.log("🌱 Seeding Sports Data...");

    // Find Sports Admin
    const sportsAdmin = await prisma.admin.findUnique({
      where: { email: "sports@admin.com" },
    });

    if (!sportsAdmin) {
      console.error("❌ Sports Admin not found. Please run main seed first.");
      process.exit(1);
    }

    console.log(`Found Sports Admin: ${sportsAdmin.id}`);

    for (const sport of sportsData) {
      const existing = await prisma.event.findFirst({
        where: {
          title: sport.title,
          creatorId: sportsAdmin.id,
        },
      });

      if (existing) {
        console.log(`- Sport already exists: ${sport.title}`);
        // Optional: Update if needed, but skipping for now to preserve manual changes
      } else {
        await prisma.event.create({
          data: {
            ...sport,
            creatorId: sportsAdmin.id,
            registrationOpen: true,
          },
        });
        console.log(`✅ Created Sport: ${sport.title}`);
      }
    }

    console.log("🎉 Sports seeding complete!");
  } catch (error) {
    console.error("Error seeding sports:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSports();
