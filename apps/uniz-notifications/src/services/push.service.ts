import * as webpush from "web-push";
import prisma from "../utils/prisma.util";

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (!publicVapidKey || !privateVapidKey) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required");
  }
  console.warn("[Push] VAPID keys missing — push notifications disabled in dev");
} else {
  webpush.setVapidDetails(
    "mailto:admin@uniz.rguktong.in",
    publicVapidKey,
    privateVapidKey,
  );
}

export { publicVapidKey };

export const sendWebPush = async (
  username: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    name?: string;
    image?: string;
    rawBody?: boolean;
  },
): Promise<number> => {
  if (!publicVapidKey || !privateVapidKey) return 0;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { username: { equals: username, mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
      take: 3,
    });

    if (subscriptions.length === 0) return 0;

    const recipientName = payload.name || username;
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.rawBody
        ? payload.body
        : `Dear ${recipientName},\n\n${payload.body}`,
      image: payload.image,
      icon: "/assets/ongole_logo.png",
      badge: "/assets/ongole_logo.png",
      tag: (payload.data?.tag as string) || `uniz-${username}-${Date.now()}`,
      data: payload.data || {},
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            pushPayload,
            { TTL: 86400, urgency: "high" },
          );
        } catch (pushErr: any) {
          const statusCode = pushErr.statusCode || pushErr.status;
          if (statusCode === 410 || statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
          } else {
            throw pushErr;
          }
        }
      }),
    );

    return results.filter((r) => r.status === "fulfilled").length;
  } catch (err: any) {
    console.error(`[Push] Error for ${username}: ${err.message}`);
    return 0;
  }
};
