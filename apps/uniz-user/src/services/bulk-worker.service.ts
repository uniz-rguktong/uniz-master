import { PrismaClient } from "@prisma/client";
import { redis } from "../utils/redis.util";
import axios from "axios";

const prisma = new PrismaClient();
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";

const BRANCH_MAP: Record<string, string> = {
  "COMPUTER SCIENCE AND ENGINEERING": "CSE",
  "ELECTRONICS AND COMMUNICATION ENGINEERING": "ECE",
  "ELECTRICAL AND ELECTRONICS ENGINEERING": "EEE",
  "MECHANICAL ENGINEERING": "MECH",
  "CIVIL ENGINEERING": "CIVIL",
  "CHEMICAL ENGINEERING": "CHEM",
  "METALLURGICAL AND MATERIALS ENGINEERING": "MME",
  "METALLURGY AND MATERIALS ENGINEERING": "MME",
};

const mapBranch = (name: string) => {
  const upper = (name || "").trim().toUpperCase();
  return BRANCH_MAP[upper] || upper;
};

export async function processNextStudentBatch() {
  const jobString = await redis.lpop("student:job:queue");
  if (!jobString) return null;

  let job;
  try {
    job = JSON.parse(jobString);
  } catch (e) {
    console.error("[Bulk] Invalid student job JSON", e);
    return null;
  }

  const {
    rows: remainingRows,
    username,
    uploadId,
    processed: initialProcessed = 0,
    total,
    fileUrl,
    startTime = Date.now(),
    successCount: initialSuccess = 0,
    failCount: initialFail = 0,
    errors: initialErrors = [],
    majorityBatch,
  } = job;

  let successCount = initialSuccess;
  let failCount = initialFail;
  let errors = initialErrors;

  // Process up to 6 batches (300 rows) in one execution to provide frequent UI updates
  const BATCHES_PER_RUN = 6;
  const CHUNK_SIZE = 50;
  let processedInThisRun = 0;

  console.log(
    `[Bulk] [${uploadId}] Starting Student Worker Run for ${username}. Total: ${total}`,
  );

  while (
    remainingRows.length > 0 &&
    processedInThisRun < BATCHES_PER_RUN * CHUNK_SIZE
  ) {
    const currentBatch = remainingRows.splice(0, CHUNK_SIZE);
    processedInThisRun += currentBatch.length;

    await Promise.all(
      currentBatch.map(async (row: any, indexInChunk: number) => {
        const getVal = (keys: string[]) => {
          const found = Object.keys(row).find((k) =>
            keys.includes(k.trim().toLowerCase()),
          );
          if (!found) return "";
          const val = row[found];
          if (val && typeof val === "object") {
            return (val as any).text ? String((val as any).text).trim() : "";
          }
          return val ? String(val).trim() : "";
        };

        const id = getVal([
          "student id",
          "studentid",
          "student_id",
          "id",
          "username",
        ]).toUpperCase();
        const name = getVal(["name", "student name", "student_name"]);
        const email = getVal(["email", "mail", "student_email"]);
        const gender = getVal(["gender", "sex"]);
        const branch = mapBranch(
          getVal(["branch", "department", "allocation_branch"]),
        );
        const year = getVal(["year", "class", "academic_year"]).toUpperCase();
        const section = getVal(["section", "sec"]).toUpperCase();
        const phone = getVal(["phone", "mobile", "contact"]);
        const batchCol = getVal(["batch", "acad_batch", "academic_batch"]);

        const category = getVal(["category", "admission category", "caste"]);
        const campus = getVal(["campus", "center", "location"]);

        if (!id) {
          failCount++;
          errors.push({ row: "unknown", error: "Missing Student ID" });
          return;
        }

        const finalEmail = email || `${id.toLowerCase()}@rguktong.ac.in`;
        const finalYear = year || "E1";
        const finalSection =
          !section || ["UNKNOWN", "GENERAL"].includes(section)
            ? Math.floor(Math.random() * 4 + 1).toString()
            : section;

        let finalBatch = batchCol;
        if (!finalBatch && id) {
          const prefix = id.substring(0, 3);
          if (/^[A-Z]\d{2}$/.test(prefix)) finalBatch = prefix;
        }
        if (!finalBatch) finalBatch = majorityBatch;
        finalBatch = (finalBatch || "").toUpperCase();

        try {
          await prisma.studentProfile.upsert({
            where: { username: id },
            update: {
              name,
              email: finalEmail,
              gender,
              branch,
              year: finalYear,
              section: finalSection,
              batch: finalBatch,
              phone,
              category,
              campus,
              updatedAt: new Date(),
            },
            create: {
              username: id,
              name,
              email: finalEmail,
              gender,
              branch,
              year: finalYear,
              section: finalSection,
              batch: finalBatch,
              phone,
              category,
              campus,
            },
          });
          successCount++;
          await redis.del(`profile:v2:${id}`);

          // Auth Sync
          try {
            await axios.post(
              `${AUTH_SERVICE_URL}/signup`,
              {
                username: id,
                password: `${id}@rguktong`,
                role: "student",
                email: finalEmail,
              },
              {
                headers: { "x-internal-secret": INTERNAL_SECRET },
                timeout: 5000,
              },
            );
          } catch (e: any) {
            // console.warn(`Auth sync fail for ${id}: ${e.message}`);
          }
        } catch (dbErr: any) {
          failCount++;
          errors.push({ id, error: dbErr.message });
        }
      }),
    );

    const processedCount =
      initialProcessed +
      (successCount - initialSuccess) +
      (failCount - initialFail);

    // Calculate ETA
    const elapsed = Math.max(Date.now() - startTime, 1);
    const avgTimePerItem = elapsed / processedCount;
    const remainingCount = total - processedCount;
    const etaSeconds =
      processedCount >= total
        ? 0
        : Math.ceil((avgTimePerItem * remainingCount) / 1000);

    await redis.setex(
      `student:upload:progress:${username}`,
      3600,
      JSON.stringify({
        status: processedCount >= total ? "done" : "processing",
        processed: processedCount,
        total,
        success: successCount,
        fail: failCount,
        percent: Math.round((processedCount / total) * 100),
        etaSeconds: Math.max(etaSeconds, 0),
        errors: errors.slice(-20),
        lastActive: Date.now(),
        startTime,
      }),
    );
  }

  const finalProcessedCount =
    initialProcessed +
    (successCount - initialSuccess) +
    (failCount - initialFail);
  if (finalProcessedCount < total) {
    // Re-queue remaining
    await redis.rpush(
      "student:job:queue",
      JSON.stringify({
        ...job,
        rows: remainingRows,
        processed: finalProcessedCount,
        successCount,
        failCount,
        errors: errors.slice(-100),
      }),
    );
    return { status: "continued", processedInThisRun, total };
  } else {
    // Record history
    try {
      await prisma.uploadHistory.create({
        data: {
          type: "STUDENTS",
          filename: fileUrl || "unknown.xlsx",
          totalRows: total,
          successCount,
          failCount,
          uploadedBy: username,
          status:
            failCount === 0
              ? "COMPLETED"
              : successCount > 0
                ? "PARTIAL"
                : "FAILED",
          errors: { rowErrors: errors.slice(0, 50) },
        },
      });
    } catch (e) {}
    return { status: "done", processed: finalProcessedCount };
  }
}
