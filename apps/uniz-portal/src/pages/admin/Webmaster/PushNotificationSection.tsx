/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Send,
  Users,
  Search,
  Loader2,
  Smartphone,
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
    <div className="p-8 space-y-10 animate-in fade-in duration-700 pb-20 text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black tracking-tight text-slate-900 leading-none">
            Push & Alerts
          </h2>
          <p className="text-slate-500 font-medium">
            Manage browser push subscriptions and broadcast instant system
            alerts.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSendModal(true)}
            className="uniz-primary-btn px-8 gap-2.5"
          >
            <Zap size={20} className="text-amber-300" />
            Send Broadcast
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {/* Subscribers List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              Active Subscriptions
            </h3>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Prefix Search..."
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white focus:border-slate-900 outline-none transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin w-8 h-8 text-slate-200" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Querying database...
              </p>
            </div>
          ) : subscribers.length > 0 ? (
            <div className="space-y-4">
              {subscribers.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white border border-transparent hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shadow-sm">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight capitalize">
                        {sub.username}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                        {sub.endpoint}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      Active
                    </p>
                    <p className="text-[8px] font-bold text-slate-300">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex justify-center items-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="uniz-primary-btn h-auto py-2 px-4 bg-transparent text-slate-500 hover:bg-slate-100 shadow-none hover:shadow-none"
                >
                  Prev
                </button>
                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-black text-xs">
                  {page}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="uniz-primary-btn h-auto py-2 px-4 bg-transparent text-slate-500 hover:bg-slate-100 shadow-none hover:shadow-none"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center space-y-4">
              <Users size={40} className="mx-auto text-slate-100" />
              <p className="text-sm font-bold text-slate-400">
                No active push subscribers found.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setShowSendModal(false)}
          />
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <div className="bg-blue-600 p-8 text-white relative flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Send size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">
                  Push Broadcast
                </h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                  Instant delivery to all active devices
                </p>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="p-10 space-y-6">
              <div className="space-y-4">
                {/* Target */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                    <Target size={12} /> Target Audience
                  </label>
                  <select
                    value={broadcast.target}
                    onChange={(e) =>
                      setBroadcast({ ...broadcast, target: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl font-bold text-slate-900 outline-none"
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
