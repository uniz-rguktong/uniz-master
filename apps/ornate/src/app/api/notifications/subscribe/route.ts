import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SubscribeSchema = z.object({
  username: z.string().trim().min(1).optional(),
  endpoint: z.string().url().optional(),
  p256dh: z.string().min(1).optional(),
  auth: z.string().min(1).optional(),
  subscription: z.object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const data = SubscribeSchema.parse(body);

    const username = (session?.user?.email || data.username)?.trim().toLowerCase();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const endpoint = data.endpoint || data.subscription.endpoint;
    const p256dh = data.p256dh || data.subscription.keys.p256dh;
    const auth = data.auth || data.subscription.keys.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        id: crypto.randomUUID(),
        username,
        endpoint,
        p256dh,
        auth,
        expirationTime: data.subscription.expirationTime
          ? new Date(data.subscription.expirationTime)
          : null,
        userAgent: request.headers.get("user-agent"),
        updatedAt: new Date(),
      },
      update: {
        username,
        p256dh,
        auth,
        expirationTime: data.subscription.expirationTime
          ? new Date(data.subscription.expirationTime)
          : null,
        userAgent: request.headers.get("user-agent"),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: error.flatten() }, { status: 400 });
    }

    console.error("[PUSH_SUBSCRIBE]", error);
    return NextResponse.json({ error: "Failed to subscribe for push notifications" }, { status: 500 });
  }
}
