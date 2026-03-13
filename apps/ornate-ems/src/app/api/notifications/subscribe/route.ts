import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { apiHandler, apiResponse, parseBody } from "@/lib/api-utils";
import prisma from "@/lib/prisma";

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
  }).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  const data = await parseBody(request, SubscribeSchema);

  const username = (session?.user?.email || data.username)?.trim().toLowerCase();
  if (!username) {
    return apiResponse(false, null, "Unauthorized", 401);
  }

  const endpoint = data.endpoint || data.subscription?.endpoint;
  const p256dh = data.p256dh || data.subscription?.keys?.p256dh;
  const auth = data.auth || data.subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return apiResponse(false, null, "Invalid subscription payload", 400);
  }

  const userAgent = request.headers.get("user-agent");

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      username,
      endpoint,
      p256dh,
      auth,
      expirationTime: data.subscription?.expirationTime
        ? new Date(data.subscription.expirationTime)
        : null,
      userAgent,
    },
    update: {
      username,
      p256dh,
      auth,
      expirationTime: data.subscription?.expirationTime
        ? new Date(data.subscription.expirationTime)
        : null,
      userAgent,
    },
  });

  return apiResponse(true, { subscribed: true });
});
