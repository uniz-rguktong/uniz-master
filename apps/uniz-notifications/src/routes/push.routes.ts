import { Router, Request, Response } from "express";
import axios from "axios";
import prisma from "../utils/prisma.util";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";
import { sendWebPush } from "../services/push.service";

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://uniz-user-service:3002";

const router = Router();

router.post("/subscribe", requireAuth, async (req: Request, res: Response) => {
  try {
    const { username, subscription } = req.body;
    if (!username || !subscription) {
      return res
        .status(400)
        .json({ error: "Missing username or subscription" });
    }

    const targetUsername = String(username).toLowerCase();
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        username: targetUsername,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        username: targetUsername,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    res.status(201).json({ success: true, message: "Subscribed successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/push/send", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { target, username, batch, year, branch, title, body, image } =
      req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    const t = String(target || "").toLowerCase();
    let targetUsers: Array<{ username: string; name?: string }> = [];
    const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

    const fetchTargeting = async (payload: Record<string, string>) => {
      const response = await axios.post(
        `${USER_SERVICE_URL}/internal/targeting`,
        payload,
        { headers: { "x-internal-secret": SECRET }, timeout: 10000 },
      );
      return response.data.success ? response.data.users : [];
    };

    if (t === "user") {
      if (!username) {
        return res.status(400).json({ error: "username required for target=user" });
      }
      targetUsers = [{ username }];
    } else if (t === "batch") {
      if (!batch) {
        return res.status(400).json({ error: "batch required (e.g. o21)" });
      }
      const users = await fetchTargeting({ target: "students", branch: "all", year: "all" });
      targetUsers = users.filter((u: { username: string }) =>
        u.username.toLowerCase().startsWith(String(batch).toLowerCase()),
      );
    } else if (t === "year") {
      if (!year) {
        return res.status(400).json({ error: "year required (e.g. E3)" });
      }
      targetUsers = await fetchTargeting({ target: "students", branch: "all", year });
    } else if (["dean", "hod", "students"].includes(t)) {
      targetUsers = await fetchTargeting({ target: t, branch, year });
    } else if (t === "all") {
      const [students, faculty, deans] = await Promise.all([
        fetchTargeting({ target: "students" }).catch(() => []),
        fetchTargeting({ target: "hod" }).catch(() => []),
        fetchTargeting({ target: "dean" }).catch(() => []),
      ]);
      targetUsers = [...students, ...faculty, ...deans];
    } else {
      return res.status(400).json({
        error: "target must be one of: user, batch, year, all, dean, hod, students",
      });
    }

    const targetUsernames = targetUsers.map((u) => u.username.toLowerCase());
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { username: { in: targetUsernames } },
    });

    if (subscriptions.length === 0) {
      return res.status(200).json({ success: true, status: "no_subscribers", sent: 0 });
    }

    const results = await Promise.allSettled(
      targetUsers.flatMap((u) => {
        const userSubs = subscriptions.filter(
          (s: { username: string }) => s.username.toUpperCase() === u.username.toUpperCase(),
        );
        const personalizedBody =
          `Dear ${u.name || u.username},\n\n` +
          String(body)
            .replace(/{{name}}/g, u.name || u.username)
            .replace(/{{username}}/g, u.username);
        const personalizedTitle = String(title)
          .replace(/{{name}}/g, u.name || u.username)
          .replace(/{{username}}/g, u.username);

        return userSubs.map(() =>
          sendWebPush(u.username, {
            title: personalizedTitle,
            body: personalizedBody,
            rawBody: true,
            image,
            data: { type: "BROADCAST" },
          }),
        );
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    res.json({ success: true, status: "done", sent: succeeded, failed, total: subscriptions.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/push/subscribers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const prefix = req.query.prefix as string | undefined;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(500, parseInt(String(req.query.limit || "50"), 10));
    const skip = (page - 1) * limit;

    const where = prefix
      ? { username: { startsWith: prefix, mode: "insensitive" as const } }
      : {};

    const [total, subscribers] = await Promise.all([
      prisma.pushSubscription.count({ where }),
      prisma.pushSubscription.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    ]);

    res.json({ success: true, total, page, limit, subscribers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
