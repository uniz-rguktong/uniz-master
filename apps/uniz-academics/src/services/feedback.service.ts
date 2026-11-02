import { createHash } from "node:crypto";
import { isFeatureEnabled, resolveEffectiveRole } from "@uniz/shared";
import prisma from "../utils/prisma.util";

export const FEEDBACK_ADMIN_ROLES = ["coe", "dean", "director", "webadmin"];
export const FACULTY_ROLES = ["faculty", "teacher", "hod"];
export const MIN_RESPONSES = 5;
export const DEFAULT_QUESTIONS = [
  "The subject was taught clearly",
  "Classes started and ended on time",
  "Doubts were answered well",
  "Assignments and tests were fair",
  "Overall, I learned a lot",
];

export type Actor = { username: string; role?: string };

export class FeedbackError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const feedbackEnabled = () => isFeatureEnabled("FEATURE_FEEDBACK");
export const roleOf = (a: Actor) => resolveEffectiveRole(a);
export const isFeedbackAdmin = (a: Actor) =>
  FEEDBACK_ADMIN_ROLES.includes(roleOf(a));
export const isFaculty = (a: Actor) => FACULTY_ROLES.includes(roleOf(a));
export const isStudent = (a: Actor) => roleOf(a) === "student";

function requireAdmin(a: Actor) {
  if (!isFeedbackAdmin(a)) {
    throw new FeedbackError(
      403,
      "FORBIDDEN",
      "Only the exam cell or Dean can do this",
    );
  }
}

/** One-way, salted. Same student + form always gives the same hash. */
export function voterHash(formId: string, username: string) {
  const salt =
    process.env.FEEDBACK_SALT ||
    process.env.JWT_SECURITY_KEY ||
    "uniz-feedback";
  return createHash("sha256")
    .update(`${salt}:${formId}:${username.toUpperCase()}`)
    .digest("hex");
}

const isOpen = (f: any, now = new Date()) =>
  f.status === "open" && new Date(f.closesAt) > now;

export async function createForm(
  actor: Actor,
  input: {
    semesterId: string;
    subjectId: string;
    facultyUsername?: string;
    title?: string;
    questions?: string[];
    closesAt: string;
  },
) {
  requireAdmin(actor);
  const subject = await prisma.subject.findUnique({
    where: { id: input.subjectId },
  });
  if (!subject) throw new FeedbackError(404, "NOT_FOUND", "Subject not found");
  const semester = await prisma.academicSemester.findUnique({
    where: { id: input.semesterId },
  });
  if (!semester)
    throw new FeedbackError(404, "NOT_FOUND", "Semester not found");
  const closesAt = new Date(input.closesAt);
  if (!(closesAt > new Date())) {
    throw new FeedbackError(
      400,
      "VALIDATION_ERROR",
      "Closing date must be in the future",
    );
  }
  const facultyUsername = input.facultyUsername?.trim() || null;
  const existing = await prisma.feedbackForm.findFirst({
    where: {
      semesterId: input.semesterId,
      subjectId: input.subjectId,
      facultyUsername,
    },
  });
  if (existing)
    throw new FeedbackError(
      409,
      "ALREADY_EXISTS",
      "A form already exists for this subject and faculty",
    );
  return prisma.feedbackForm.create({
    data: {
      semesterId: input.semesterId,
      subjectId: input.subjectId,
      facultyUsername,
      title: input.title?.trim() || `${subject.code} ${subject.name}`,
      questions: input.questions?.length ? input.questions : DEFAULT_QUESTIONS,
      closesAt,
      createdBy: actor.username,
    },
  });
}

