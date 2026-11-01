import { describe, expect, it } from "vitest";
import { axiosMock, prisma } from "./mocks";
import { runMaintenance } from "../src/jobs/maintenance";

describe("runMaintenance", () => {
  it("expires stale passes and clears each affected student once", async () => {
    prisma.outpass.findMany
      .mockResolvedValueOnce([{ studentId: "S1" }])
      .mockResolvedValueOnce([{ studentId: "S1" }]);
    prisma.outing.findMany
      .mockResolvedValueOnce([{ studentId: "S2" }])
      .mockResolvedValueOnce([{ studentId: "S3" }]);
    prisma.outpass.updateMany.mockResolvedValueOnce({ count: 2 });
    prisma.outing.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.outpass.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.outing.updateMany.mockResolvedValueOnce({ count: 0 });
    axiosMock.post.mockResolvedValue({
      data: {
        success: true,
        students: [{ username: "S4" }, { username: "S5" }],
      },
    });
    prisma.outpass.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "active" });
    prisma.outing.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await runMaintenance();

    expect(prisma.outpass.updateMany).toHaveBeenCalledWith({
      where: { toDay: { lt: expect.any(Date) }, isExpired: false },
      data: { isExpired: true },
    });
    expect(prisma.outing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isApproved: true,
          isExpired: false,
          checkedOutTime: null,
        }),
        data: { isExpired: true },
      }),
    );
    const cleared = axiosMock.put.mock.calls.map((call: any) => call[1].username);
    expect(cleared).toEqual(["S4", "S1", "S2", "S3"]);
    expect(axiosMock.put.mock.calls[0][0]).toBe(
      "http://gateway.test/api/v1/profile/student/status",
    );
    expect(axiosMock.put.mock.calls[0][1]).toEqual({
      username: "S4",
      isPending: false,
    });
    expect(axiosMock.put.mock.calls[0][2].headers["x-internal-secret"]).toBe(
      "test-internal",
    );
  });

  it("still finishes when the stuck-pending sweep cannot reach the gateway", async () => {
    axiosMock.post.mockRejectedValue(new Error("gateway down"));
    await expect(runMaintenance()).resolves.toBeUndefined();
    expect(prisma.outpass.updateMany).toHaveBeenCalled();
  });

  it("does not call the gateway when nobody needs a pending flag cleared", async () => {
    axiosMock.post.mockResolvedValue({ data: { success: true, students: [] } });
    await runMaintenance();
    expect(axiosMock.put).not.toHaveBeenCalled();
  });

  it("swallows a missing production secret inside the status update", async () => {
    const previousEnv = process.env.NODE_ENV;
    const previousSecret = process.env.INTERNAL_SECRET;
    process.env.NODE_ENV = "production";
    delete process.env.INTERNAL_SECRET;
    prisma.outpass.findMany.mockResolvedValue([{ studentId: "S1" }]);
    try {
      await expect(runMaintenance()).resolves.toBeUndefined();
      expect(axiosMock.put).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previousEnv;
      if (previousSecret === undefined) delete process.env.INTERNAL_SECRET;
      else process.env.INTERNAL_SECRET = previousSecret;
    }
  });

  it("rethrows when the expiry scan itself fails", async () => {
    prisma.outpass.findMany.mockRejectedValue(new Error("db down"));
    await expect(runMaintenance()).rejects.toThrow("db down");
  });
});
