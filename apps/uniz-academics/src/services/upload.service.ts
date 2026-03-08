import { redis } from "../utils/redis.util";
import prisma from "../utils/prisma.util";
import { mapGradeToPoint } from "../utils/helpers.util";
import axios from "axios";

const GATEWAY_URL = (
  process.env.GATEWAY_URL ||
  (process.env.DOCKER_ENV === "true"
    ? "http://uniz-gateway-api:3000/api/v1"
    : "http://uniz-gateway-api:3000/api/v1")
).replace(/\/$/, "");
const USER_SERVICE_URL = (
  process.env.USER_SERVICE_URL || `${GATEWAY_URL}/profile`
).replace(/\/$/, "");

const recordUploadHistory = async (data: any, retry = 0) => {
  try {
    // Attempt direct service call first with Loop Buster
    const url = `${USER_SERVICE_URL}/internal/upload-history?lb=${Math.random().toString(36).substring(7)}`;
    console.log(`[Worker] Recording upload history externally: ${url}`);
    await axios.post(url, data, {
      headers: {
        "x-internal-secret": process.env.INTERNAL_SECRET || "uniz-core",
      },
      timeout: 10000, // Increased timeout for history recording
    });
    console.log(`[Worker] Successfully recorded upload history.`);
  } catch (err: any) {
    if (retry < 1) {
      console.warn(
        `[Worker] History record failed: ${err.message}. Retrying in 2s...`,
      );
      await new Promise((r) => setTimeout(r, 2000));
      return recordUploadHistory(data, retry + 1);
    }
    console.error(
      "[Worker] Failed to record upload history after retry:",
      err.message,
    );
  }
};

