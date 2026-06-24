import axios from "axios";
import { prisma } from "../utils/prisma";

const getGatewayBase = () =>
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-gateway-api:3000/api/v1"
    : process.env.GATEWAY_URL) || "http://localhost:3000/api/v1";

const clearPendingStatus = async (studentId: string) => {
  try {
    const SECRET = process.env.INTERNAL_SECRET;
    if (!SECRET && process.env.NODE_ENV === "production") {
      throw new Error("INTERNAL_SECRET missing");
    }
    const INTERNAL_SECRET = SECRET || "uniz-core";
    await axios.put(
      `${getGatewayBase()}/profile/student/status`,
      { username: studentId, isPending: false },
      { headers: { "x-internal-secret": INTERNAL_SECRET }, timeout: 5000 },
    );
  } catch (e: any) {
    console.error(
      `Failed to clear pending status for ${studentId}:`,
      e.message,
    );
  }
};

/** Expire stale outpass/outing requests and sync pending student flags. */
export const runMaintenance = async () => {
  console.log("[Outpass] Running maintenance job (expiry checks)...");
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      expiringPastOutpasses,
      expiringPastOutings,
      expiringApprovedOutpasses,
      expiringApprovedOutings,
    ] = await Promise.all([
      prisma.outpass.findMany({
        where: { toDay: { lt: now }, isExpired: false },
        select: { studentId: true },
      }),
      prisma.outing.findMany({
        where: { toTime: { lt: now }, isExpired: false },
        select: { studentId: true },
      }),
      prisma.outpass.findMany({
        where: {
          isApproved: true,
          isExpired: false,
          checkedOutTime: null,
          issuedTime: { lt: oneHourAgo },
        },
        select: { studentId: true },
      }),
      prisma.outing.findMany({
        where: {
          isApproved: true,
          isExpired: false,
          checkedOutTime: null,
          issuedTime: { lt: oneHourAgo },
        },
        select: { studentId: true },
      }),
    ]);

    const studentIdsToClear = [
      ...new Set([
        ...expiringPastOutpasses.map((r: { studentId: string }) => r.studentId),
        ...expiringPastOutings.map((r: { studentId: string }) => r.studentId),
        ...expiringApprovedOutpasses.map((r: { studentId: string }) => r.studentId),
        ...expiringApprovedOutings.map((r: { studentId: string }) => r.studentId),
      ]),
    ];

    const dateExpiredOutpasses = await prisma.outpass.updateMany({
      where: { toDay: { lt: now }, isExpired: false },
      data: { isExpired: true },
    });
    const dateExpiredOutings = await prisma.outing.updateMany({
      where: { toTime: { lt: now }, isExpired: false },
      data: { isExpired: true },
    });
    const approvalExpiredOutpasses = await prisma.outpass.updateMany({
      where: {
        isApproved: true,
        isExpired: false,
        checkedOutTime: null,
        issuedTime: { lt: oneHourAgo },
      },
      data: { isExpired: true },
    });
    const approvalExpiredOutings = await prisma.outing.updateMany({
      where: {
        isApproved: true,
        isExpired: false,
        checkedOutTime: null,
        issuedTime: { lt: oneHourAgo },
      },
      data: { isExpired: true },
    });

    try {
      const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();
      const pendingStudentsRes = await axios.post(
        `${getGatewayBase()}/profile/student/search`,
        { isApplicationPending: true, limit: 1000 },
        { headers: { "x-internal-secret": SECRET }, timeout: 10000 },
      );

      if (
        pendingStudentsRes.data?.success &&
        pendingStudentsRes.data.students?.length > 0
      ) {
        for (const { username } of pendingStudentsRes.data.students) {
          const [activeOutpass, activeOuting] = await Promise.all([
            prisma.outpass.findFirst({
              where: {
                studentId: username,
                isRejected: false,
                isExpired: false,
                checkedInTime: null,
                OR: [
                  { toDay: { gte: now } },
                  { checkedOutTime: { not: null } },
                ],
              },
            }),
            prisma.outing.findFirst({
              where: {
                studentId: username,
                isRejected: false,
                isExpired: false,
                checkedInTime: null,
                OR: [
                  { toTime: { gte: now } },
                  { checkedOutTime: { not: null } },
                ],
              },
            }),
          ]);

          if (!activeOutpass && !activeOuting) {
            console.log(`[Outpass] Auto-fixing stuck student: ${username}`);
            await clearPendingStatus(username);
          }
        }
      }
    } catch (cleanupErr: any) {
      console.error("[Outpass] Deep cleanup failed:", cleanupErr.message);
    }

    if (studentIdsToClear.length > 0) {
      await Promise.all(studentIdsToClear.map(clearPendingStatus));
    }

    console.log(
      `[Outpass] Maintenance complete: date expired=${dateExpiredOutpasses.count + dateExpiredOutings.count}, approval expired=${approvalExpiredOutpasses.count + approvalExpiredOutings.count}`,
    );
  } catch (e) {
    console.error("[Outpass] Maintenance job failed", e);
    throw e;
  }
};
