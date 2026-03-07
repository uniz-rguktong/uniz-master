// prisma/seed_winners.js
// Seeds winner announcements for existing events with real student names

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Sample student names from backup (to make it more realistic than "Student Name 1")
const studentNames = [
  "Rahul Sharma",
  "Priya Patel",
  "Arun Kumar",
  "Sneha Reddy",
  "Vikram Singh",
  "Ananya Gupta",
  "Deepak Joshi",
  "Kavya Nair",
  "Rohan Mehta",
  "Ishita Verma",
  "Arjun Das",
  "Neha Kapoor",
  "Siddharth Roy",
  "Pooja Agarwal",
  "Karthik Rajan",
  "Divya Sharma",
  "Amit Desai",
  "Shreya Iyer",
  "Varun Malhotra",
  "Ritu Saxena",
  "Manish Tiwari",
  "Anjali Rao",
  "Suresh Babu",
  "Lakshmi Krishnan",
  "Gaurav Yadav",
  "Meera Sundaram",
  "Rajesh Pillai",
  "Shalini Menon",
  "Ajay Kulkarni",
  "Nisha Jain",
];

// Project names for hackathons/competitions
const projectNames = [
  "Smart Campus Navigator",
  "AI Study Assistant",
  "Green Energy Monitor",
  "Virtual Lab Platform",
  "Automated Attendance System",
  "IoT Weather Station",
  "Blockchain Voting System",
  "AR Campus Tour",
  "Smart Parking Solution",
  "Health Monitoring Wristband",
  "Waste Management Robot",
  "Traffic Prediction ML",
  "Voice-Controlled Drone",
  "Solar Tracking System",
  "Water Quality Analyzer",
];

// Team name prefixes
const teamPrefixes = [
  "Tech",
  "Code",
  "Cyber",
  "Digital",
  "Quantum",
  "Neural",
  "Alpha",
  "Omega",
  "Phoenix",
  "Spark",
];
const teamSuffixes = [
  "Warriors",
  "Innovators",
  "Pioneers",
  "Wizards",
  "Masters",
  "Titans",
  "Squad",
  "Force",
  "Crew",
  "Hub",
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTeamName() {
  return `${getRandomElement(teamPrefixes)} ${getRandomElement(teamSuffixes)}`;
}

function getRandomStudents(count = 3) {
  const shuffled = [...studentNames].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  console.log("🏆 Seeding Winner Announcements...\n");

  // Get all events that don't have winner announcements yet
  const events = await prisma.event.findMany({
    where: {
      winnerAnnouncement: null,
    },
    orderBy: { date: "asc" },
    take: 10, // Seed winners for 10 events
  });

  if (events.length === 0) {
    console.log("No events without winners found. Skipping.");
    return;
  }

  console.log(`Found ${events.length} events to seed winners for.\n`);

  let createdCount = 0;

  for (const event of events) {
    const isTeamEvent = ["Hackathon", "Competition", "Project Expo"].some(
      (cat) => event.category?.includes(cat) || event.title?.includes(cat),
    );

    // Generate positions (1st, 2nd, 3rd place)
    const positions = [];
    const prizes = [
      "₹10,000 + Trophy",
      "₹5,000 + Medal",
      "₹2,500 + Certificate",
    ];
    const individualPrizes = [
      "Trophy + Certificate",
      "Silver Medal + Certificate",
      "Bronze Medal + Certificate",
    ];

    for (let rank = 1; rank <= 3; rank++) {
      if (isTeamEvent) {
        // Team event - generate team with members
        positions.push({
          rank,
          teamName: generateTeamName(),
          members: getRandomStudents(3),
          project: getRandomElement(projectNames),
          prize: prizes[rank - 1],
          certificate: true,
        });
      } else {
        // Individual event
        positions.push({
          rank,
          teamName: null,
          members: getRandomStudents(1),
          project: null,
          prize: individualPrizes[rank - 1],
          certificate: true,
        });
      }
    }

    try {
      await prisma.winnerAnnouncement.create({
        data: {
          eventId: event.id,
          isPublished: Math.random() > 0.3, // 70% published, 30% draft
          publishedAt: Math.random() > 0.3 ? new Date() : null,
          positions: positions,
        },
      });

      console.log(
        `✅ Created winners for: ${event.title} (${event.category || "General"})`,
      );
      createdCount++;
    } catch (error) {
      if (error.code === "P2002") {
        console.log(`⏭️  Skipped (already exists): ${event.title}`);
      } else {
        console.error(`❌ Error for ${event.title}:`, error.message);
      }
    }
  }

  console.log(`\n🎉 Successfully seeded ${createdCount} winner announcements!`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