export async function listForms(actor: Actor, semesterId?: string) {
  requireAdmin(actor);
  const forms = await prisma.feedbackForm.findMany({
    where: semesterId ? { semesterId } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const counts = await countsFor(forms.map((f: any) => f.id));
  return forms.map((f: any) => ({ ...f, responses: counts.get(f.id) || 0 }));
}

export async function closeForm(actor: Actor, id: string) {
  requireAdmin(actor);
  const f = await prisma.feedbackForm.findUnique({ where: { id } });
  if (!f) throw new FeedbackError(404, "NOT_FOUND", "Form not found");
  return prisma.feedbackForm.update({
    where: { id },
    data: { status: "closed" },
  });
}

async function countsFor(ids: string[]) {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;
  const rows: any[] = await (prisma.feedbackResponse.groupBy as any)({
    by: ["formId"],
    where: { formId: { in: ids } },
    _count: { _all: true },
  });
  for (const r of rows || []) map.set(r.formId, r._count?._all || 0);
  return map;
}

/** Open forms for subjects this student is registered for, minus ones already answered. */
export async function formsForStudent(actor: Actor) {
  if (!isStudent(actor))
    throw new FeedbackError(403, "FORBIDDEN", "Only students give feedback");
  const regs: any[] = await prisma.registration.findMany({
    where: { studentId: actor.username.toUpperCase(), status: "REGISTERED" },
    select: { subjectId: true, semesterId: true },
  });
  if (regs.length === 0) return [];
  const forms: any[] = await prisma.feedbackForm.findMany({
    where: {
      status: "open",
      closesAt: { gt: new Date() },
      OR: regs.map((r) => ({
        subjectId: r.subjectId,
        semesterId: r.semesterId,
      })),
    },
    orderBy: { closesAt: "asc" },
  });
  if (forms.length === 0) return [];
  const receipts: any[] = await prisma.feedbackReceipt.findMany({
    where: {
      OR: forms.map((f) => ({
        formId: f.id,
        voterHash: voterHash(f.id, actor.username),
      })),
    },
  });
  const done = new Set(receipts.map((r) => r.formId));
  return forms.map((f) => ({
    id: f.id,
    title: f.title,
    facultyUsername: f.facultyUsername,
    questions: f.questions,
    closesAt: f.closesAt,
    answered: done.has(f.id),
  }));
}

export async function submit(
  actor: Actor,
  formId: string,
  input: { ratings: number[]; comment?: string },
) {
  if (!isStudent(actor))
    throw new FeedbackError(403, "FORBIDDEN", "Only students give feedback");
  const form = await prisma.feedbackForm.findUnique({ where: { id: formId } });
  if (!form || !isOpen(form))
    throw new FeedbackError(404, "NOT_FOUND", "This form is not open");
  const reg = await prisma.registration.findFirst({
    where: {
      studentId: actor.username.toUpperCase(),
      subjectId: form.subjectId,
      semesterId: form.semesterId,
      status: "REGISTERED",
    },
  });
  if (!reg)
    throw new FeedbackError(
      403,
      "FORBIDDEN",
      "You are not registered for this subject",
    );
  const qs = (form.questions as string[]) || [];
  if (input.ratings.length !== qs.length) {
    throw new FeedbackError(
      400,
      "VALIDATION_ERROR",
      `Answer all ${qs.length} questions`,
    );
  }
  const hash = voterHash(formId, actor.username);
  try {
    await prisma.$transaction([
      prisma.feedbackReceipt.create({ data: { formId, voterHash: hash } }),
      prisma.feedbackResponse.create({
        data: {
          formId,
          ratings: input.ratings,
          comment: input.comment?.trim() || null,
        },
      }),
    ]);
  } catch (e: any) {
    if (e?.code === "P2002")
      throw new FeedbackError(
        409,
        "ALREADY_ANSWERED",
        "You already gave feedback for this",
      );
    throw e;
  }
  return { ok: true };
}

/** Pure: averages per question. Hidden below MIN_RESPONSES. */
export function aggregate(
  questions: string[],
  rows: Array<{ ratings: any; comment?: string | null }>,
) {
  if (rows.length < MIN_RESPONSES) {
    return {
      responses: rows.length,
      hidden: true,
      minResponses: MIN_RESPONSES,
    };
  }
  const per = questions.map((q, i) => {
    const vals = rows
      .map((r) => Number((r.ratings as number[])[i]))
      .filter((v) => v >= 1 && v <= 5);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { question: q, average: Math.round(avg * 100) / 100 };
  });
  const comments = rows
    .map((r) => r.comment)
    .filter((c): c is string => !!c)
    .sort();
  return { responses: rows.length, hidden: false, questions: per, comments };
}

export async function results(actor: Actor, formId: string) {
  const form = await prisma.feedbackForm.findUnique({ where: { id: formId } });
  if (!form) throw new FeedbackError(404, "NOT_FOUND", "Form not found");
  const own = isFaculty(actor) && form.facultyUsername === actor.username;
  if (!isFeedbackAdmin(actor) && !own)
    throw new FeedbackError(403, "FORBIDDEN", "Not your form");
  const rows: any[] = await prisma.feedbackResponse.findMany({
    where: { formId },
    select: { ratings: true, comment: true },
  });
  return {
    form: { id: form.id, title: form.title, closesAt: form.closesAt },
    ...aggregate(form.questions as string[], rows),
  };
}

export async function myForms(actor: Actor) {
  if (!isFaculty(actor))
    throw new FeedbackError(403, "FORBIDDEN", "Only faculty see this");
  const forms = await prisma.feedbackForm.findMany({
    where: { facultyUsername: actor.username },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const counts = await countsFor(forms.map((f: any) => f.id));
  return forms.map((f: any) => ({
    id: f.id,
    title: f.title,
    semesterId: f.semesterId,
    closesAt: f.closesAt,
    responses: counts.get(f.id) || 0,
  }));
}
