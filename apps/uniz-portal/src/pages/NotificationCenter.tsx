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

function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(iso),
    );
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
      toast.success("All marked read");
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
      toast.success("Removed");
    } catch {
      toast.error("Could not delete");
    }
  };

  const clearRead = async () => {
    setBusy(true);
    try {
      await apiClient(NOTIFICATION_INBOX_CLEAR("read"), { method: "DELETE" });
      await load();
      toast.success("Read notifications cleared");
    } catch {
      toast.error("Could not clear");
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm("Delete all notifications? This cannot be undone."))
      return;
    setBusy(true);
    try {
      await apiClient(NOTIFICATION_INBOX_CLEAR("all"), { method: "DELETE" });
      await load();
      toast.success("Inbox cleared");
    } catch {
      toast.error("Could not clear");
    } finally {
      setBusy(false);
    }
  };

  const empty = !loading && items.length === 0;

  const ActionButton = ({
    onClick,
    disabled,
    children,
    danger,
  }: {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    danger?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors disabled:opacity-40",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-zinc-600 hover:bg-zinc-100",
      )}
    >
      {children}
    </button>
  );

  return (
    <div
      className={cn(
        "mx-auto max-w-2xl px-4 pb-12",
        isAdmin ? "pt-6" : "pt-1 md:pt-0",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-zinc-900" />
            <h1 className="text-[16px] font-semibold text-zinc-900 tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          title="Refresh"
          disabled={loading}
          onClick={load}
          className="p-2 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-0.5 mb-3 border-b border-zinc-200 pb-2">
        <ActionButton
          onClick={markAllRead}
          disabled={busy || unreadCount === 0}
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </ActionButton>
        <ActionButton onClick={clearRead} disabled={busy}>
          <Trash2 className="h-3 w-3" /> Clear read
        </ActionButton>
        <ActionButton
          onClick={clearAll}
          disabled={busy || items.length === 0}
          danger
        >
          Clear all
        </ActionButton>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="h-8 w-8 text-zinc-200 mb-3" />
          <p className="text-[14px] font-medium text-zinc-500">All caught up</p>
          <p className="text-[12px] text-zinc-400 mt-1">
            New alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
          {items.map((item) => {
            const unread = !item.readAt;
            const highlighted = item.id === highlightId;
            const meta = getNotificationTypeMeta(item.type, item.title);
            const TypeIcon = meta.Icon;
            return (
              <div
                key={item.id}
                id={`notification-${item.id}`}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors group",
                  unread ? "bg-blue-50/40" : "bg-white hover:bg-zinc-50/60",
                  highlighted && "ring-2 ring-inset ring-navy-300",
                )}
              >
                {/* Unread dot */}
                <div className="flex items-center justify-center w-4 pt-1.5 shrink-0">
                  {unread && (
                    <span className="h-2 w-2 rounded-full bg-navy-900" />
                  )}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                    meta.bgClass,
                  )}
                  title={meta.label}
                >
                  <TypeIcon
                    className={cn("h-4 w-4", meta.iconClass)}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p
                      className={cn(
                        "text-[13px] leading-tight truncate",
                        unread
                          ? "font-semibold text-zinc-900"
                          : "font-medium text-zinc-700",
                      )}
                    >
                      {item.title}
                    </p>
                    <span className="text-[11px] text-zinc-400 whitespace-nowrap shrink-0">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {item.body}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {unread && (
                    <button
                      type="button"
                      title="Mark read"
                      onClick={() => markRead(item.id)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-navy-700 hover:bg-zinc-100 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => deleteOne(item.id)}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
