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
      return;
    }

    // 1. Check if we already have a subscription to avoid redundant work
    const existingRegistration =
      await navigator.serviceWorker.getRegistration();
    if (existingRegistration) {
      const existingSubscription =
        await existingRegistration.pushManager.getSubscription();
      const lastSyncUser = localStorage.getItem("push_last_sync_user");

      // If subscription exists AND it's for the same user, we're done
      if (existingSubscription && lastSyncUser === username) {
        console.log(
          "[Push] User already has an active subscription. Skipping setup.",
        );
        return;
      }
    }

    console.log("[Push] No matching subscription found. Starting setup...");

    // 2. Clear old state ONLY if we really need to (fixes persistent glitches)
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }

    // 3. Register fresh
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;

    // Ensure activated
    let attempts = 0;
    while (registration.active?.state !== "activated" && attempts < 20) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }

    if (Notification.permission === "denied") return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // 4. Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
    });

    // 5. Send to backend
    const resp = await fetch(`${notificationServiceUrl}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, subscription }),
    });

    if (resp.ok) {
      console.log(`[Push] ✅ Successfully registered for ${username}`);
      localStorage.setItem("push_last_sync_user", username);
    }
  } catch (err) {
    console.warn("[Push] Setup failed:", err);
  }
}
