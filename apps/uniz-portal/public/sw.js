// UniZ Service Worker - Web Push Notifications
self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "UniZ", body: event.data.text() };
  }

  const title = data.title || "UniZ Notification";
  const options = {
    body: data.body || "",
    icon: "/assets/icon-192x192.png",
    badge: "/assets/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: "open",
        title: "Open Portal",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const urlToOpen = "https://uniz.rguktong.in";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
