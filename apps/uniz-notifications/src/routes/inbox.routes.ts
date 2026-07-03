import { Router, type Request, type Response } from "express";
import {
  type AuthenticatedRequest,
  requireAuth,
} from "../middlewares/auth.middleware";
import {
  clearInbox,
  deleteInboxItem,
  listInbox,
  markAllInboxRead,
  markInboxRead,
} from "../services/inbox.service";

const router = Router();

function inboxUsername(req: Request): string | null {
  const user = (req as AuthenticatedRequest).user;
  if (!user?.username || user.username === "internal-service") return null;
  return user.username.toLowerCase();
}

router.get("/inbox", requireAuth, async (req: Request, res: Response) => {
  try {
    const username = inboxUsername(req);
    if (!username) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const page = parseInt(String(req.query.page || "1"), 10);
    const limit = parseInt(String(req.query.limit || "30"), 10);
    const unreadOnly = String(req.query.unreadOnly || "") === "true";

    const data = await listInbox(username, { page, limit, unreadOnly });
    return res.json({ success: true, ...data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load inbox";
    return res.status(500).json({ success: false, error: message });
  }
});

router.patch("/inbox/read-all", requireAuth, async (req, res) => {
  try {
    const username = inboxUsername(req);
    if (!username) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const updated = await markAllInboxRead(username);
    return res.json({ success: true, updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark read";
    return res.status(500).json({ success: false, error: message });
  }
});

router.patch("/inbox/:id/read", requireAuth, async (req, res) => {
  try {
    const username = inboxUsername(req);
    if (!username) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const ok = await markInboxRead(username, String(req.params.id));
    if (!ok) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to mark read";
    return res.status(500).json({ success: false, error: message });
  }
});

router.delete("/inbox/clear", requireAuth, async (req, res) => {
  try {
    const username = inboxUsername(req);
    if (!username) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const mode = String(req.query.mode || "read") === "all" ? "all" : "read";
    const deleted = await clearInbox(username, mode);
    return res.json({ success: true, deleted, mode });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to clear inbox";
    return res.status(500).json({ success: false, error: message });
  }
});

router.delete("/inbox/:id", requireAuth, async (req, res) => {
  try {
    const username = inboxUsername(req);
    if (!username) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const ok = await deleteInboxItem(username, String(req.params.id));
    if (!ok) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    return res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete";
    return res.status(500).json({ success: false, error: message });
  }
});

export default router;
