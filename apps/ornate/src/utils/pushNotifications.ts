type PushSubscribeResponse = {
  subscribed?: boolean;
  error?: string;
};

const SW_META_CACHE = "ornate-push-meta";
const PUSH_LAST_SYNC_KEY = "push_last_sync_user";

let isPushSetupInProgress = false;
let isSwMessageListenerAttached = false;

let swMessageSyncContext = {
  username: "",
  notificationServiceUrl: "/api/notifications",
};

function attachSwMessageListener(): void {
  if (isSwMessageListenerAttached) return;

  navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
    void (async () => {
      if (event.data?.type !== "PUSH_SUBSCRIPTION_CHANGED") return;
      const changedSubscription = event.data.subscription as
        | PushSubscription
        | { endpoint: string; keys?: Record<string, string> }
        | undefined;

      if (!changedSubscription) return;

      const { username, notificationServiceUrl } = swMessageSyncContext;
      if (!username) return;

      await syncSubscriptionWithBackend(changedSubscription, username, notificationServiceUrl);
      window.localStorage.setItem(PUSH_LAST_SYNC_KEY, username);
    })();
  });

  isSwMessageListenerAttached = true;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function canUsePushNotifications(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function syncSubscriptionWithBackend(
  subscription: PushSubscription | { endpoint: string; keys?: Record<string, string> },
  username: string,
  notificationServiceUrl = "/api/notifications",
): Promise<void> {
  const subscriptionJson: {
    endpoint: string;
    keys?: { p256dh?: string; auth?: string };
  } =
    "toJSON" in subscription && typeof subscription.toJSON === "function"
      ? (subscription.toJSON() as { endpoint: string; keys?: { p256dh?: string; auth?: string } })
      : subscription;

  const endpoint = subscriptionJson.endpoint;
  const p256dh = subscriptionJson.keys?.p256dh;
  const auth = subscriptionJson.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Push subscription keys are missing");
  }

  const normalizedUsername = username.trim().toLowerCase();

  const response = await fetch(`${notificationServiceUrl}/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username: normalizedUsername,
      endpoint,
      p256dh,
      auth,
      subscription: subscriptionJson,
    }),
  });

  const result = (await response.json()) as PushSubscribeResponse;
  if (!response.ok) {
    throw new Error(result.error || "Failed to sync push subscription");
  }
}

export async function storeUsernameInSwCache(username: string): Promise<void> {
  const cache = await caches.open(SW_META_CACHE);
  await cache.put("username", new Response(username.trim().toLowerCase()));
}

export async function initPushNotifications(
  username: string,
  notificationServiceUrl = "/api/notifications",
): Promise<{ subscribed: boolean; reason?: string }> {
  if (isPushSetupInProgress) {
    return { subscribed: false, reason: "Push setup already in progress" };
  }
  isPushSetupInProgress = true;

  if (!canUsePushNotifications()) {
    isPushSetupInProgress = false;
    return { subscribed: false, reason: "Push notifications are not supported" };
  }

  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) {
    isPushSetupInProgress = false;
    return { subscribed: false, reason: "Username is required" };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    isPushSetupInProgress = false;
    return { subscribed: false, reason: "NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing" };
  }

  try {
    await storeUsernameInSwCache(normalizedUsername);
    swMessageSyncContext = {
      username: normalizedUsername,
      notificationServiceUrl,
    };
    attachSwMessageListener();

    const existingRegistration = await navigator.serviceWorker.getRegistration("/");
    const lastSyncedUser = window.localStorage.getItem(PUSH_LAST_SYNC_KEY);

    if (existingRegistration) {
      const existingSubscription = await existingRegistration.pushManager.getSubscription();
      if (existingSubscription && lastSyncedUser === normalizedUsername) {
        await syncSubscriptionWithBackend(existingSubscription, normalizedUsername, notificationServiceUrl);
        return { subscribed: true, reason: "Subscription already active and resynced" };
      }

      if (existingSubscription && lastSyncedUser !== normalizedUsername) {
        await syncSubscriptionWithBackend(existingSubscription, normalizedUsername, notificationServiceUrl);
        window.localStorage.setItem(PUSH_LAST_SYNC_KEY, normalizedUsername);
        return { subscribed: true, reason: "Subscription moved to another user" };
      }
    }

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    await navigator.serviceWorker.ready;

    if (registration.installing) {
      await new Promise<void>((resolve) => {
        const sw = registration.installing;
        const handler = () => {
          if (sw?.state === "activated") {
            sw.removeEventListener("statechange", handler);
            resolve();
          }
        };

        sw?.addEventListener("statechange", handler);
        window.setTimeout(resolve, 4000);
      });
    }

    if (Notification.permission === "denied") {
      return { subscribed: false, reason: "Notification permission denied" };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { subscribed: false, reason: "Notification permission denied" };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    await syncSubscriptionWithBackend(subscription, normalizedUsername, notificationServiceUrl);
    window.localStorage.setItem(PUSH_LAST_SYNC_KEY, normalizedUsername);

    return { subscribed: true };
  } catch (error: unknown) {
    return {
      subscribed: false,
      reason: error instanceof Error ? error.message : "Push setup failed",
    };
  } finally {
    isPushSetupInProgress = false;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<void> {
  if (!canUsePushNotifications()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}
