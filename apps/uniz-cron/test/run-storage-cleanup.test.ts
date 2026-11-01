import { describe, expect, it, vi } from "vitest";

const runStorageCleanup = vi.hoisted(() => vi.fn());
vi.mock("../src/utils/storage", () => ({ runStorageCleanup }));

describe("storage cleanup job entry", () => {
  it("exits 0 after a successful cleanup", async () => {
    runStorageCleanup.mockResolvedValueOnce(undefined);
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as typeof process.exit);
    vi.resetModules();
    await import("../src/jobs/run-storage-cleanup");
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    exit.mockRestore();
  });

  it("exits 1 when cleanup rejects", async () => {
    runStorageCleanup.mockRejectedValueOnce(new Error("disk"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as typeof process.exit);
    vi.resetModules();
    await import("../src/jobs/run-storage-cleanup");
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    expect(error).toHaveBeenCalled();
    exit.mockRestore();
    error.mockRestore();
  });
});