export async function processNextBatch() {
  const jobString = await redis.lpop("job:queue");
  if (!jobString) return null;

  let job;
  try {
    job = JSON.parse(jobString);
  } catch (e) {
    console.error("Invalid job JSON", e);
    return null;
  }

  const {
    type,
    rows: remainingRows,
    user,
    uploadId,
    processed: initialProcessed = 0,
    total,
    filename,
    fileUrl,
    startTime = Date.now(),
    successCount: initialSuccess = 0,
    failCount: initialFail = 0,
    errors: initialErrors = [],
  } = job;

  let successCount = initialSuccess;
  let failCount = initialFail;
  let errors = initialErrors;

  // Ensure these are available in scope (redundant but safe)
  const totalRows = total;
  const currentUser = user;

  // Process up to 20 batches (1000 rows) in one execution to reduce Vercel hop count
  const BATCHES_PER_RUN = 20;
  const CHUNK_SIZE = 50;

  let processedInThisRun = 0;

  // Cache subjects once for all batches in this run
  const allSubjects = await prisma.subject.findMany();
  const subjectMap = new Map(allSubjects.map((s) => [s.code, s]));

  while (
    remainingRows.length > 0 &&
    processedInThisRun < BATCHES_PER_RUN * CHUNK_SIZE
  ) {
    const currentBatch = remainingRows.splice(0, CHUNK_SIZE);
    processedInThisRun += currentBatch.length;

    console.log(
      `[Worker] [${uploadId}] Processing batch of ${currentBatch.length} rows for ${user.username}. Remaining in job: ${remainingRows.length}. Processed in this run: ${processedInThisRun}`,
    );

    if (type === "GRADES") {
      // Parallel processing for speed
      await Promise.all(
        currentBatch.map(async (row: any) => {
          try {
            const getVal = (keys: string[]) => {
              const found = Object.keys(row).find((k) =>
                keys.includes(k.trim().toLowerCase()),
              );
              return found ? String(row[found]).trim() : "";
            };

            const studentId = getVal([
              "student id",
              "studentid",
              "id",
            ]).toUpperCase();
            const code = getVal([
              "subject code",
              "subjectcode",
              "code",
            ]).toUpperCase();
            const semesterId = getVal([
              "semester id",
              "semesterid",
              "semester",
            ]);
            const rawGrade = getVal(["grade (0-10)"]);
            const batchCol = getVal(["batch", "acad_batch", "academic_batch"]);

            if (!studentId || !code) throw new Error(`Missing fields`);
            const grade = mapGradeToPoint(rawGrade);
            const subject = subjectMap.get(code);
            if (!subject) throw new Error(`Subject [${code}] not found`);

            const targetSemester = semesterId || subject.semester || "SEM-1";

            let finalBatch = batchCol;
            if (!finalBatch && studentId) {
              const prefix = studentId.substring(0, 3);
              if (/^[A-Z]\d{2}$/.test(prefix)) finalBatch = prefix;
            }
            finalBatch = (finalBatch || "").toUpperCase();

            const existingGrade = await prisma.grade.findUnique({
              where: {
                studentId_subjectId_semesterId: {
                  studentId,
                  subjectId: subject.id,
                  semesterId: targetSemester,
                },
              },
            });

            // Determine if remedial (previous score was 0, now it's getting updated, typically to passing)
            let isRemedial = existingGrade?.isRemedial || false;
            // If previous was fail (0) & not remedial, and we are updating it now
            if (existingGrade && existingGrade.grade === 0 && grade !== 0) {
              isRemedial = true;
            } else if (
              existingGrade &&
              existingGrade.grade === 0 &&
              grade === 0
            ) {
              // Failed again in a remedial attempt -> still a remedial record, although it's up to policy. Let's strictly mark pass as remedial or keep it.
              // We'll mark as remedial if it's being updated after a long enough time, but just marking pass attempts is safer.
              isRemedial = existingGrade.isRemedial;
            }

            await prisma.grade.upsert({
              where: {
                studentId_subjectId_semesterId: {
                  studentId,
                  subjectId: subject.id,
                  semesterId: targetSemester,
                },
              },
              update: {
                grade,
                batch: finalBatch,
                isRemedial,
                updatedAt: new Date(),
              },
              create: {
                studentId,
                subjectId: subject.id,
                semesterId: targetSemester,
                grade,
                batch: finalBatch,
                isRemedial,
              },
            });
            successCount++;

            // Cache Invalidation
            await redis.del(`grades:${studentId}`);
            await redis.del(`profile:v2:${studentId}`);
          } catch (err: any) {
            if (failCount === 0) {
              console.error(`[Worker] [GRADES] First failure on row:`, row);
              console.error(`[Worker] [GRADES] Error:`, err.message);
            }
            failCount++;
            errors.push({
              row:
                initialProcessed +
                (successCount - initialSuccess) +
                (failCount - initialFail),
              studentId:
                (row as any).studentId ||
                (row as any)["Student ID"] ||
                "UNKNOWN",
              error: err.message,
            });
          }
        }),
      );
    } else if (type === "ATTENDANCE") {
      await Promise.all(
        currentBatch.map(async (row: any) => {
          try {
            const getVal = (keys: string[]) => {
              const found = Object.keys(row).find((k) =>
                keys.includes(k.trim().toLowerCase()),
              );
              return found ? String(row[found]).trim() : "";
            };

            const studentId = getVal([
              "student id",
              "studentid",
              "id",
            ]).toUpperCase();
            const code = getVal([
              "subject code",
              "subjectcode",
              "code",
            ]).toUpperCase();
            const semesterId = getVal([
              "semester id",
              "semesterid",
              "semester",
            ]);
            const attended =
              parseInt(
                getVal([
                  "total classes attended",
                  "attended classes",
                  "attended",
                ]),
              ) || 0;
            const totalClasses =
              parseInt(
                getVal(["total classes occurred", "total classes", "total"]),
              ) || 0;
            const batchCol = getVal(["batch", "acad_batch", "academic_batch"]);

            if (!studentId || !code)
              throw new Error("Missing Student ID or Subject Code");
            const subject = subjectMap.get(code);
            if (!subject) throw new Error(`Subject not found: ${code}`);

            let finalBatch = batchCol;
            if (!finalBatch && studentId) {
              const prefix = studentId.substring(0, 3);
              if (/^[A-Z]\d{2}$/.test(prefix)) finalBatch = prefix;
            }
            finalBatch = (finalBatch || "").toUpperCase();

            await prisma.attendance.upsert({
              where: {
                studentId_subjectId_semesterId: {
                  studentId,
                  subjectId: subject.id,
                  semesterId: semesterId || "SEM-1",
                },
              },
              update: {
                attendedClasses: attended,
                totalClasses: totalClasses,
                batch: finalBatch,
                updatedAt: new Date(),
              },
              create: {
                studentId,
                subjectId: subject.id,
                semesterId: semesterId || "SEM-1",
                attendedClasses: attended,
                totalClasses: totalClasses,
                batch: finalBatch,
              },
            });
            successCount++;

            // Cache Invalidation
            await redis.del(`attendance:${studentId}`);
            await redis.del(`profile:v2:${studentId}`);
          } catch (err: any) {
            failCount++;
            errors.push({
              row:
                initialProcessed +
                (successCount - initialSuccess) +
                (failCount - initialFail),
              studentId: (row as any).studentId || "UNKNOWN",
              error: err.message,
            });
          }
        }),
      );
    }

    // UPDATE PROGRESS AFTER EACH BATCH
    const currentProcessed = initialProcessed + processedInThisRun;
    const elapsed = Math.max(Date.now() - startTime, 1);
    const avgTimePerItem = elapsed / currentProcessed;
    const remainingCount = total - currentProcessed;
    const etaSeconds = Math.ceil((avgTimePerItem * remainingCount) / 1000);

    try {
      await redis.setex(
        `upload:progress:${uploadId}`,
        600,
        JSON.stringify({
          uploadId,
          status: currentProcessed >= total ? "done" : "processing",
          processed: currentProcessed,
          total,
          success: successCount,
          fail: failCount,
          percent: Math.round((currentProcessed / total) * 100),
          etaSeconds: currentProcessed >= total ? 0 : Math.max(etaSeconds, 1),
          debug_v: "2.5.0 - Service Worker (Resilient)",
          lastActive: Date.now(),
          errors: errors.slice(0, 20),
        }),
      );
    } catch (redisErr: any) {
      console.warn(
        `[Worker] Redis progress update failed: ${redisErr.message}`,
      );
    }
  } // End of while loop

  const newProcessed = initialProcessed + processedInThisRun;
  const elapsed = Math.max(Date.now() - startTime, 1);
  const avgTimePerItem = elapsed / newProcessed;
  const remainingCount = total - newProcessed;
  const etaSeconds = Math.ceil((avgTimePerItem * remainingCount) / 1000);

  try {
    await redis.setex(
      `upload:progress:${uploadId}`,
      600,
      JSON.stringify({
        uploadId,
        status: newProcessed >= total ? "done" : "processing",
        processed: newProcessed,
        total,
        success: successCount,
        fail: failCount,
        percent: Math.round((newProcessed / total) * 100),
        etaSeconds: newProcessed >= total ? 0 : Math.max(etaSeconds, 1),
        debug_v: `2.5.0 - Worker (${newProcessed}/${total} - ${remainingRows.length} left)`,
        lastActive: Date.now(),
        errors: errors.slice(0, 20),
      }),
    );
  } catch (redisErr: any) {
    console.error(
      `[Worker] FINAL Redis progress update failed: ${redisErr.message}`,
    );
  }

  if (remainingRows.length > 0) {
    // Re-queue remaining
    job.rows = remainingRows;
    job.processed = newProcessed;
    job.successCount = successCount;
    job.failCount = failCount;
    job.errors = errors;

    try {
      await redis.rpush("job:queue", JSON.stringify(job));
      return { status: "continued", remaining: remainingRows.length };
    } catch (redisErr: any) {
      console.error(`[Worker] FAILED TO RE-QUEUE JOB: ${redisErr.message}`);
      throw new Error("Redis Re-queue Failed"); // Fail loudly for now so we know
    }
  } else {
    await recordUploadHistory({
      type,
      filename: fileUrl ? fileUrl : filename,
      totalRows: total,
      successCount,
      failCount,
      errors: {
        fileUrl: fileUrl,
        originalName: filename,
        rowErrors: errors.slice(0, 50),
      },
      uploadedBy: user.username,
    });
    return { status: "completed" };
  }
}
