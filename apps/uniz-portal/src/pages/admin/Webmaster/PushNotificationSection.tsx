/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { Send, Users, Search, Loader2, X } from "lucide-react";
import { PUSH_SUBSCRIBERS, PUSH_SEND } from "../../../api/endpoints";
import { apiClient } from "../../../api/apiClient";
import { toast } from "@/utils/toast-ref";
import { useRecoilState } from "recoil";
import { pushNotificationsAtom } from "../../../store/atoms";
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
} from "../../../components/admin/admin-ui";
import { cn } from "../../../utils/cn";

export default function PushNotificationSection() {
  const [pushState, setPushState] = useRecoilState(pushNotificationsAtom);
  const subscribers = pushState.data;
  const [loading, setLoading] = useState(!pushState.fetched);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);

  // Broadcast Form State
  const [broadcast, setBroadcast] = useState({
    target: "all", // all, students, year, batch, hod, dean, user
    title: "",
    body: "",
    image: "",
  });

  useEffect(() => {
    fetchSubscribers();
  }, [page, searchQuery]);

  const fetchSubscribers = async () => {
    if (!pushState.fetched) setLoading(true);
    try {
      const data = await apiClient<any>(PUSH_SUBSCRIBERS, {
        params: {
          prefix: searchQuery,
          page,
          limit: 50,
        },
      });
      if (data) {
        setPushState({
          fetched: true,
          data: data.subscribers || [],
        });
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

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
                placeholder="Search subscribers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(adminInputClass, "pl-10 w-[240px]")}
              />
            </div>
            <button
              onClick={() => setShowSendModal(true)}
              className={adminPrimaryButtonClass}
            >
              <Send size={15} /> Send Broadcast
            </button>
          </>
        }
      />

      {/* Content Sections */}
      <div className={cn(adminCardClass, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/70">
                <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Subscriber
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Endpoint Identifier
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Status
                </th>
                <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  Creation Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100" />
                          <div className="space-y-2">
                            <div className="h-4 w-24 bg-zinc-100 rounded-lg" />
                            <div className="h-2 w-16 bg-zinc-50 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="h-3.5 w-48 bg-zinc-50 rounded-lg" />
                      </td>
                      <td className="px-8 py-5">
                        <div className="h-6 w-20 bg-zinc-100 rounded-full" />
                      </td>
                      <td className="px-8 py-5">
                        <div className="space-y-2">
                          <div className="h-4 w-28 bg-zinc-100 rounded-lg" />
                          <div className="h-2 w-16 bg-zinc-50 rounded" />
                        </div>
                      </td>
                    </tr>
                  ))
              ) : subscribers.length > 0 ? (
                subscribers.map((sub, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-zinc-50/60 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-semibold text-[13px] uppercase shrink-0">
                          {sub.username?.[0] || "U"}
                        </div>
                        <p className="font-semibold text-zinc-900 tracking-tight">
                          {sub.username}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p
                        className="text-[12px] text-zinc-400 truncate max-w-[300px]"
                        title={sub.endpoint}
                      >
                        {sub.endpoint}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="inline-flex items-center gap-1.5 text-zinc-700 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-medium">Active</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <p className="text-[13px] font-medium tracking-tight text-zinc-700 tabular-nums">
                          {new Date(sub.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-[0.12em] mt-0.5">
                          Registered
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 flex items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200/70 text-zinc-300">
                        <Users size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[14px] font-medium text-zinc-500 tracking-tight">
                        No active push subscribers found.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {subscribers.length > 0 && (
          <div className="px-8 py-4 bg-zinc-50/50 border-t border-zinc-200/70 flex items-center justify-between">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.12em]">
              Subscriber Pulse Monitor
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3.5 border border-zinc-200 rounded-lg text-[12px] font-semibold text-zinc-600 bg-white hover:text-zinc-900 hover:border-zinc-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Prev
              </button>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white text-[12px] font-semibold tabular-nums">
                {page}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3.5 border border-zinc-200 rounded-lg text-[12px] font-semibold text-zinc-600 bg-white hover:text-zinc-900 hover:border-zinc-300 transition-all active:scale-95"
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
            {/* Close Button */}
            <button
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

            <form
              onSubmit={handleSendBroadcast}
              className="px-8 pb-8 space-y-6"
            >
              <div className="space-y-5">
                {/* Target */}
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

                {/* Conditional extra field based on target */}
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

                {/* Title */}
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

                {/* Body */}
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

                {/* Image URL */}
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

              {/* Actions */}
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
