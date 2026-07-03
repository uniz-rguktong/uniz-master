import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import { NOTIFICATION_INBOX } from "@/api/endpoints";

type InboxResponse = {
  success: boolean;
  unreadCount: number;
};

export function useNotificationUnread(pollMs = 90_000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiClient<InboxResponse>(NOTIFICATION_INBOX);
      if (data?.success) {
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      /* silent — bell is non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (pollMs <= 0) return;
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  return { unreadCount, loading, refresh };
}
