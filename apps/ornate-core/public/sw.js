/* eslint-disable no-restricted-globals */

const DEFAULT_ICON = "/assets/icon-192x192.png";
const DEFAULT_BADGE = "/assets/icon-192x192.png";
const META_CACHE_NAME = "uniz-push-meta";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Keep network handling default; listener exists to satisfy PWA installability checks.
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    if (event.data) payload = event.data.json();
  } catch {
    payload = {
      title: "New Notification",
      body: event.data ? event.data.text() : "You have a new update.",
    };
  }

  const title = payload.title || "New Notification";
  const body = payload.body || "You have a new notification";
  const options = {
    body,
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    image: payload.image || undefined,
    vibrate: [200, 100, 200, 100, 200],
    tag: payload.tag || "ornate-push",
    data: {
      url: payload.url || "/",
      ...(payload.data || {}),
    },
    requireInteraction: true,
    renotify: true,
    actions: [
      {
        action: "open",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "NOTIFICATION_PUSH_RECEIVED",
            payload: {
              title,
              body,
              createdAt: Date.now(),
            },
          });
        });
      }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});

function base64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(META_CACHE_NAME);
        const usernameResponse = await cache.match("username");
        if (!usernameResponse) return;
        const username = (await usernameResponse.text()).trim().toLowerCase();
        if (!username) return;

        const keyResponse = await fetch("/api/push/vapid-public-key", {
          method: "GET",
          credentials: "include",
          headers: { "Accept": "application/json" },
        });

        if (!keyResponse.ok) return;

        const keyResult = await keyResponse.json();
        const vapidPublicKey = keyResult?.data?.publicKey;
        if (!vapidPublicKey) return;

        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(vapidPublicKey),
        });

        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach((client) => {
          client.postMessage({
            type: "PUSH_SUBSCRIPTION_CHANGED",
            subscription: newSubscription.toJSON(),
          });
        });

        await fetch("/api/notifications/subscribe", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            endpoint: newSubscription.endpoint,
            p256dh: newSubscription.toJSON().keys?.p256dh,
            auth: newSubscription.toJSON().keys?.auth,
            subscription: newSubscription,
          }),
        });
      } catch (error) {
        // Keep this silent in SW context to avoid unhandled promise rejection noise.
        console.error("pushsubscriptionchange failed", error);
      }
    })(),
  );
});
