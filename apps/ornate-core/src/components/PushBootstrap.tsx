"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { initPushNotifications } from "@/utils/pushNotifications";

export default function PushBootstrap(): null {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    if (typeof window === "undefined") return;
    if (Notification.permission === "denied") return;

    const username = session?.user?.email;
    if (!username) return;

    void initPushNotifications(username);
  }, [status, session?.user?.email]);

  return null;
}
