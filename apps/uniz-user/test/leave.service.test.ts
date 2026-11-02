import { describe, expect, it } from "vitest";
import * as svc from "../src/services/leave.service";
import { axiosMock, prismaMock } from "./mocks";

const faculty = { id: "f1", username: "fac1", name: "Ravi", department: "cse" };
const fac = { username: "fac1", role: "faculty" };
const hod = { username: "hod_cse", role: "faculty" };
const dean = { username: "dean1", role: "dean" };
const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("leave service", () => {
  it("counts days inclusively", () => {
    expect(svc.countDays(d("2026-11-02"), d("2026-11-02"))).toBe(1);
    expect(svc.countDays(d("2026-11-02"), d("2026-11-05"))).toBe(4);
  });

  it("uses default balances when no row exists", async () => {
    prismaMock.leaveBalance.findMany.mockResolvedValue([
      { leaveType: "CL", total: 12, used: 10 },
    ]);
    const b = await svc.getBalances("f1", 2026);
    expect(b.find((x) => x.leaveType === "CL")!.remaining).toBe(2);
    expect(b.find((x) => x.leaveType === "EL")!.remaining).toBe(15);
  });

  it("faculty apply goes to HOD and notifies the HOD", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue(faculty);
    prismaMock.leaveBalance.findMany.mockResolvedValue([]);
    prismaMock.leaveRequest.create.mockImplementation(
      async ({ data }: any) => data,
    );
    const r: any = await svc.applyLeave(fac, {
      leaveType: "CL",
      fromDate: d("2026-11-10"),
      toDate: d("2026-11-11"),
      reason: "family function",
    });
    expect(r.status).toBe("pending_hod");
    expect(r.department).toBe("CSE");
    expect(r.days).toBe(2);
    expect(axiosMock.post.mock.calls[0][1].username).toBe("hod_cse");
  });

  it("HOD apply skips straight to Dean", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue({
      ...faculty,
      username: "hod_cse",
    });
    prismaMock.leaveBalance.findMany.mockResolvedValue([]);
    prismaMock.leaveRequest.create.mockImplementation(
      async ({ data }: any) => data,
    );
    const r: any = await svc.applyLeave(hod, {
      leaveType: "CL",
      fromDate: d("2026-11-10"),
      toDate: d("2026-11-10"),
      reason: "personal work",
    });
    expect(r.status).toBe("pending_dean");
  });

  it("rejects apply over balance and non-faculty roles", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue(faculty);
    prismaMock.leaveBalance.findMany.mockResolvedValue([
      { leaveType: "CL", total: 12, used: 12 },
    ]);
    await expect(
      svc.applyLeave(fac, {
        leaveType: "CL",
        fromDate: d("2026-11-10"),
        toDate: d("2026-11-10"),
        reason: "personal",
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });
    await expect(
      svc.applyLeave(
        { username: "O1", role: "student" },
        {
          leaveType: "CL",
          fromDate: d("2026-11-10"),
          toDate: d("2026-11-10"),
          reason: "personal",
        },
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("HOD approves own department only, then Dean finalizes and books balance", async () => {
    prismaMock.leaveRequest.findUnique.mockResolvedValue({
      id: "l1",
      status: "pending_hod",
      department: "ECE",
      username: "fac1",
    });
    await expect(svc.decideLeave(hod, "l1", "approve")).rejects.toMatchObject({
      status: 403,
    });

    prismaMock.leaveRequest.findUnique.mockResolvedValue({
      id: "l1",
      status: "pending_hod",
      department: "CSE",
      username: "fac1",
    });
    prismaMock.leaveRequest.update.mockImplementation(
      async ({ data }: any) => data,
    );
    expect(((await svc.decideLeave(hod, "l1", "approve")) as any).status).toBe(
      "pending_dean",
    );

    prismaMock.leaveRequest.findUnique.mockResolvedValue({
      id: "l1",
      status: "pending_dean",
      department: "CSE",
      username: "fac1",
      facultyId: "f1",
      leaveType: "CL",
      days: 2,
      fromDate: d("2026-11-10"),
    });
    await expect(svc.decideLeave(hod, "l1", "approve")).rejects.toMatchObject({
      status: 403,
    });
    expect(((await svc.decideLeave(dean, "l1", "approve")) as any).status).toBe(
      "approved",
    );
    expect(prismaMock.leaveBalance.upsert.mock.calls[0][0].update).toEqual({
      used: { increment: 2 },
    });
  });

  it("refuses to decide a closed request", async () => {
    prismaMock.leaveRequest.findUnique.mockResolvedValue({
      id: "l1",
      status: "approved",
    });
    await expect(svc.decideLeave(dean, "l1", "reject")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("pending list is scoped by role", async () => {
    prismaMock.leaveRequest.findMany.mockResolvedValue([]);
    await svc.listPending(hod);
    expect(prismaMock.leaveRequest.findMany.mock.calls[0][0].where).toEqual({
      status: "pending_hod",
      department: "CSE",
    });
    await svc.listPending(dean);
    expect(prismaMock.leaveRequest.findMany.mock.calls[1][0].where).toEqual({
      status: "pending_dean",
    });
    await expect(svc.listPending(fac)).rejects.toMatchObject({ status: 403 });
  });

  it("only owner can cancel a pending leave", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue(faculty);
    prismaMock.leaveRequest.findUnique.mockResolvedValue({
      id: "l1",
      facultyId: "other",
      status: "pending_hod",
    });
    await expect(svc.cancelLeave(fac, "l1")).rejects.toMatchObject({
      status: 404,
    });
    prismaMock.leaveRequest.findUnique.mockResolvedValue({
      id: "l1",
      facultyId: "f1",
      status: "pending_hod",
    });
    prismaMock.leaveRequest.update.mockResolvedValue({ status: "cancelled" });
    expect(((await svc.cancelLeave(fac, "l1")) as any).status).toBe(
      "cancelled",
    );
  });

  it("duties: HOD assigns only in own department", async () => {
    prismaMock.facultyProfile.findUnique.mockResolvedValue({
      ...faculty,
      department: "ECE",
    });
    const input = {
      facultyUsername: "fac1",
      dutyType: "invigilation",
      title: "Mid exam",
      date: d("2026-11-20"),
    };
    await expect(svc.assignDuty(hod, input)).rejects.toMatchObject({
      status: 403,
    });
    await expect(svc.assignDuty(fac, input)).rejects.toMatchObject({
      status: 403,
    });
    prismaMock.dutyAssignment.create.mockImplementation(
      async ({ data }: any) => data,
    );
    const r: any = await svc.assignDuty(dean, input);
    expect(r.department).toBe("ECE");
    expect(r.assignedBy).toBe("dean1");
  });

  it("sms shows disabled without key", () => {
    expect(svc.notificationStatus().sms).toBe("SMS alerts not configured");
  });
});
