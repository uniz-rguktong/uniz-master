// Update existing events in database with new metadata fields
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function updateEvents() {
  try {
    // Read the updated events JSON
    const eventsPath = path.join(
      process.cwd(),
      "prisma",
      "backups",
      "latest",
      "events.json",
    );
    const eventsData = JSON.parse(fs.readFileSync(eventsPath, "utf8"));

    console.log(`📊 Found ${eventsData.length} events to update`);

    let updated = 0;
    let notFound = 0;

    for (const eventData of eventsData) {
      try {
        // Check if event exists
        const existing = await prisma.event.findUnique({
          where: { id: eventData.id },
        });

        if (!existing) {
          console.log(`⚠️  Event not found: ${eventData.id}`);
          notFound++;
          continue;
        }

        // Update with new fields
        await prisma.event.update({
          where: { id: eventData.id },
          data: {
            eventType: eventData.eventType,
            teamSizeMin: eventData.teamSizeMin,
            teamSizeMax: eventData.teamSizeMax,
            locationType: eventData.locationType,
            shortDescription: eventData.shortDescription,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            endDate: eventData.endDate ? new Date(eventData.endDate) : null,
            minParticipants: eventData.minParticipants,
            waitlistEnabled: eventData.waitlistEnabled,
            coordinators: eventData.coordinators,
            eligibility: eventData.eligibility,
            customFields: eventData.customFields,
            prizes: eventData.prizes,
            rules: eventData.rules,
            documents: eventData.documents,
          },
        });

        updated++;
        console.log(`✅ Updated: ${eventData.title}`);
      } catch (error) {
        console.error(`❌ Error updating ${eventData.title}:`, error.message);
      }
    }

    console.log(`\n✨ Summary:`);
    console.log(`   Updated: ${updated} events`);
    console.log(`   Not found: ${notFound} events`);
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEvents();
