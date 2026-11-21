import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, RefreshCw, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/Skeleton";

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

  return (
    <div className={cn("mx-auto max-w-3xl", isAdmin && "pt-2")}>
      <PageHeader
        title="Notifications"
        meta={unreadCount > 0 ? `${unreadCount} unread` : "You are up to date"}
        action={
          <Button variant="outline" size="compact" onClick={load} disabled={loading} aria-label="Refresh">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        }
      />
      {isAdmin ? (
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-small font-medium text-link"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
      ) : null}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <Button variant="ghost" size="compact" onClick={markAllRead} disabled={busy || unreadCount === 0}>
          Mark all read
        </Button>
        <Button variant="ghost" size="compact" onClick={clearRead} disabled={busy}>
          Clear read
        </Button>
        <Button variant="ghost" size="compact" onClick={clearAll} disabled={busy || items.length === 0}>
          Clear all
        </Button>
      </div>
      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="All caught up" body="New alerts will appear here." />
      ) : (
        <ul className="mt-2 border-b border-border">
          {items.map((item) => {
            const unread = !item.readAt;
            const highlighted = item.id === highlightId;
            return (
              <li
                key={item.id}
                id={`notification-${item.id}`}
                className={cn(
                  "flex items-start gap-3 border-b border-border px-3 py-4 last:border-b-0",
                  (unread || highlighted) && "bg-selected",
                )}
              >
                <span className="mt-2 flex w-2 shrink-0 justify-center" aria-hidden>
                  {unread ? <span className="h-2 w-2 rounded-full bg-navy-600" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={cn("truncate text-dense", unread ? "font-semibold text-head" : "font-medium text-text")}>
                      {item.title}
                    </p>
                    <span className="shrink-0 text-small tabular-nums text-text-3">{timeAgo(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-small leading-[18px] text-text-2">{item.body}</p>
                </div>
                <div className="flex shrink-0 items-center">
                  {unread ? (
                    <button
                      type="button"
                      aria-label="Mark read"
                      onClick={() => markRead(item.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-text-2 hover:bg-tint"
                    >
                      <Check className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Delete notification"
                    onClick={() => deleteOne(item.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-text-2 hover:bg-tint"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
