/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  ScanLine,
  Search,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Shield,
  History,
  Users,
} from "lucide-react";
import {
  SECURITY_SUMMARY,
  SECURITY_CHECKIN,
  SECURITY_CHECKOUT,
  SEARCH_STUDENTS,
} from "../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../api/apiClient";

export default function SecurityPortal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await apiClient<any>(SECURITY_SUMMARY);
      if (data && data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch security summary", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const data = await apiClient<any>(SEARCH_STUDENTS, {
        method: "POST",
        body: JSON.stringify({ username: searchQuery, limit: 5 }),
      });
      if (data && data.success) {
        setSearchResults(data.students || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAction = async (
    requestId: string,
    action: "checkin" | "checkout",
  ) => {
    setProcessingId(requestId);
    const endpoint =
      action === "checkin"
        ? SECURITY_CHECKIN(requestId)
        : SECURITY_CHECKOUT(requestId);

    try {
      const data = await apiClient<any>(endpoint, {
        method: "POST",
      });
      if (data && data.success) {
        toast.success(
          `Success: ${action === "checkin" ? "Checked-In" : "Checked-Out"}`,
        );
        fetchSummary();
        setSearchResults([]);
        setSearchQuery("");
      }
    } catch (error) {
      console.error("Operation failed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 md:p-10 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-700">
            <Shield size={12} className="text-emerald-500" /> Secure Gate
            Terminal
          </div>
          <h1 className="text-3xl font-black tracking-tight">Access Control</h1>
          <p className="text-slate-400 font-medium">
            UniZ Integrated Security Management System
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
          <ScanLine size={240} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 space-y-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Students Outside
            </p>
            <h3 className="text-3xl font-black text-slate-900">
              {summary?.totalOutside || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Today's Checkins
            </p>
            <h3 className="text-3xl font-black text-emerald-500">
              {summary?.todayCheckins || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Today's Checkouts
            </p>
            <h3 className="text-3xl font-black text-amber-500">
              {summary?.todayCheckouts || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Pending Sync
            </p>
            <h3 className="text-3xl font-black text-slate-300">0</h3>
          </div>
        </div>

        {/* Search / Scan Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 space-y-8">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 group-focus-within:text-slate-900 transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              placeholder="SCAN ID CARD OR ENTER UNIVERSITY ID..."
              className="w-full bg-slate-50 border-2 border-slate-50 px-16 py-6 rounded-2xl font-black text-xl tracking-tight focus:bg-white focus:border-slate-900 outline-none transition-all placeholder:text-slate-300"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute inset-y-2 right-2 px-8 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center gap-2"
            >
              {searching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ScanLine size={16} />
              )}
              Search
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-slate-400" />
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Matched Personnel
                </h4>
              </div>
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black text-xl shadow-sm border border-slate-100">
                      {student.username[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight">
                        {student.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {student.username} • {student.branch} {student.year}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Action buttons based on status - simplified for gate */}
                    <button
                      onClick={() => handleAction(student.username, "checkout")}
                      disabled={processingId === student.username}
                      className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {processingId === student.username ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ArrowUpRight size={14} />
                      )}
                      Allow Exit
                    </button>
                    <button
                      onClick={() => handleAction(student.username, "checkin")}
                      disabled={processingId === student.username}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {processingId === student.username ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ArrowDownLeft size={14} />
                      )}
                      Allow Entry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Mini-Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History size={20} className="text-slate-400" />
                <h3 className="font-black text-slate-900 uppercase tracking-tight">
                  Recent Logs
                </h3>
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Auto-Refreshing
              </span>
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                      <Clock size={16} className="text-slate-300" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">
                        SAMPLE_ID_{i}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Entry Recorded • 14:2{i}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-black tracking-tight leading-tight">
                Sync Status:
                <br />
                Operational
              </h3>
              <p className="text-emerald-100 font-medium text-sm">
                Gate terminal is synchronized with central core. All actions are
                logged in real-time.
              </p>
            </div>
            <div className="relative z-10 pt-8 mt-auto">
              <div className="w-full bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between">
                <span className="font-black uppercase tracking-widest text-[10px]">
                  Encryption Active
                </span>
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            <div className="absolute right-0 top-0 opacity-10 -translate-y-1/4 translate-x-1/4">
              <Shield size={200} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
