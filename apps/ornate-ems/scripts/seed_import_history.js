const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedImportHistory() {
  try {
    const admin = await prisma.admin.findFirst();

    if (!admin) {
      console.error(
        "No admin found in database. Please create an admin first.",
      );
      return;
    }

    const historyItems = [
      {
        action: "BULK_IMPORT_REGISTRATIONS",
        entityType: "REGISTRATION",
        entityId: "bulk",
        performedBy: admin.id,
        metadata: {
          filename: "fall_registrations_2025.csv",
          total: 156,
          successful: 150,
          failed: 6,
        },
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        action: "BULK_IMPORT_REGISTRATIONS",
        entityType: "REGISTRATION",
        entityId: "bulk",
        performedBy: admin.id,
        metadata: {
          filename: "workshop_attendees.xlsx",
          total: 45,
          successful: 45,
          failed: 0,
        },
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        action: "BULK_IMPORT_REGISTRATIONS",
        entityType: "REGISTRATION",
        entityId: "bulk",
        performedBy: admin.id,
        metadata: {
          filename: "hackathon_teams_v2.csv",
          total: 210,
          successful: 205,
          failed: 5,
        },
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ];

    for (const item of historyItems) {
      await prisma.auditLog.create({
        data: item,
      });
    }

    console.log("Successfully seeded 3 import history entries.");
  } catch (error) {
    console.error("Error seeding import history:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedImportHistory();
