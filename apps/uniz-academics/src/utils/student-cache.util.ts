import { redis } from "./redis.util";
import axios from "axios";

const USER_SERVICE_URL = (
  process.env.DOCKER_ENV === "true"
    ? "http://uniz-user-service:3002"
    : process.env.USER_SERVICE_URL || "http://127.0.0.1:3002"
).replace(/\/$/, "");

const INTERNAL_SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

/** Invalidate all server caches for one student after academic writes. */
export async function invalidateStudentAcademicCaches(
  studentId: string,
): Promise<void> {
  const id = studentId.toUpperCase();
  try {
    await redis.del(`grades_v3:${id}`, `grades:${id}`, `attendance_v1:${id}`);
  } catch {
    /* Redis optional */
  }
  try {
    await axios.post(
      `${USER_SERVICE_URL}/internal/invalidate-student-cache`,
      { username: id },
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
        timeout: 2000,
      },
    );
  } catch {
    /* best-effort */
  }
}
