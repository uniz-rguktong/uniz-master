import crypto from "crypto";
import axios from "axios";
import prisma from "../utils/prisma";
import { redis } from "../utils/redis.util";
import { Actor, ModuleError, hasRole, requireRole } from "../utils/module-kit";

export const STAFF = ["webadmin", "director", "dean"];
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3007";
const otpKey = (u: string) => `alumni:otp:${u}`;
const hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const PUBLIC_FIELDS = {
  id: true,
  name: true,
  branch: true,
  batch: true,
  graduationYear: true,
  company: true,
  jobTitle: true,
  location: true,
  linkedinUrl: true,
  bio: true,
} as const;

const mask = (e: string) => e.replace(/^(.{2}).*(@.*)$/, "$1***$2");

/** Sends a 6 digit OTP to the email on the student profile. Valid 10 minutes. */
export async function claimStart(a: Actor) {
  requireRole(a, ["student"], "claim an alumni profile");
  const username = a.username.toUpperCase();
  const st = await prisma.studentProfile.findUnique({ where: { username } });
  if (!st) throw new ModuleError(404, "NOT_FOUND", "Student profile not found");
  if (!st.email)
    throw new ModuleError(400, "NO_EMAIL", "No email on your profile");
  const tries = Number(await redis.incr(`alumni:otp-tries:${username}`));
  await redis.expire(`alumni:otp-tries:${username}`, 3600);
  if (tries > 5)
    throw new ModuleError(429, "TOO_MANY", "Too many codes. Try in an hour");
  const otp = String(crypto.randomInt(100000, 1000000));
  await redis.setex(otpKey(username), 600, hash(otp));
  try {
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}/send`,
      { type: "otp", to: st.email, data: { username, otp } },
      {
        headers: {
          "x-internal-secret": (
            process.env.INTERNAL_SECRET || "uniz-core"
          ).trim(),
        },
        timeout: 5000,
      },
    );
  } catch {
    throw new ModuleError(
      503,
      "MAIL_DOWN",
      "Could not send the code. Try later",
    );
  }
  return { sentTo: mask(st.email) };
}

export async function claimVerify(a: Actor, otp: string) {
  requireRole(a, ["student"], "claim an alumni profile");
  const username = a.username.toUpperCase();
  const saved = await redis.get(otpKey(username));
  if (!saved || saved !== hash(otp))
    throw new ModuleError(400, "BAD_OTP", "Code is wrong or expired");
  await redis.del(otpKey(username));
  const st = await prisma.studentProfile.findUnique({ where: { username } });
  if (!st) throw new ModuleError(404, "NOT_FOUND", "Student profile not found");
  const base = {
    studentId: String(st.id),
    name: st.name,
    email: st.email,
    branch: st.branch,
    batch: st.batch,
    verifiedAt: new Date(),
  };
  return prisma.alumniProfile.upsert({
    where: { username },
    create: { username, ...base },
    update: base,
  });
}

export async function me(a: Actor) {
  return prisma.alumniProfile.findUnique({
    where: { username: a.username.toUpperCase() },
  });
}

export async function updateMe(a: Actor, data: Record<string, unknown>) {
  const p = await me(a);
  if (!p?.verifiedAt)
    throw new ModuleError(
      403,
      "NOT_CLAIMED",
      "Claim your alumni profile first",
    );
  return prisma.alumniProfile.update({ where: { id: p.id }, data });
}

/** Public, opt-in only, no email or username. */
export async function directory(q: {
  q?: string;
  batch?: string;
  branch?: string;
}) {
  const where: any = { visible: true, verifiedAt: { not: null } };
  if (q.batch) where.batch = q.batch.toUpperCase();
  if (q.branch) where.branch = q.branch.toUpperCase();
  if (q.q)
    where.OR = ["name", "company", "jobTitle", "location"].map((k) => ({
      [k]: { contains: q.q, mode: "insensitive" },
    }));
  return prisma.alumniProfile.findMany({
    where,
    select: PUBLIC_FIELDS,
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function all(a: Actor) {
  requireRole(a, STAFF, "see all alumni");
  return prisma.alumniProfile.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
}

export async function postJob(a: Actor, data: any) {
  if (!hasRole(a, STAFF)) {
    const p = await me(a);
    if (!p?.verifiedAt)
      throw new ModuleError(
        403,
        "NOT_CLAIMED",
        "Only verified alumni or staff can post jobs",
      );
  }
  return prisma.alumniJob.create({
    data: {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : null,
      postedBy: a.username,
    },
  });
}

export async function jobs() {
  return prisma.alumniJob.findMany({
    where: {
      active: true,
      OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function closeJob(a: Actor, id: string) {
  const j = await prisma.alumniJob.findUnique({ where: { id } });
  if (!j) throw new ModuleError(404, "NOT_FOUND", "Job not found");
  if (j.postedBy !== a.username) requireRole(a, STAFF, "close this job");
  return prisma.alumniJob.update({ where: { id }, data: { active: false } });
}
