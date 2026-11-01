import { beforeEach, describe, expect, it, vi } from "vitest";
import { INTERNAL_SECRET, bearer } from "./auth-token";
import { mount } from "./http";

const inbox = vi.hoisted(() => ({
  listInbox: vi.fn(),
  markAllInboxRead: vi.fn(),
  markInboxRead: vi.fn(),
  clearInbox: vi.fn(),
  deleteInboxItem: vi.fn(),
}));

vi.mock("../src/services/inbox.service", () => inbox);

import router from "../src/routes/inbox.routes";

const api = mount(router);
const auth = bearer();

describe("inbox routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects anonymous and internal callers", async () => {
    expect((await api.get("/inbox")).status).toBe(401);
    const internal = await api.get("/inbox", {
      "x-internal-secret": INTERNAL_SECRET,
    });
    expect(internal.status).toBe(401);
    expect(internal.body).toEqual({ success: false, error: "Unauthorized" });
    expect(inbox.listInbox).not.toHaveBeenCalled();
  });

  it("lists a lowercased inbox and reports service failures", async () => {
    inbox.listInbox.mockResolvedValueOnce({
      items: [{ id: "1" }],
      total: 1,
      unreadCount: 1,
      page: 2,
      limit: 10,
      totalPages: 1,
    });
    const ok = await api.get("/inbox?page=2&limit=10&unreadOnly=true", auth);
    expect(ok.status).toBe(200);
    expect(ok.body.success).toBe(true);
    expect(ok.body.items).toEqual([{ id: "1" }]);
    expect(inbox.listInbox).toHaveBeenCalledWith("o210001", {
      page: 2,
      limit: 10,
      unreadOnly: true,
    });

    inbox.listInbox.mockRejectedValueOnce(new Error("db down"));
    const failed = await api.get("/inbox", auth);
    expect(failed.status).toBe(500);
    expect(failed.body.error).toBe("db down");

    inbox.listInbox.mockRejectedValueOnce("nope");
    const unknown = await api.get("/inbox", auth);
    expect(unknown.body.error).toBe("Failed to load inbox");
  });

  it("marks one item or the whole inbox read", async () => {
    inbox.markAllInboxRead.mockResolvedValueOnce(4);
    const all = await api.patch("/inbox/read-all", {}, auth);
    expect(all.body).toEqual({ success: true, updated: 4 });
    expect(inbox.markAllInboxRead).toHaveBeenCalledWith("o210001");

    inbox.markAllInboxRead.mockRejectedValueOnce(new Error("no"));
    expect((await api.patch("/inbox/read-all", {}, auth)).body.error).toBe("no");
    inbox.markAllInboxRead.mockRejectedValueOnce("x");
    expect((await api.patch("/inbox/read-all", {}, auth)).body.error).toBe(
      "Failed to mark read",
    );

    inbox.markInboxRead.mockResolvedValueOnce(true);
    const one = await api.patch("/inbox/abc/read", {}, auth);
    expect(one.body).toEqual({ success: true });
    expect(inbox.markInboxRead).toHaveBeenCalledWith("o210001", "abc");

    inbox.markInboxRead.mockResolvedValueOnce(false);
    expect((await api.patch("/inbox/missing/read", {}, auth)).status).toBe(404);

    inbox.markInboxRead.mockRejectedValueOnce("x");
    expect((await api.patch("/inbox/abc/read", {}, auth)).body.error).toBe(
      "Failed to mark read",
    );
  });

  it("clears and deletes inbox rows for the signed-in student", async () => {
    inbox.clearInbox.mockResolvedValueOnce(2);
    const read = await api.del("/inbox/clear", auth);
    expect(read.body).toEqual({ success: true, deleted: 2, mode: "read" });
    expect(inbox.clearInbox).toHaveBeenCalledWith("o210001", "read");

    inbox.clearInbox.mockResolvedValueOnce(5);
    const all = await api.del("/inbox/clear?mode=all", auth);
    expect(all.body.mode).toBe("all");
    expect(inbox.clearInbox).toHaveBeenLastCalledWith("o210001", "all");

    inbox.clearInbox.mockResolvedValueOnce(1);
    await api.del("/inbox/clear?mode=nope", auth);
    expect(inbox.clearInbox).toHaveBeenLastCalledWith("o210001", "read");

    inbox.clearInbox.mockRejectedValueOnce("x");
    expect((await api.del("/inbox/clear", auth)).body.error).toBe(
      "Failed to clear inbox",
    );

    inbox.deleteInboxItem.mockResolvedValueOnce(true);
    expect((await api.del("/inbox/row-1", auth)).body).toEqual({ success: true });
    expect(inbox.deleteInboxItem).toHaveBeenCalledWith("o210001", "row-1");

    inbox.deleteInboxItem.mockResolvedValueOnce(false);
    expect((await api.del("/inbox/missing", auth)).status).toBe(404);

    inbox.deleteInboxItem.mockRejectedValueOnce(new Error("locked"));
    expect((await api.del("/inbox/row-1", auth)).body.error).toBe("locked");
    inbox.deleteInboxItem.mockRejectedValueOnce("x");
    expect((await api.del("/inbox/row-1", auth)).body.error).toBe(
      "Failed to delete",
    );
  });
});
