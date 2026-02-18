import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanOtp() {
  console.log("Cleaning OTP logs...");
  try {
    // Delete all OTP logs to reset rate limits
    const deleted = await prisma.otpLog.deleteMany({});
    console.log(`Deleted ${deleted.count} OTP logs.`);
  } catch (error) {
    console.error("Error cleaning OTP logs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOtp();
