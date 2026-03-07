const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function notifyAdmins(winner, runnerUp, sport, gender) {
  if (!winner) return;

  // Find Admins to notify
  // Primarily Sports Admin, but maybe Branch Admins of the winning/runner-up teams?
  // User request: "must notifi to admin personally if those are winners or runner."
  // Implies notifying the Branch Admins of the winning and runner-up branches.

  const branchesToNotify = [];

  // Extract branch from team name or ID if possible.
  // Assuming team names start with Branch code (e.g. "CSE Team A") or we can lookup the team.
  // My previous script registered them as "EEE", "CSE".

  // Simplistic branch extraction since we dealt with "EEE", "CSE" etc directly.
  const extractBranch = (name) => {
    if (!name) return null;
    const potentialBranch = name.split(" ")[0].toUpperCase();
    if (["CSE", "ECE", "EEE", "MECH", "CIVIL"].includes(potentialBranch)) {
      return potentialBranch;
    }
    return null;
  };

  const winnerBranch = extractBranch(winner);
  const runnerUpBranch = extractBranch(runnerUp);

  if (winnerBranch)
    branchesToNotify.push({
      branch: winnerBranch,
      type: "Winner",
      team: winner,
    });
  if (runnerUpBranch)
    branchesToNotify.push({
      branch: runnerUpBranch,
      type: "Runner-up",
      team: runnerUp,
    });

  console.log(`Notifying admins for: ${JSON.stringify(branchesToNotify)}`);

  for (const item of branchesToNotify) {
    // Find Branch Admin
    const admin = await prisma.admin.findFirst({
      where: {
        role: "BRANCH_ADMIN",
        branch: item.branch,
      },
    });

    if (admin) {
      const message = `Congratulations! Your branch team (${item.team}) has been declared the ${item.type} in ${gender} ${sport}. Certificates are ready for distribution.`;

      await prisma.notification.create({
        data: {
          senderId: "system",
          senderName: "System",
          senderRole: "SYSTEM",
          recipientId: admin.id, // Assuming Notification links to User/Admin ID? Schema says String.
          // Wait, schema check: recipientId String. usually links to Admin.id or User.id.
          // Code in winnerActions.js uses registration.user.id.
          // Admin model has id? Yes.

          message: message,
          type: "achievement",
          priority: "high",
        },
      });
      console.log(
        `   -> Notification sent to ${item.branch} Admin (${admin.email})`,
      );
    } else {
      console.log(`   -> No Admin found for ${item.branch}`);
    }
  }
}

// Example usage to test (triggered by the main logic later)
// notifyAdmins('CSE', 'EEE', 'Cricket', 'Boys');
