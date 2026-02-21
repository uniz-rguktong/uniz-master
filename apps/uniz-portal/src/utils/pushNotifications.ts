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
 * Store the username in the SW cache so the `pushsubscriptionchange` handler
 * can re-sync with the backend even when the app is closed.
 */
async function storeUsernameInSwCache(username: string): Promise<void> {
  try {
    const cache = await caches.open("uniz-push-meta");
    await cache.put(
      "username",
      new Response(username, { headers: { "Content-Type": "text/plain" } }),
    );
  } catch (_) {
    // Cache API not available in this context, skip silently
  }
}

export async function initPushNotifications(
  username: string,
  notificationServiceUrl: string,
): Promise<void> {
  try {
    console.log(`[Push] initPushNotifications called for user: ${username}`);

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("[Push] Push API not supported in this browser.");
      return;
    }

    // Store username in SW cache for resubscription when browser wakes up
    await storeUsernameInSwCache(username);

    // --- Attempt to reuse an existing subscription ---
    // CRITICAL: Do NOT unregister existing SW registrations blindly.
    // Unregistering destroys the push subscription endpoint, causing missed
    // push messages until the next app open + re-subscribe flow completes.
    const existingReg = await navigator.serviceWorker.getRegistration("/");
    const lastSyncUser = localStorage.getItem("push_last_sync_user");

    if (existingReg) {
      const existingSub = await existingReg.pushManager.getSubscription();
      if (existingSub && lastSyncUser === username) {
        console.log(
          "[Push] ✅ Active subscription found for this user. Skipping setup.",
        );
        return;
      }

      // Same SW but different user (e.g., on shared device) — just re-register
      // the new user's subscription without destroying the SW
      if (existingSub && lastSyncUser !== username) {
        console.log(
          "[Push] Different user detected. Re-syncing subscription to backend.",
        );
        await syncSubscriptionToBackend(
          existingSub,
          username,
          notificationServiceUrl,
        );
        localStorage.setItem("push_last_sync_user", username);
        return;
      }
    }

    // --- No existing SW or no existing subscription: do full setup ---
    console.log("[Push] Starting fresh push setup...");

    // Register (or update) the service worker
    // updateViaCache:'none' ensures the browser always checks for a newer sw.js
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    // Wait for the SW to become active
    await navigator.serviceWorker.ready;

    // If it's installing, wait up to 4s for it to activate
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        const sw = registration.installing!;
        sw.addEventListener("statechange", function handler() {
          if (sw.state === "activated") {
            sw.removeEventListener("statechange", handler);
            resolve();
          }
        });
        setTimeout(resolve, 4000); // timeout fallback
      });
    }

    // Request notification permission
    if (Notification.permission === "denied") {
      console.log("[Push] Notification permission denied by user.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[Push] Notification permission not granted.");
      return;
    }

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
    });

    // Listen for SW messages about subscription changes (from pushsubscriptionchange)
    navigator.serviceWorker.addEventListener("message", async (event) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED") {
        const newSub = event.data.subscription;
        if (newSub) {
          await syncSubscriptionToBackend(
            newSub,
            username,
            notificationServiceUrl,
          );
          localStorage.setItem("push_last_sync_user", username);
          console.log("[Push] ✅ Re-synced new subscription after change.");
        }
      }
    });

    // Send to backend
    await syncSubscriptionToBackend(
      subscription,
      username,
      notificationServiceUrl,
    );
    localStorage.setItem("push_last_sync_user", username);
    console.log(`[Push] ✅ Successfully registered push for ${username}`);
  } catch (err) {
    console.warn("[Push] Setup failed:", err);
  }
}

async function syncSubscriptionToBackend(
  subscription:
    | PushSubscription
    | { endpoint: string; keys?: any; [k: string]: any },
  username: string,
  notificationServiceUrl: string,
): Promise<void> {
  const resp = await fetch(`${notificationServiceUrl}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, subscription }),
  });

  if (!resp.ok) {
    throw new Error(
      `Backend sync failed with status ${resp.status}: ${await resp.text()}`,
    );
  }
}
