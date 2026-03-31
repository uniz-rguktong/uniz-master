// UniZ Service Worker - Web Push Notifications
// IMPORTANT: This file must be served at the root scope (/sw.js)
// to receive background push events when Chrome is closed on mobile.

// ─── Install & Activate ───────────────────────────────────────────────────────
// Skip waiting forces the new SW to activate immediately without waiting for
// all tabs to close. This prevents stale SW instances from blocking push.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim all open clients immediately so the SW controls any open tabs right away
  event.waitUntil(self.clients.claim());
});

// ─── Fetch Event (Required for PWA Installability) ───────────────────────────
self.addEventListener("fetch", (event) => {
  // Pass-through handler with basic cache matching to satisfy Chrome 120+ strict PWA criteria
  // Without event.respondWith, Chrome completely ignores the fetch handler and disables PWA installs.
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request);
    }),
  );
});

// ─── Push Event ───────────────────────────────────────────────────────────────
// This is the core handler. When Chrome is closed on Android, the OS wakes
// up this SW to deliver the push. event.waitUntil() MUST be called synchronously
// (before any await) to prevent the SW from being killed prematurely.
self.addEventListener("push", function (event) {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = { title: "UniZ", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "UniZ Notification";
  const options = {
    body: data.body || "You have a new update.",
    icon: "/assets/ongole_logo.png",
    badge: "/assets/ongole_logo.png",
    image: data.image || undefined,
    vibrate: [200, 100, 200, 100, 200],
    // 'tag' groups notifications - same tag replaces the old one instead of stacking
    // Using a dynamic tag or unique tag allows multiple notifications to show
    tag: data.tag || "uniz-notification",
    // 'renotify: true' means even if the tag matches, re-vibrate/sound the phone
    renotify: true,
    // 'requireInteraction: true' keeps the notification on screen until user dismisses
    // CRITICAL for background reliability: ensures the OS doesn't hide it immediately
    requireInteraction: true,
    data: {
      url: (data.data && data.data.url) || "https://uniz.rguktong.in",
      type: (data.data && data.data.type) || "GENERIC",
      ...(data.data || {}),
    },
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

  // waitUntil MUST be called synchronously - no await before this line
  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl =
    (event.notification.data && event.notification.data.url) ||
    "https://uniz.rguktong.in";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Focus existing tab if open
        for (const client of clientList) {
          if (
            (client.url === targetUrl ||
              client.url.startsWith("https://uniz.rguktong.in")) &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});

// ─── Push Subscription Change ─────────────────────────────────────────────────
// CRITICAL FOR MOBILE: On Android, browsers can invalidate push subscriptions
// (e.g., after browser updates, clearing cache, or OS-level push service restarts).
// This handler detects that and automatically re-subscribes in the background,
// then syncs the new subscription to the backend - WITHOUT requiring the user
// to open the app again.
self.addEventListener("pushsubscriptionchange", function (event) {
  const vapidPublicKey =
    "BBUDnL9QZfs1W_wmn1kCW7U81ISk0isqNro00JEIamFsQaMGqC3AO8nnK32jY94o3zCg0Thuz-Le1o3mH3Z8Thc";

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = self.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
      .then(function (subscription) {
        // Read the username from IndexedDB or a stored cookie/header if available.
        return self.clients
          .matchAll({ includeUncontrolled: true })
          .then(function (clients) {
            // Post the new subscription to any open client to let React re-sync it
            clients.forEach((client) => {
              client.postMessage({
                type: "PUSH_SUBSCRIPTION_CHANGED",
                subscription: subscription.toJSON(),
              });
            });

            // Re-sync to backend
            return caches.open("uniz-push-meta").then(function (cache) {
              return cache.match("username").then(function (response) {
                if (!response) return;
                return response.text().then(function (username) {
                  if (!username) return;
                  return fetch("/api/v1/notifications/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, subscription }),
                  });
                });
              });
            });
          });
      })
      .catch(function (err) {
        console.error("[SW] pushsubscriptionchange re-subscribe failed:", err);
      }),
  );
});
