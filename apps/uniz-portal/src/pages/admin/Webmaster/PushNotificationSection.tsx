/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Send,
  Users,
  Search,
  Loader2,
  X,
  Image as ImageIcon,
  Target,
  Zap,
} from "lucide-react";
import { PUSH_SUBSCRIBERS, PUSH_SEND } from "../../../api/endpoints";
import { apiClient } from "../../../api/apiClient";
import { toast } from "react-toastify";

export default function PushNotificationSection() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);

  // Broadcast Form State
  const [broadcast, setBroadcast] = useState({
    target: "all", // all, student, batch, year
    title: "",
    body: "",
    image: "",
  });

  useEffect(() => {
    fetchSubscribers();
  }, [page, searchQuery]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const data = await apiClient<any>(PUSH_SUBSCRIBERS, {
        params: {
          prefix: searchQuery,
          page,
          limit: 50,
        },
      });
      if (data) {
        setSubscribers(data.subscribers || []);
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
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
              size={14}
            />
            <input
              type="text"
              placeholder="Subscriber Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-5 h-11 bg-white border border-slate-200 rounded-full text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all w-[240px] shadow-sm"
            />
          </div>

          <button
            onClick={() => setShowSendModal(true)}
            className="h-11 px-6 bg-blue-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2.5"
          >
            <Zap size={16} className="text-amber-300" />
            Send Broadcast
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden text-slate-900">
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
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan={5}
                        className="px-10 py-8 bg-slate-50/20"
                      ></td>
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
                        <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-slate-200 border-2 border-white ring-1 ring-slate-100 uppercase">
                          {sub.username?.[0] || "U"}
                        </div>
                        <p className="font-semibold text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
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
                      <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 w-fit">
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
                      <div className="p-6 bg-slate-50 rounded-full border border-slate-100 shadow-inner text-slate-300">
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
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white shadow-lg text-[10px] font-bold">
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

      {/* Broadcast Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowSendModal(false)}
          />
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="bg-blue-600 p-8 text-white relative flex items-center gap-5">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Send size={26} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                  Push Broadcast
                </h3>
                <p className="text-white/70 text-[10px] font-semibold uppercase tracking-[0.2em] mt-1.5">
                  Instant Pulse Delivery
                </p>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors"
              >
                <X size={26} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="p-10 space-y-6">
              <div className="space-y-4">
                {/* Target */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <Target size={14} /> Target Audience
                  </label>
                  <select
                    value={broadcast.target}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, target: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all cursor-pointer"
                  >
                    <option value="all">All Students</option>
                    <option value="student">Individuals</option>
                    <option value="batch">Year Batch</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Title
                  </label>
                  <input
                    required
                    type="text"
                    value={broadcast.title}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, title: e.target.value })
                    }
                    placeholder="e.g. Campus Holiday Tomorrow"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-slate-900"
                  />
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Message Body
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={broadcast.body}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, body: e.target.value })
                    }
                    placeholder="Enter the alert content..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-slate-900 outline-none transition-all font-bold text-slate-900 resize-none"
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <ImageIcon size={12} /> Banner Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={broadcast.image}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, image: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-slate-900 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <button
                disabled={sending}
                type="submit"
                className="w-full uniz-primary-btn h-[60px]"
              >
                {sending ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <Send size={18} />
                )}
                Send Instant Alert
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
