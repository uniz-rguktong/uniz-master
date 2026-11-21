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
  adminLabelClass,
  adminInputClass,
  adminSelectClass,
  adminTextareaClass,
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminChipClass,
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3"
                size={15}
              />
              <input
                type="text"
                placeholder="Search by ID, name, or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={cn(adminInputClass, "pl-10 w-full sm:w-72")}
              />
              {refreshing && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-text-3"
                />
              )}
            </div>
            <Button type="button" onClick={() => setShowSendModal(true)}>
              <Send size={15} /> Send Broadcast
            </Button>
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

      {loading ? (
        <p className="text-body text-text-2">Loading subscribers…</p>
      ) : (
        <Table
          rows={subscribers}
          getRowId={(sub) => sub.id}
          empty={
            <EmptyState
              title={
                debouncedSearch.trim()
                  ? "No subscribers match your search."
                  : "No active push subscribers found."
              }
              icon={Bell}
            />
          }
          footer={
            subscribers.length > 0 ? (
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-small text-text-2 tabular-nums">
                  Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="compact" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </Button>
                  <span className="text-small tabular-nums text-text">{page} / {totalPages}</span>
                  <Button type="button" variant="outline" size="compact" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            ) : null
          }
          columns={[
            {
              id: "person",
              header: "Person",
              primary: true,
              cell: (sub) => (
                <span>
                  <span className="block font-semibold text-head">{sub.displayName || sub.username}</span>
                  {sub.email ? <span className="mt-0.5 block text-small text-text-2">{sub.email}</span> : null}
                </span>
              ),
            },
            { id: "id", header: "Student ID", meta: true, cell: (sub) => sub.username },
            {
              id: "academic",
              header: "Academic",
              meta: true,
              cell: (sub) => [sub.branch, sub.year, sub.batch].filter(Boolean).join(" · ") || "—",
            },
            {
              id: "device",
              header: "Device",
              cell: (sub) => (
                <span className="inline-flex max-w-full items-center gap-1.5 text-small text-text-2">
                  <Smartphone size={14} aria-hidden />
                  <span className="truncate">{shortEndpoint(sub.endpoint)}</span>
                </span>
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: () => <Badge tone="success">Active</Badge>,
            },
            {
              id: "registered",
              header: "Registered",
              cell: (sub) => (
                <span className="tabular-nums">
                  {new Date(sub.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              ),
            },
          ]}
        />
      )}

      <AlertDialog
        open={showSendModal}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowSendModal(false);
            setBroadcast({ target: "all", title: "", body: "", image: "" });
          }
        }}
      >
        <AlertDialogContent className="max-w-xl p-0 overflow-hidden bg-surface border-border rounded-lg border border-border/60">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSendModal(false);
                setBroadcast({ target: "all", title: "", body: "", image: "" });
              }}
              className="absolute top-5 right-5 p-2 text-text-3 hover:text-text hover:bg-surface-2 rounded-md transition-[color,background-color,border-color,opacity,transform,box-shadow] z-10"
            >
              <X size={20} />
            </button>

            <AlertDialogHeader className="p-8 pb-3 flex flex-col items-start text-left gap-1.5">
              <AlertDialogTitle className="font-serif text-[24px] font-normal leading-8 text-head">
                Push Broadcast
              </AlertDialogTitle>
              <AlertDialogDescription className="text-small text-text-2 leading-relaxed">
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
