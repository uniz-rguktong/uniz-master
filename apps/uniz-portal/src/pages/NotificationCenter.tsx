import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/api/apiClient";
import {
  NOTIFICATION_INBOX,
  NOTIFICATION_INBOX_CLEAR,
  NOTIFICATION_INBOX_DELETE,
  NOTIFICATION_INBOX_READ,
  NOTIFICATION_INBOX_READ_ALL,
} from "@/api/endpoints";
import { toast } from "@/utils/toast-ref";
import {
  portalCardClass,
  portalEyebrowClass,
  portalPrimaryButtonClass,
  portalGhostButtonClass,
  portalSubtitleClass,
  portalTitleClass,
} from "@/lib/portal-ui";
import {
  adminPageWrapClass,
  adminGhostButtonClass,
  adminPrimaryButtonClass,
} from "@/components/admin/admin-ui";

type InboxItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  path: string | null;
  readAt: string | null;
  createdAt: string;
};

type InboxResponse = {
  success: boolean;
  items: InboxItem[];
  unreadCount: number;
  total: number;
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function NotificationCenter({
  portal,
}: {
  portal: "student" | "admin";
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("n");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const backPath = portal === "student" ? "/student" : "/admin";
  const isAdmin = portal === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<InboxResponse>(NOTIFICATION_INBOX);
      if (data?.success) {
        setItems(data.items || []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(async (id: string, silent = false) => {
    try {
      await apiClient(NOTIFICATION_INBOX_READ(id), { method: "PATCH" });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (!silent) toast.success("Marked as read");
    } catch {
      if (!silent) toast.error("Could not mark as read");
    }
  }, []);

  useEffect(() => {
    if (!highlightId || loading) return;
    const el = document.getElementById(`notification-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    void markRead(highlightId, true);
  }, [highlightId, loading, markRead]);

  const markAllRead = async () => {
    setBusy(true);
    try {
      await apiClient(NOTIFICATION_INBOX_READ_ALL, { method: "PATCH" });
      await load();
      toast.success("All notifications marked read");
    } catch {
      toast.error("Could not mark all as read");
    } finally {
      setBusy(false);
    }
  };

  const deleteOne = async (id: string) => {
    try {
      await apiClient(NOTIFICATION_INBOX_DELETE(id), { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Could not delete notification");
    }
  };

  const clearRead = async () => {
    setBusy(true);
    try {
      await apiClient(NOTIFICATION_INBOX_CLEAR("read"), { method: "DELETE" });
      await load();
      toast.success("Read notifications cleared");
    } catch {
      toast.error("Could not clear notifications");
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Delete all notifications? This cannot be undone.")) {
      return;
    }
    setBusy(true);
    try {
      await apiClient(NOTIFICATION_INBOX_CLEAR("all"), { method: "DELETE" });
      await load();
      toast.success("Inbox cleared");
    } catch {
      toast.error("Could not clear inbox");
    } finally {
      setBusy(false);
    }
  };

  const empty = !loading && items.length === 0;

  const shellClass = isAdmin
    ? cn(adminPageWrapClass, "pb-16 max-w-3xl mx-auto")
    : "mx-auto max-w-3xl px-4 pb-10 pt-2 md:px-6 md:pt-4";

  const primaryBtn = isAdmin ? adminPrimaryButtonClass : portalPrimaryButtonClass;
  const ghostBtn = isAdmin ? adminGhostButtonClass : portalGhostButtonClass;

  const header = (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className={cn(ghostBtn, "mb-3 -ml-2 min-h-10 px-3")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <p className={portalEyebrowClass}>Alerts</p>
        <h1 className={cn(portalTitleClass, "mt-1")}>Notifications</h1>
        <p className={cn(portalSubtitleClass, "mt-2")}>
          Push alerts delivered to your account — read, clear, or review history.
        </p>
      </div>
      {unreadCount > 0 && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-[11px] font-semibold text-navy-700">
          <Bell className="h-3.5 w-3.5" />
          {unreadCount} unread
        </span>
      )}
    </header>
  );

  return (
    <div className={shellClass}>
      {header}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || unreadCount === 0}
          onClick={markAllRead}
          className={cn(ghostBtn, "min-h-10")}
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={clearRead}
          className={cn(ghostBtn, "min-h-10")}
        >
          <Trash2 className="h-4 w-4" />
          Clear read
        </button>
        <button
          type="button"
          disabled={busy || items.length === 0}
          onClick={clearAll}
          className={cn(ghostBtn, "min-h-10 text-rose-600 hover:text-rose-700")}
        >
          Clear all
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
        </div>
      ) : empty ? (
        <div
          className={cn(
            portalCardClass,
            "flex flex-col items-center justify-center px-6 py-16 text-center",
          )}
        >
          <Bell className="mb-3 h-10 w-10 text-navy-300" />
          <p className="text-sm font-medium text-navy-700">No notifications yet</p>
          <p className="mt-1 text-[13px] text-navy-400">
            Campus alerts and system messages will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const unread = !item.readAt;
            const highlighted = item.id === highlightId;
            return (
              <li
                key={item.id}
                id={`notification-${item.id}`}
                className={cn(
                  portalCardClass,
                  "p-4 transition-all",
                  unread && "border-navy-300 bg-navy-50/30",
                  highlighted && "ring-2 ring-navy-400 ring-offset-2",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-semibold text-navy-900">
                        {item.title}
                      </h2>
                      {unread && (
                        <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                          New
                        </span>
                      )}
                      <span className="text-[10px] font-medium uppercase tracking-wider text-navy-400">
                        {item.type}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-navy-600">
                      {item.body}
                    </p>
                    <p className="mt-2 text-[11px] text-navy-400">
                      {formatWhen(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {unread && (
                      <button
                        type="button"
                        title="Mark read"
                        onClick={() => markRead(item.id)}
                        className={cn(ghostBtn, "min-h-9 px-2.5")}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteOne(item.id)}
                      className={cn(ghostBtn, "min-h-9 px-2.5 text-rose-600")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!empty && (
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={cn(primaryBtn, "mt-6 w-full min-h-11")}
        >
          Refresh
        </button>
      )}
    </div>
  );
}
