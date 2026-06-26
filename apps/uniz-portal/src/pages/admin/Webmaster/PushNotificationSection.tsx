/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Users, Search, Loader2, X, Bell, Smartphone } from "lucide-react";
import { PUSH_SUBSCRIBERS, PUSH_SEND } from "../../../api/endpoints";
import { apiClient } from "../../../api/apiClient";
import { toast } from "@/utils/toast-ref";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminCardClass,
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminChipClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

type SubscriberRow = {
  id: string;
  username: string;
  endpoint: string;
  createdAt: string;
  displayName?: string | null;
  branch?: string | null;
  year?: string | null;
  batch?: string | null;
  email?: string | null;
};

const SEARCH_DEBOUNCE_MS = 400;

function shortEndpoint(endpoint: string) {
  if (!endpoint) return "—";
  try {
    const url = new URL(endpoint);
    const tail = url.pathname.split("/").filter(Boolean).pop();
    return tail ? `…${tail.slice(-18)}` : url.hostname;
  } catch {
    return endpoint.length > 28 ? `…${endpoint.slice(-24)}` : endpoint;
  }
}

export default function PushNotificationSection() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const fetchGenRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const [broadcast, setBroadcast] = useState({
    target: "all",
    title: "",
    body: "",
    image: "",
  });

  const fetchSubscribers = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    if (!hasLoadedRef.current) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await apiClient<any>(PUSH_SUBSCRIBERS, {
        params: {
          search: debouncedSearch.trim() || undefined,
          page,
          limit: 50,
        },
      });
      if (gen !== fetchGenRef.current || !data) return;
      setSubscribers(data.subscribers || []);
      setTotal(data.total ?? data.subscribers?.length ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      if (gen === fetchGenRef.current) {
        console.error("Error fetching subscribers:", error);
        toast.error("Failed to load subscribers");
      }
    } finally {
      if (gen === fetchGenRef.current) {
        hasLoadedRef.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch((prev) => {
        const next = searchInput;
        if (next !== prev) setPage(1);
        return next;
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => fetchSubscribers(), 150);
    return () => clearTimeout(t);
  }, [fetchSubscribers]);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const data = await apiClient<any>(PUSH_SEND, {
        method: "POST",
        body: JSON.stringify(broadcast),
      });
      if (data && data.success) {
        toast.success("Push broadcast delivered!");
        setShowSendModal(false);
        setBroadcast({ target: "all", title: "", body: "", image: "" });
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-700 pb-20")}>
      <SectionHeader
        icon={<Send size={18} />}
        eyebrow="Campus"
        title="Push & Alerts"
        subtitle="Manage browser push subscriptions and broadcast instant system alerts."
        actions={
          <>
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                size={15}
              />
              <input
                type="text"
                placeholder="Search by ID, name, or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={cn(adminInputClass, "pl-10 w-[280px]")}
              />
              {refreshing && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowSendModal(true)}
              className={adminPrimaryButtonClass}
            >
              <Send size={15} /> Send Broadcast
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={adminChipClass}>
          <Users size={12} /> {total.toLocaleString()} subscribers
        </span>
        <span className={adminChipClass}>
          Page {page} of {totalPages}
        </span>
        {debouncedSearch.trim() && (
          <span className={adminChipClass}>
            Filter: &quot;{debouncedSearch.trim()}&quot;
          </span>
        )}
      </div>

      <div className={cn(adminCardClass, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-200/70 bg-zinc-50/50">
                <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">
                  Person
                </th>
                <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">
                  Student ID
                </th>
                <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">
                  Academic
                </th>
                <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">
                  Device
                </th>
                <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">
                  Status
                </th>
                <th className="px-6 py-3.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4" colSpan={6}>
                        <div className="h-10 bg-zinc-100 rounded-lg" />
                      </td>
                    </tr>
                  ))
              ) : subscribers.length > 0 ? (
                subscribers.map((sub) => {
                  const displayName = sub.displayName || sub.username;
                  const initials = (displayName || "U").slice(0, 1).toUpperCase();
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-zinc-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-semibold text-[12px] shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 text-[13px] truncate">
                              {displayName}
                            </p>
                            {sub.email && (
                              <p className="text-[11px] text-zinc-500 truncate max-w-[220px]">
                                {sub.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[12px] font-semibold text-zinc-800 tabular-nums ">
                          {sub.username}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {sub.branch || sub.year || sub.batch ? (
                          <div className="flex flex-wrap gap-1">
                            {sub.branch && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                                {sub.branch}
                              </span>
                            )}
                            {sub.year && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                                {sub.year}
                              </span>
                            )}
                            {sub.batch && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                                {sub.batch}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[12px] text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-zinc-500 max-w-[160px]">
                          <Smartphone size={13} className="shrink-0" />
                          <span
                            className="text-[11px] font-mono truncate"
                            title={sub.endpoint}
                          >
                            {shortEndpoint(sub.endpoint)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 text-zinc-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-medium">Active</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[12px] font-medium text-zinc-700 tabular-nums">
                          {new Date(sub.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200/70 text-zinc-300">
                        <Bell size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[14px] font-medium text-zinc-500">
                        {debouncedSearch.trim()
                          ? "No subscribers match your search."
                          : "No active push subscribers found."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {subscribers.length > 0 && (
          <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-200/70 flex items-center justify-between gap-4">
            <p className="text-[11px] font-medium text-zinc-500">
              Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3.5 border border-zinc-200 rounded-lg text-[12px] font-semibold text-zinc-600 bg-white hover:border-zinc-300 disabled:opacity-30 disabled:pointer-events-none"
              >
                Prev
              </button>
              <span className="text-[12px] font-semibold text-zinc-900 tabular-nums px-2">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3.5 border border-zinc-200 rounded-lg text-[12px] font-semibold text-zinc-600 bg-white hover:border-zinc-300 disabled:opacity-30 disabled:pointer-events-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog
        open={showSendModal}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowSendModal(false);
            setBroadcast({ target: "all", title: "", body: "", image: "" });
          }
        }}
      >
        <AlertDialogContent className="max-w-xl p-0 overflow-hidden bg-white border-zinc-200 rounded-2xl shadow-xl">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSendModal(false);
                setBroadcast({ target: "all", title: "", body: "", image: "" });
              }}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <AlertDialogHeader className="p-8 pb-3 flex flex-col items-start text-left gap-1.5">
              <AlertDialogTitle className="text-[20px] font-semibold text-zinc-900 tracking-[-0.01em]">
                Push Broadcast
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[13px] text-zinc-500 leading-relaxed">
                Send an instant pulse alert to campus devices.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleSendBroadcast} className="px-8 pb-8 space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={adminLabelClass}>Target Audience</label>
                  <select
                    value={broadcast.target}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, target: e.target.value })
                    }
                    className={adminSelectClass}
                  >
                    <option value="all">All (Students + Faculty)</option>
                    <option value="students">All Students</option>
                    <option value="year">By Academic Year (E1/E2/E3/E4)</option>
                    <option value="batch">By Batch Prefix (e.g. O21)</option>
                    <option value="user">Single User</option>
                    <option value="hod">HODs Only</option>
                    <option value="dean">Deans Only</option>
                  </select>
                </div>

                {broadcast.target === "user" && (
                  <div className="space-y-2">
                    <label className={adminLabelClass}>User ID / Username</label>
                    <input
                      required
                      type="text"
                      value={(broadcast as any).username || ""}
                      onChange={(e) =>
                        setBroadcast({
                          ...broadcast,
                          username: e.target.value.toUpperCase(),
                        } as any)
                      }
                      placeholder="e.g. O210193"
                      className={adminInputClass}
                    />
                  </div>
                )}
                {broadcast.target === "batch" && (
                  <div className="space-y-2">
                    <label className={adminLabelClass}>Batch Prefix</label>
                    <input
                      required
                      type="text"
                      value={(broadcast as any).batch || ""}
                      onChange={(e) =>
                        setBroadcast({
                          ...broadcast,
                          batch: e.target.value.toLowerCase(),
                        } as any)
                      }
                      placeholder="e.g. o21"
                      className={adminInputClass}
                    />
                  </div>
                )}
                {broadcast.target === "year" && (
                  <div className="space-y-2">
                    <label className={adminLabelClass}>Academic Year</label>
                    <select
                      value={(broadcast as any).year || "E1"}
                      onChange={(e) =>
                        setBroadcast({
                          ...broadcast,
                          year: e.target.value,
                        } as any)
                      }
                      className={adminSelectClass}
                    >
                      {["E1", "E2", "E3", "E4"].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className={adminLabelClass}>Alert Title</label>
                  <input
                    required
                    type="text"
                    value={broadcast.title}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, title: e.target.value })
                    }
                    placeholder="e.g. Campus Holiday Tomorrow"
                    className={adminInputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={adminLabelClass}>Payload Message</label>
                  <textarea
                    required
                    rows={3}
                    value={broadcast.body}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, body: e.target.value })
                    }
                    placeholder="Enter the alert content..."
                    className={adminTextareaClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className={adminLabelClass}>
                    Banner Asset URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={broadcast.image}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, image: e.target.value })
                    }
                    placeholder="https://..."
                    className={adminInputClass}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSendModal(false);
                    setBroadcast({
                      target: "all",
                      title: "",
                      body: "",
                      image: "",
                    });
                  }}
                  className={cn(adminGhostButtonClass, "flex-1")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className={cn(adminPrimaryButtonClass, "flex-[2]")}
                >
                  {sending ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Send size={16} />
                  )}
                  {sending ? "Delivering…" : "Deliver Pulse"}
                </button>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
