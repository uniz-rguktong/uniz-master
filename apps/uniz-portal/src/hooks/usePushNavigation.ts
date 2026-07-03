import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Handles service worker postMessage when a push notification is clicked.
 */
export function usePushNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== "NOTIFICATION_CLICK") return;
      const path =
        typeof data.path === "string" && data.path.startsWith("/")
          ? data.path
          : "/notifications";
      navigate(path);
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [navigate]);
}
