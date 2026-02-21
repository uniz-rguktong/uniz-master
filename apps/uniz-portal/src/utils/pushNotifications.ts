// VAPID Public Key - matches the backend's VAPID config
const VAPID_PUBLIC_KEY =
  "BBUDnL9QZfs1W_wmn1kCW7U81ISk0isqNro00JEIamFsQaMGqC3AO8nnK32jY94o3zCg0Thuz-Le1o3mH3Z8Thc";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
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
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("[Push] Browser does not support push notifications.");
      return;
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    // Request permission - silently skip if denied
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[Push] Notification permission denied.");
      return;
    }

    // Check if already subscribed to avoid duplicate DB writes
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Send to backend: POST /subscribe
    await fetch(`${notificationServiceUrl}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, subscription }),
    });

    console.log(`[Push] Subscription registered for ${username}`);
  } catch (err) {
    // Non-fatal - email still works as fallback
    console.warn("[Push] Push setup failed (non-fatal):", err);
  }
}
