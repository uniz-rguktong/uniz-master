const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Teams and Team Members...");

  // 1. Identify Team Events
  const teamEventTitles = [
    "CodeSprint Hackathon",
    "RoboWars v2.0",
    "Gaming Championship",
    "Startup Pitch Day",
  ];

  const teamEvents = await prisma.event.findMany({
    where: {
      title: { in: teamEventTitles },
    },
  });

  if (teamEvents.length === 0) {
    console.log(
      "⚠️ No team events found. Please run the main seed script first.",
    );
    return;
  }

  // Update eventType to 'team' for these events
  console.log('🔄 Updating event types to "team"...');
  await prisma.event.updateMany({
    where: {
      id: { in: teamEvents.map((e) => e.id) },
    },
    data: {
      eventType: "team",
      teamSizeMin: 2,
      teamSizeMax: 5,
    },
  });

  // 2. Fetch Students
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
  });

  if (students.length < 20) {
    console.log(
      "⚠️ Not enough students to form teams. Please seed more users.",
    );
    return;
  }

  // Helper arrays for random data
  const teamNamePrefixes = [
    "Code",
    "Robo",
    "Cyber",
    "Tech",
    "Data",
    "Web",
    "Net",
    "System",
    "Logic",
    "Byte",
  ];
  const teamNameSuffixes = [
    "Warriors",
    "Ninjas",
    "Masters",
    "Squad",
    "Crew",
    "Titans",
    "Spartans",
    "Wizards",
    "Gurus",
    "Knights",
  ];
  const statuses = [
    "PENDING",
    "CONFIRMED",
    "WAITLISTED",
    "ATTENDED",
    "CANCELLED",
  ];
  const paymentStatuses = ["PENDING", "PAID", "FAILED"];

  // Helper to get random array element
  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomDate = (start, end) =>
    new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );

  // 3. Create Teams per Event
  for (const event of teamEvents) {
    console.log(`\n🏆 Creating teams for event: ${event.title}`);

    // Create 4-6 teams per event
    const numTeams = Math.floor(Math.random() * 3) + 4;

    // Shuffle students to pick random groups
    const shuffledStudents = [...students].sort(() => 0.5 - Math.random());
    let studentIndex = 0;

    for (let i = 0; i < numTeams; i++) {
      // Ensure we have enough students left
      if (studentIndex + 5 > students.length) {
        studentIndex = 0; // Recycle students if we run out (for demo purposes)
        // Ideally in real scenarios we'd want unique students per event, but recycling is okay for seeding if needed.
        // Actually, let's just make sure we don't pick the same student twice for the SAME team.
        // Re-shuffling or continuing from 0 is fine as long as a student isn't in the same team twice.
        // A student can be in multiple teams for DIFFERENT events, but usually not multiple teams for SAME event.
        // The schema constraints: `@@unique([teamId, email])` prevents duplicate members in same team.
        // Logic below handles unique students per team iteration.
      }

      const teamSize = Math.floor(Math.random() * 3) + 2; // 2 to 4 members (leader + 1-3 members)

      // Select team members from shuffled list
      const teamMembers = [];
      for (let m = 0; m < teamSize; m++) {
        teamMembers.push(
          shuffledStudents[studentIndex % shuffledStudents.length],
        );
        studentIndex++;
      }

      const leader = teamMembers[0];
      const members = teamMembers.slice(1);

      const teamName = `${random(teamNamePrefixes)} ${random(teamNameSuffixes)} ${Math.floor(Math.random() * 100)}`;
      const teamCode = `TEAM-${event.id.substring(0, 4)}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      const status = random(statuses);
      const payStatus =
        status === "CONFIRMED" || status === "ATTENDED"
          ? "PAID"
          : random(paymentStatuses);
      const amount = event.price || 0;
      const txnId =
        payStatus === "PAID"
          ? `TXN${Math.floor(Math.random() * 1000000)}`
          : null;

      try {
        // Create Team Record
        const team = await prisma.team.create({
          data: {
            teamName,
            teamCode,
            eventId: event.id,
            leaderId: leader.id,
            leaderName: leader.name || "Unknown",
            leaderEmail: leader.email,
            leaderPhone: leader.phone,
            status,
            paymentStatus: payStatus,
            amount,
            transactionId: txnId,
            isLocked: status === "CONFIRMED",
            createdAt: randomDate(new Date(2025, 10, 1), new Date()),

            // Create Members
            members: {
              create: [
                // Leader as a member with LEADER role
                {
                  userId: leader.id,
                  name: leader.name || "Unknown",
                  email: leader.email,
                  phone: leader.phone,
                  rollNumber: `RN-${Math.floor(Math.random() * 10000)}`,
                  department: leader.branch || "CSE",
                  year: leader.currentYear || "III Year",
                  role: "LEADER",
                  status: "ACCEPTED",
                },
                // Other members
                ...members.map((m) => ({
                  userId: m.id,
                  name: m.name || "Unknown",
                  email: m.email,
                  phone: m.phone,
                  rollNumber: `RN-${Math.floor(Math.random() * 10000)}`,
                  department: m.branch || "CSE",
                  year: m.currentYear || "II Year",
                  role: "MEMBER",
                  status: "ACCEPTED",
                })),
              ],
            },
          },
          include: {
            members: true,
          },
        });

        // Create Registration Linked to Team
        await prisma.registration.create({
          data: {
            eventId: event.id,
            userId: leader.id, // Registration is linked to the leader for now or maybe just the team.
            // The schema allows `team Team?`.
            // We should probably link the registration to the user (leader) as well so it shows up in their dashboard?
            // Or maybe we treat team registrations differently.
            // The schema has `userId String?`.
            studentName: team.leaderName,
            studentId:
              team.members.find((m) => m.role === "LEADER")?.rollNumber ||
              "Unknown",
            status: team.status,
            paymentStatus: team.paymentStatus,
            amount: team.amount,
            transactionId: team.transactionId,
            team: {
              connect: { id: team.id },
            },
          },
        });

        console.log(
          `  ✅ Created team: ${team.teamName} (${team.members.length} members)`,
        );
      } catch (error) {
        console.error(`  ❌ Failed to create team ${teamName}:`, error.message);
      }
    }
  }

  console.log("\n✅ Team seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
