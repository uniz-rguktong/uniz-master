import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  ArrowLeft,
  RefreshCw,
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
import { getNotificationTypeMeta } from "@/lib/notificationTypeMeta";

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
    : "mx-auto max-w-2xl px-4 pb-12 pt-1 md:px-0 md:pt-0";

  const primaryBtn = isAdmin ? adminPrimaryButtonClass : portalPrimaryButtonClass;
  const ghostBtn = isAdmin ? adminGhostButtonClass : portalGhostButtonClass;

  const studentHeader = (
    <header className="mb-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-navy-900 md:text-2xl">
            Notifications
          </h1>
          <p className="mt-1 text-[13px] text-navy-400">
            Campus alerts and account activity
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {unreadCount > 0 && (
            <span className="rounded-full bg-navy-900 px-2.5 py-1 text-[10px] font-semibold text-white">
              {unreadCount} new
            </span>
          )}
          <button
            type="button"
            title="Refresh"
            disabled={loading}
            onClick={load}
            className={cn(
              ghostBtn,
              "min-h-9 min-w-9 px-2 text-navy-400 hover:text-navy-700",
            )}
          >
            <Loader2 className={cn("h-4 w-4 animate-spin", !loading && "hidden")} />
            <RefreshCw className={cn("h-4 w-4", loading && "hidden")} />
          </button>
        </div>
      </div>
    </header>
  );

  const adminHeader = (
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

  const actionBar = (
    <div
      className={cn(
        "mb-5 flex flex-wrap gap-1.5 rounded-2xl border p-1.5",
        isAdmin
          ? "border-zinc-200 bg-zinc-50"
          : "border-zinc-100 bg-zinc-50/80",
      )}
    >
      <button
        type="button"
        disabled={busy || unreadCount === 0}
        onClick={markAllRead}
        className={cn(
          ghostBtn,
          "min-h-9 flex-1 rounded-xl border-0 bg-transparent text-[12px] font-medium sm:flex-none sm:px-3",
        )}
      >
        <CheckCheck className="h-3.5 w-3.5" />
        Mark all read
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={clearRead}
        className={cn(
          ghostBtn,
          "min-h-9 flex-1 rounded-xl border-0 bg-transparent text-[12px] font-medium sm:flex-none sm:px-3",
        )}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear read
      </button>
      <button
        type="button"
        disabled={busy || items.length === 0}
        onClick={clearAll}
        className={cn(
          ghostBtn,
          "min-h-9 flex-1 rounded-xl border-0 bg-transparent text-[12px] font-medium text-rose-600 hover:text-rose-700 sm:flex-none sm:px-3",
        )}
      >
        Clear all
      </button>
    </div>
  );

  return (
    <div className={shellClass}>
      {isAdmin ? adminHeader : studentHeader}
      {actionBar}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Bell className="h-5 w-5 text-navy-300" />
          </div>
          <p className="text-sm font-medium text-navy-800">All caught up</p>
          <p className="mt-1 max-w-xs text-[13px] text-navy-400">
            New campus alerts will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const unread = !item.readAt;
            const highlighted = item.id === highlightId;
            const meta = getNotificationTypeMeta(item.type, item.title);
            const TypeIcon = meta.Icon;
            return (
              <li
                key={item.id}
                id={`notification-${item.id}`}
                className={cn(
                  "relative overflow-hidden rounded-2xl border bg-white transition-all",
                  isAdmin ? portalCardClass : "border-zinc-100 shadow-sm",
                  unread && !isAdmin && "border-l-[3px] border-l-navy-900 border-zinc-100",
                  unread && isAdmin && "border-navy-300 bg-navy-50/30",
                  highlighted && "ring-2 ring-navy-300 ring-offset-2",
                )}
              >
                <div className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                      meta.bgClass,
                    )}
                    title={meta.label}
                  >
                    <TypeIcon className={cn("h-[18px] w-[18px]", meta.iconClass)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h2 className="text-[14px] font-semibold text-navy-900">
                        {item.title}
                      </h2>
                      {unread && (
                        <span className="h-1.5 w-1.5 rounded-full bg-navy-900" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-navy-400">
                      {meta.label}
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-navy-600">
                      {item.body}
                    </p>
                    <p className="mt-2 text-[11px] text-navy-400">
                      {formatWhen(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    {unread && (
                      <button
                        type="button"
                        title="Mark read"
                        onClick={() => markRead(item.id)}
                        className={cn(
                          ghostBtn,
                          "min-h-8 min-w-8 rounded-lg px-0 text-navy-500",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => deleteOne(item.id)}
                      className={cn(
                        ghostBtn,
                        "min-h-8 min-w-8 rounded-lg px-0 text-navy-400 hover:text-rose-600",
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isAdmin && !empty && (
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
