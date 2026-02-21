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

/**
 * Registers SW, requests permission, subscribes this browser,
 * then POSTs the subscription to the notification service.
 * Call this once after a successful login.
 */
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

    // Register the service worker
    console.log("[Push] Registering service worker...");
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    console.log("[Push] Service worker ready.");

    // Log current permission before asking
    console.log(`[Push] Current permission state: ${Notification.permission}`);

    if (Notification.permission === "denied") {
      console.warn(
        "[Push] Notifications were previously DENIED. Reset in browser site settings.",
      );
      return;
    }

    // Request permission - silently skip if denied
    const permission = await Notification.requestPermission();
    console.log(`[Push] Permission result: ${permission}`);
    if (permission !== "granted") {
      return;
    }

    // Force-refresh the subscription to avoid stale/corrupt registrations (fixes AbortError)
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      console.log("[Push] Existing subscription found. Refreshing...");
      await subscription.unsubscribe();
      console.log("[Push] Unsubscribed successfully.");
    }

    console.log("[Push] Requesting new subscription from browser service...");
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
    });

    // Send to backend: POST /subscribe
    console.log(
      `[Push] Sending subscription to backend: ${notificationServiceUrl}/subscribe`,
    );
    const resp = await fetch(`${notificationServiceUrl}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, subscription }),
    });
    console.log(`[Push] Backend response: ${resp.status}`);
    console.log(`[Push] ✅ Subscription registered for ${username}`);
  } catch (err) {
    // Non-fatal - email still works as fallback
    console.warn("[Push] Push setup failed (non-fatal):", err);
  }
}
