// VAPID Public Key - matches the backend's VAPID config
const VAPID_PUBLIC_KEY =
  "BBUDnL9QZfs1W_wmn1kCW7U81ISk0isqNro00JEIamFsQaMGqC3AO8nnK32jY94o3zCg0Thuz-Le1o3mH3Z8Thc";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function initPushNotifications(
  username: string,
  notificationServiceUrl: string,
): Promise<void> {
  try {
    console.log(`[Push] initPushNotifications called for user: ${username}`);

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Browser does not support push notifications.");
      return;
    }

    // 1. Unregister existing workers to force a clean slate (fix for persistent errors)
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      console.log(
        "[Push] Found existing worker. Unregistering to ensure fresh state...",
      );
      await reg.unregister();
    }

    // 2. Register the service worker fresh
    console.log("[Push] Registering service worker...");
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    // 3. Wait for activation (crucial for some browsers)
    console.log("[Push] Waiting for service worker to activate...");
    await navigator.serviceWorker.ready;

    // Polling check for activation state if ready isn't enough
    let attempts = 0;
    while (registration.active?.state !== "activated" && attempts < 20) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }
    console.log("[Push] Service worker active and ready.");

    if (Notification.permission === "denied") {
      console.warn("[Push] Notifications DENIED. Reset in browser settings.");
      return;
    }

    const permission = await Notification.requestPermission();
    console.log(`[Push] Permission result: ${permission}`);
    if (permission !== "granted") return;

    // 4. Force a fresh subscription to avoid "push service error" with old keys
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      console.log("[Push] Clearing old subscription...");
      await subscription.unsubscribe();
    }

    console.log("[Push] Requesting new subscription from browser...");
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
    });

    // 5. Send to backend
    console.log(
      `[Push] Sending subscription to: ${notificationServiceUrl}/subscribe`,
    );
    const resp = await fetch(`${notificationServiceUrl}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, subscription }),
    });

    if (resp.ok) {
      console.log(`[Push] ✅ Successfully registered for ${username}`);
    } else {
      console.error(`[Push] Backend rejected subscription: ${resp.status}`);
    }
  } catch (err) {
    console.warn("[Push] Nuclear setup failed:", err);
  }
}
