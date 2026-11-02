import { describe, expect, it, vi } from "vitest";
import prisma from "../src/utils/prisma.util";
import * as svc from "../src/services/feedback.service";

const admin = { username: "dean", role: "dean" };
const student = { username: "o210008", role: "student" };
const fac = { username: "f1", role: "faculty" };
const FORM = "11111111-1111-4111-8111-111111111111";
const future = new Date(Date.now() + 86400000);
const openForm = {
  id: FORM,
  semesterId: "S1",
  subjectId: "sub-1",
  facultyUsername: "f1",
  title: "CS2001",
  questions: ["a", "b"],
  closesAt: future,
  status: "open",
};

describe("feedback aggregate", () => {
  it("hides results below 5 responses", () => {
    const r = svc.aggregate(["a"], [{ ratings: [5] }, { ratings: [4] }]);
    expect(r).toMatchObject({ hidden: true, responses: 2, minResponses: 5 });
    expect((r as any).questions).toBeUndefined();
  });

  it("averages per question at 5 or more", () => {
    const rows = [1, 2, 3, 4, 5].map((n) => ({
      ratings: [n, 5],
      comment: n === 1 ? "slow" : null,
    }));
    const r: any = svc.aggregate(["a", "b"], rows);
    expect(r.hidden).toBe(false);
    expect(r.questions[0].average).toBe(3);
    expect(r.questions[1].average).toBe(5);
    expect(r.comments).toEqual(["slow"]);
  });

  it("voter hash is stable and case insensitive", () => {
    expect(svc.voterHash(FORM, "o210008")).toBe(svc.voterHash(FORM, "O210008"));
    expect(svc.voterHash(FORM, "o210008")).not.toBe(
      svc.voterHash(FORM, "o210009"),
    );
  });
});

describe("feedback service", () => {
  it("createForm needs admin", async () => {
    await expect(
      svc.createForm(fac, {
        semesterId: "S1",
        subjectId: "sub-1",
        closesAt: future.toISOString(),
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("createForm uses default questions", async () => {
    vi.mocked(prisma.subject.findUnique).mockResolvedValueOnce({
      id: "sub-1",
      code: "CS2001",
      name: "DS",
    });
    vi.mocked(prisma.academicSemester.findUnique).mockResolvedValueOnce({
      id: "S1",
    });
    vi.mocked(prisma.feedbackForm.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.feedbackForm.create).mockImplementationOnce(
      async ({ data }: any) => data,
    );
    const f: any = await svc.createForm(admin, {
      semesterId: "S1",
      subjectId: "sub-1",
      closesAt: future.toISOString(),
    });
    expect(f.questions).toEqual(svc.DEFAULT_QUESTIONS);
    expect(f.title).toBe("CS2001 DS");
  });

  it("submit rejects students not registered", async () => {
    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce(openForm);
    vi.mocked(prisma.registration.findFirst).mockResolvedValueOnce(null);
    await expect(
      svc.submit(student, FORM, { ratings: [5, 5] }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("submit rejects wrong answer count", async () => {
    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce(openForm);
    vi.mocked(prisma.registration.findFirst).mockResolvedValueOnce({ id: "r" });
    await expect(
      svc.submit(student, FORM, { ratings: [5] }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("submit stores no student id and blocks repeats", async () => {
    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce(openForm);
    vi.mocked(prisma.registration.findFirst).mockResolvedValueOnce({ id: "r" });
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([]);
    await svc.submit(student, FORM, { ratings: [5, 4], comment: " ok " });
    const call = vi
      .mocked(prisma.feedbackResponse.create)
      .mock.calls.at(-1)![0] as any;
    expect(JSON.stringify(call)).not.toMatch(/o210008/i);

    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce(openForm);
    vi.mocked(prisma.registration.findFirst).mockResolvedValueOnce({ id: "r" });
    vi.mocked(prisma.$transaction).mockRejectedValueOnce({ code: "P2002" });
    await expect(
      svc.submit(student, FORM, { ratings: [5, 4] }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("results only for admin or own faculty", async () => {
    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce(openForm);
    await expect(
      svc.results({ username: "f2", role: "faculty" }, FORM),
    ).rejects.toMatchObject({ status: 403 });
    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce(openForm);
    vi.mocked(prisma.feedbackResponse.findMany).mockResolvedValueOnce([]);
    const r: any = await svc.results(fac, FORM);
    expect(r.hidden).toBe(true);
  });

  it("students cannot read results", async () => {
    vi.mocked(prisma.feedbackForm.findUnique).mockResolvedValueOnce(openForm);
    await expect(svc.results(student, FORM)).rejects.toMatchObject({
      status: 403,
    });
  });
});
