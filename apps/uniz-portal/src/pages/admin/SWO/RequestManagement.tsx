/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  Ban,
  Search,
  Inbox,
  Loader2,
  Forward,
  TrendingUp,
} from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import {
  GET_OUTING_REQUESTS,
  GET_OUTPASS_REQUESTS,
  APPROVE_OUTING,
  REJECT_OUTING,
  FORWARD_OUTING,
  APPROVE_OUTPASS,
  REJECT_OUTPASS,
  FORWARD_OUTPASS,
} from "../../../api/endpoints";
import { toast } from "react-toastify";

interface RequestManagementProps {
  type: "outing" | "outpass";
}

export default function RequestManagement({ type }: RequestManagementProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Use the parameters provided by the user in the snippet: page=1&limit=50
      const baseUrl =
        type === "outing" ? GET_OUTING_REQUESTS : GET_OUTPASS_REQUESTS;
      const url = `${baseUrl}?page=1&limit=50${searchQuery ? `&search=${searchQuery}` : ""}`;

      const data = await apiClient<any>(url);
      if (data && data.success) {
        const fetchedRequests =
          type === "outing" ? data.outings : data.outpasses;
        setRequests(fetchedRequests || []);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [type]); // Fetching on type change. Server side search could be added to dependency but let's keep client search for smoothness unless explicitly asked for debounced server search.

  const handleAction = async (
    action: "approve" | "reject" | "forward",
    id: string,
  ) => {
    let message = "";
    if (action === "approve") {
      message =
        prompt("Enter approval message:", "Parent verified. Fine to go.") || "";
      if (message === "") return;
    } else if (action === "reject") {
      message =
        prompt("Enter rejection comment:", "Emergency not valid.") || "";
      if (message === "") return;
    }

    setActionLoading(id);
    try {
      let endpoint = "";
      if (type === "outing") {
        if (action === "approve") endpoint = APPROVE_OUTING(id);
        else if (action === "reject") endpoint = REJECT_OUTING(id);
        else endpoint = FORWARD_OUTING(id);
      } else {
        if (action === "approve") endpoint = APPROVE_OUTPASS(id);
        else if (action === "reject") endpoint = REJECT_OUTPASS(id);
        else endpoint = FORWARD_OUTPASS(id);
      }

      const body =
        action === "forward"
          ? { id }
          : action === "approve"
            ? { message }
            : { comment: message };

      const data = await apiClient<any>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (data && data.success) {
        toast.success(data.msg || `Request ${action}ed successfully`);
        setRequests((prev) => prev.filter((r) => r._id !== id));
      } else {
        toast.error(data?.msg || "Action failed");
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  // Local filter for instant responsiveness
  const filteredRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reason?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [requests, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-navy-900 animate-spin" />
        <p className="text-slate-500 font-medium">
          Fetching pending applications...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-navy-900 font-bold text-[10px] uppercase tracking-[0.2em]">
            <TrendingUp size={14} />
            Live Queue
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 capitalize">
            {type} Management
          </h1>
          <p className="text-slate-500 font-medium">
            Review and process pending {type} requests for the student body.
          </p>
        </div>

        <div className="relative group w-full md:w-96">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Student ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-navy-900/5 focus:border-navy-100 outline-none transition-all font-medium text-slate-900 shadow-sm"
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-100 p-24 flex flex-col items-center justify-center text-center space-y-6 shadow-sm border-dashed min-h-[400px]">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
            <Inbox size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-slate-900">All clear!</p>
            <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
              No pending {type} requests found. New applications will appear
              here in real-time.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredRequests.map((request) => (
            <div
              key={request._id}
              className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all group flex flex-col h-full"
            >
              {/* Card Top: Identity & Status */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-2xl border-4 border-white shadow-sm ring-1 ring-slate-100">
                    {request.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl tracking-tight leading-none mb-2">
                      {request.username}
                    </h3>
                    <p className="text-[12px] text-navy-900 font-black uppercase tracking-widest">
                      {request.studentId || "NO ID"}
                    </p>
                  </div>
                </div>
                <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border border-amber-100">
                  PENDING
                </div>
              </div>

              {/* Content Divider */}
              <div className="h-px bg-slate-50 w-full mb-8" />

              <div className="flex-1 space-y-6">
                {/* Reason Section */}
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">
                    Reason
                  </span>
                  <p className="text-slate-700 font-semibold text-[15px] leading-relaxed italic">
                    "{request.reason || "No reason specified."}"
                  </p>
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-2 gap-6 pb-2">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      From
                    </span>
                    <p
                      className="text-slate-900 font-bold text-[13px] truncate"
                      title={request.from_time || request.from_day}
                    >
                      {request.from_time || request.from_day}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      To
                    </span>
                    <p
                      className="text-slate-900 font-bold text-[13px] truncate"
                      title={request.to_time || request.to_day}
                    >
                      {request.to_time || request.to_day}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pb-2">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      Duration
                    </span>
                    <p className="text-slate-900 font-bold text-[13px]">
                      {request.duration || "0 seconds"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-right">
                      Submitted
                    </span>
                    <p className="text-slate-900 font-bold text-[13px] text-right truncate">
                      {request.requested_time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider before actions */}
              <div className="h-px bg-slate-50 w-full my-8" />

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleAction("approve", request._id)}
                  disabled={!!actionLoading}
                  className="h-12 bg-[#1a1f2e] text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#252c41] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                >
                  {actionLoading === request._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleAction("reject", request._id)}
                  disabled={!!actionLoading}
                  className="h-12 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading === request._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Ban size={16} />
                  )}
                  Reject
                </button>
                <button
                  onClick={() => handleAction("forward", request._id)}
                  disabled={!!actionLoading}
                  className="h-12 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading === request._id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Forward size={16} />
                  )}
                  Forward
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
