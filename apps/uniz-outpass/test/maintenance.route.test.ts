import { beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import { mockRes } from "./http";

vi.mock("../src/jobs/maintenance", () => ({
  runMaintenance: vi.fn().mockResolvedValue(undefined),
}));

import maintenanceRouter from "../src/routes/maintenance.routes";
import { runMaintenance } from "../src/jobs/maintenance";

function cronHandler() {
  const layer = maintenanceRouter.stack.find(
    (entry: any) => entry.route?.path === "/api/cron",
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

describe("maintenance route", () => {
  const previousEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.mocked(runMaintenance).mockClear();
    process.env.NODE_ENV = previousEnv;
  });

  it("refuses the cron hook in production when the secret does not match", async () => {
    process.env.NODE_ENV = "production";
    const res = mockRes();
    await cronHandler()(
      { headers: { "x-internal-secret": "wrong" } },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
    expect(runMaintenance).not.toHaveBeenCalled();
  });

  it("runs maintenance when the production secret matches", async () => {
    process.env.NODE_ENV = "production";
    const res = mockRes();
    await cronHandler()(
      { headers: { "x-internal-secret": "test-internal" } },
      res,
    );
    expect(runMaintenance).toHaveBeenCalledOnce();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Maintenance job executed",
    });
  });

  it("runs outside production even without the secret", async () => {
    process.env.NODE_ENV = "test";
    const res = mockRes();
    await cronHandler()({ headers: {} }, res);
    expect(runMaintenance).toHaveBeenCalledOnce();
    expect(res.json.mock.calls[0][0].success).toBe(true);
  });
});
