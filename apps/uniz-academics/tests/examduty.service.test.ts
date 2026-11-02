import { describe, expect, it, vi } from "vitest";
import prisma from "../src/utils/prisma.util";
import * as svc from "../src/services/examduty.service";

const admin = { username: "coe1", role: "coe" };
const fac = { username: "f1", role: "faculty" };
const d = new Date("2026-11-20T00:00:00.000Z");

describe("examduty planner", () => {
  it("sizes halls by student count", () => {
    expect(svc.invigilatorsFor(0)).toBe(1);
    expect(svc.invigilatorsFor(30)).toBe(1);
    expect(svc.invigilatorsFor(31)).toBe(2);
    expect(svc.invigilatorsFor(500)).toBe(3);
  });

  it("never double-books a slot and balances load", () => {
    const halls = [
      { room: "A1", date: "2026-11-20", time: "10:00", students: 40 },
      { room: "A2", date: "2026-11-20", time: "10:00", students: 20 },
      { room: "A1", date: "2026-11-21", time: "10:00", students: 20 },
    ];
    const plan = svc.planDuties(halls, ["f1", "f2", "f3", " f3 "]);
    expect(plan).toHaveLength(4);
    const slot1 = plan
      .filter((p) => p.date === "2026-11-20")
      .map((p) => p.facultyUsername);
    expect(new Set(slot1).size).toBe(3);
    expect(plan[0].role).toBe("chief");
    expect(plan[1].role).toBe("invigilator");
  });

  it("fails when the pool is too small", () => {
    expect(() =>
      svc.planDuties(
        [{ room: "A1", date: "2026-11-20", time: null, students: 90 }],
        ["f1"],
      ),
    ).toThrow(svc.ExamDutyError);
  });
});

describe("examduty service", () => {
  it("groups SeatingArrangement rows into halls", async () => {
    vi.mocked(prisma.seatingArrangement.findMany).mockResolvedValueOnce([
      { room: "A1", date: d, time: "10:00" },
      { room: "A1", date: d, time: "10:00" },
      { room: "B1", date: null, time: null },
    ]);
    const halls = await svc.listHalls("S1", "MID-1");
    expect(halls).toEqual([
      { room: "A1", date: "2026-11-20", time: "10:00", students: 2 },
    ]);
  });

  it("generate requires the exam cell", async () => {
    await expect(
      svc.generate(fac, {
        semesterId: "S1",
        examName: "MID-1",
        faculty: ["f1"],
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("generate refuses to overwrite without replace", async () => {
    vi.mocked(prisma.seatingArrangement.findMany).mockResolvedValueOnce([
      { room: "A1", date: d, time: null },
    ]);
    vi.mocked(prisma.examDuty.count).mockResolvedValueOnce(3);
    await expect(
      svc.generate(admin, {
        semesterId: "S1",
        examName: "MID-1",
        faculty: ["f1"],
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("generate writes duties", async () => {
    vi.mocked(prisma.seatingArrangement.findMany).mockResolvedValueOnce([
      { room: "A1", date: d, time: null },
    ]);
    vi.mocked(prisma.examDuty.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.examDuty.createMany).mockResolvedValueOnce({ count: 1 });
    const out = await svc.generate(admin, {
      semesterId: "S1",
      examName: "MID-1",
      faculty: ["f1"],
    });
    expect(out).toEqual({ halls: 1, duties: 1 });
    expect(prisma.examDuty.createMany).toHaveBeenCalled();
  });

  it("swap only on own duty", async () => {
    vi.mocked(prisma.examDuty.findUnique).mockResolvedValueOnce({
      id: "x",
      facultyUsername: "other",
    });
    await expect(
      svc.requestSwap(fac, "x", "f2", "family event"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("approving a swap blocks slot clashes", async () => {
    vi.mocked(prisma.examDuty.findUnique).mockResolvedValueOnce({
      id: "x",
      facultyUsername: "f1",
      swapTo: "f2",
      swapStatus: "pending",
      date: d,
      time: null,
    });
    vi.mocked(prisma.examDuty.findFirst).mockResolvedValueOnce({ id: "y" });
    await expect(svc.decideSwap(admin, "x", true)).rejects.toMatchObject({
      status: 409,
    });
  });

  it("approving a swap moves the duty", async () => {
    vi.mocked(prisma.examDuty.findUnique).mockResolvedValueOnce({
      id: "x",
      facultyUsername: "f1",
      swapTo: "f2",
      swapStatus: "pending",
      date: d,
      time: null,
      room: "A1",
    });
    vi.mocked(prisma.examDuty.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.examDuty.update).mockResolvedValueOnce({
      id: "x",
      facultyUsername: "f2",
    });
    const r = await svc.decideSwap(admin, "x", true);
    expect(r.facultyUsername).toBe("f2");
  });

  it("reports sms as not configured without keys", () => {
    expect(svc.notificationStatus().sms).toBe("SMS alerts not configured");
  });
});
