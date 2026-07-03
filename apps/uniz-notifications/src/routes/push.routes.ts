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

router.post("/internal/push", requireAuth, async (req, res) => {
  try {
    const { username, title, body, type } = req.body;
    if (!username || !title || !body) {
      return res
        .status(400)
        .json({ error: "username, title, and body are required" });
    }

    const sent = await sendWebPush(String(username), {
      title: String(title),
      body: String(body),
      rawBody: true,
      data: { type: String(type || "SYSTEM") },
    });

    return res.status(200).json({ success: true, sent });
  } catch (err: any) {
    console.error("[Push] internal/push error:", err.message);
    return res.status(200).json({ success: true, sent: 0, status: "skipped" });
  }
});

router.delete("/internal/subscriptions/:username", requireAuth, async (req, res) => {
  try {
    const username = String(req.params.username || "").toLowerCase();
    if (!username) {
      return res.status(400).json({ success: false, error: "Username required" });
    }
    const result = await prisma.pushSubscription.deleteMany({
      where: { username: { equals: username, mode: "insensitive" } },
    });
    return res.json({
      success: true,
      deleted: result.count,
      message: `Removed ${result.count} push subscription(s)`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
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

    // Single-user system pushes (login alerts, OTP, etc.) — no broadcast plumbing
    if (t === "user") {
      if (!username) {
        return res.status(400).json({ error: "username required for target=user" });
      }
      const sent = await sendWebPush(String(username), {
        title: String(title),
        body: String(body),
        rawBody: true,
        image,
        data: { type: "SYSTEM" },
      });
      return res.status(200).json({
        success: true,
        status: sent > 0 ? "done" : "no_subscribers",
        sent,
      });
    }

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

    if (t === "batch") {
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
    const search = String(req.query.search || req.query.prefix || "").trim();
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(500, parseInt(String(req.query.limit || "50"), 10));
    const skip = (page - 1) * limit;
    const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

    let where: Record<string, unknown> = {};

    if (search) {
      const directWhere = {
        OR: [
          { username: { contains: search, mode: "insensitive" as const } },
          { endpoint: { contains: search, mode: "insensitive" as const } },
        ],
      };

      let nameMatchedUsernames: string[] = [];
      if (search.length >= 2) {
        try {
          const searchRes = await axios.post(
            `${USER_SERVICE_URL}/student/search`,
            { username: search, limit: 150, page: 1 },
            { headers: { "x-internal-secret": SECRET } },
          );
          if (searchRes.data?.students?.length) {
            nameMatchedUsernames = searchRes.data.students.map((s: { username: string }) =>
              String(s.username).toLowerCase(),
            );
          }
        } catch {
          /* name search optional */
        }
      }

      if (nameMatchedUsernames.length) {
        where = {
          OR: [
            directWhere,
            { username: { in: nameMatchedUsernames, mode: "insensitive" as const } },
          ],
        };
      } else {
        where = directWhere;
      }
    }

    const [total, subscribers] = await Promise.all([
      prisma.pushSubscription.count({ where }),
      prisma.pushSubscription.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const usernames = [
      ...new Set(subscribers.map((s) => String(s.username).toUpperCase())),
    ];
    const profileMap = new Map<string, Record<string, string>>();

    if (usernames.length) {
      try {
        const profRes = await axios.post(
          `${USER_SERVICE_URL}/internal/bulk-profiles`,
          { usernames },
          { headers: { "x-internal-secret": SECRET } },
        );
        for (const p of profRes.data?.students || []) {
          profileMap.set(String(p.username).toUpperCase(), p);
        }
      } catch {
        /* enrichment optional */
      }
    }

    const enriched = subscribers.map((s) => {
      const profile = profileMap.get(String(s.username).toUpperCase());
      return {
        ...s,
        displayName: profile?.name || null,
        branch: profile?.branch || null,
        year: profile?.year || null,
        batch: profile?.batch || null,
        email: profile?.email || null,
      };
    });

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      subscribers: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
