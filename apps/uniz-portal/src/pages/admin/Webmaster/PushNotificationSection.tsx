/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Send,
  Users,
  Search,
  Loader2,
  X,
} from "lucide-react";
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
          data: data.subscribers || []
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
    <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-semibold tracking-[-0.02em] text-slate-900 leading-none">
            Push & Alerts
          </h2>
          <p className="text-slate-500 font-medium text-[15px]">
            Manage browser push subscriptions and broadcast instant system
            alerts.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors"
              size={14}
            />
            <input
              type="text"
              placeholder="Subscriber Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-5 h-11 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 transition-all w-[240px]"
            />
          </div>

          <button
            onClick={() => setShowSendModal(true)}
            className="h-11 px-6 bg-navy-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-navy-800 active:scale-95 transition-all flex items-center justify-center gap-2.5"
          >
            Send Broadcast
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden text-slate-900 shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Subscriber
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Endpoint Identifier
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Status
                </th>
                <th className="px-10 py-6 text-[11px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50/20">
                  Creation Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/60">
              {loading ? (
                Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-50 last:border-0 hover:bg-transparent">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border-2 border-white ring-1 ring-slate-100 shadow-sm" />
                          <div className="space-y-2">
                            <div className="h-4 w-24 bg-slate-100 rounded-lg shadow-sm" />
                            <div className="h-2 w-16 bg-slate-50 rounded shadow-sm opacity-60" />
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="h-3.5 w-48 bg-slate-50 rounded-lg shadow-sm opacity-60" />
                      </td>
                      <td className="px-10 py-6">
                        <div className="h-7 w-20 bg-emerald-50/50 rounded-xl border border-emerald-100/50" />
                      </td>
                      <td className="px-10 py-6">
                        <div className="space-y-2">
                          <div className="h-4 w-28 bg-slate-100 rounded-lg shadow-sm" />
                          <div className="h-2 w-16 bg-slate-50 rounded shadow-sm opacity-60" />
                        </div>
                      </td>
                    </tr>
                  ))
              ) : subscribers.length > 0 ? (
                subscribers.map((sub, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/30 transition-all group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm border-2 border-white ring-1 ring-slate-100 uppercase">
                          {sub.username?.[0] || "U"}
                        </div>
                        <p className="font-semibold text-slate-900 tracking-tight leading-none group-hover:text-navy-900 transition-colors">
                          {sub.username}
                        </p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[300px] opacity-70"
                        title={sub.endpoint}
                      >
                        {sub.endpoint}
                      </p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 w-fit">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                          Active
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold tracking-tight text-slate-700">
                          {new Date(sub.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                          Registered
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-5">
                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-slate-300">
                        <Users size={40} />
                      </div>
                      <p className="font-semibold text-slate-400 italic text-sm tracking-tight">
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
          <div className="px-10 py-5 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Subscriber Pulse Monitor
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Prev
              </button>
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 text-white text-[10px] font-bold">
                {page}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all active:scale-95"
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
        <AlertDialogContent className="max-w-xl p-0 overflow-hidden bg-white border-slate-100 rounded-2xl shadow-2xl">
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowSendModal(false);
                setBroadcast({ target: "all", title: "", body: "", image: "" });
              }}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <AlertDialogHeader className="p-8 pb-4 flex flex-col items-center text-center gap-2">
              <AlertDialogTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                Push Broadcast
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[14px] font-medium text-slate-500 mt-1 leading-relaxed">
                Send an instant pulse alert to campus devices.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleSendBroadcast} className="px-8 pb-8 space-y-6">
              <div className="space-y-5">
                {/* Target */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Target Audience
                  </label>
                  <select
                    value={broadcast.target}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, target: e.target.value })
                    }
                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all cursor-pointer"
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      User ID / Username
                    </label>
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
                      className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                    />
                  </div>
                )}
                {broadcast.target === "batch" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Batch Prefix
                    </label>
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
                      className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                    />
                  </div>
                )}
                {broadcast.target === "year" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Academic Year
                    </label>
                    <select
                      value={(broadcast as any).year || "E1"}
                      onChange={(e) =>
                        setBroadcast({
                          ...broadcast,
                          year: e.target.value,
                        } as any)
                      }
                      className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all cursor-pointer"
                    >
                      {["E1", "E2", "E3", "E4", "P1", "P2"].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Alert Title
                  </label>
                  <input
                    required
                    type="text"
                    value={broadcast.title}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, title: e.target.value })
                    }
                    placeholder="e.g. Campus Holiday Tomorrow"
                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  />
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Payload Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={broadcast.body}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, body: e.target.value })
                    }
                    placeholder="Enter the alert content..."
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl px-6 py-4 font-bold text-slate-900 outline-none transition-all resize-none placeholder:text-slate-300"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Banner Asset URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={broadcast.image}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, image: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-200 focus:border-navy-900 focus:bg-white rounded-xl outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSendModal(false);
                    setBroadcast({ target: "all", title: "", body: "", image: "" });
                  }}
                  className="flex-1 py-3.5 rounded-xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-[2] py-3.5 rounded-xl bg-navy-900 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-navy-100 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Send size={16} />
                  )}
                  {sending ? "DELIVERING..." : "DELIVER PULSE"}
                </button>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
