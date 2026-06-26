/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  ScanLine,
  Search,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Shield,
  History,
  Users,
  LayoutDashboard,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import {
  SECURITY_SUMMARY,
  SECURITY_CHECKIN,
  SECURITY_CHECKOUT,
  SEARCH_STUDENTS,
} from "../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { apiClient } from "../../api/apiClient";
import { useSmartPolling } from "../../hooks/useSmartPolling";
import { useIsAuth } from "../../hooks/is_authenticated";
import { useLogout } from "../../hooks/useLogout";
import SearchStudents from "./searchstudents";

export default function SecurityPortal() {
  useIsAuth();
  const { logout } = useLogout();
  const [activeTab, setActiveTab] = useState<"dashboard" | "logs" | "search">(
    "dashboard",
  );
  const [scanQuery, setScanQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const username = (localStorage.getItem("username") || "Security").replace(
    /"/g,
    "",
  );

  const navGroups = [
    {
      group: null,
      items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
    },
    {
      group: "Access Control",
      items: [
        { id: "search", label: "Search Directory", icon: Search },
        { id: "logs", label: "Activity Logs", icon: History },
      ],
    },
  ];

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

  useSmartPolling(fetchSummary, {
    activeInterval: 300000,
    fallbackInterval: 30000,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanQuery.trim()) return;

    setSearching(true);
    try {
      const data = await apiClient<any>(SEARCH_STUDENTS, {
        method: "POST",
        body: JSON.stringify({ username: scanQuery, limit: 5 }),
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
        setScanQuery("");
      }
    } catch (error) {
      console.error("Operation failed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const renderContent = () => {
    if (activeTab === "logs") {
      return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-3xl border border-zinc-100 p-8 space-y-6 shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History size={22} className="text-zinc-400" />
                <h3 className="text-xl font-semibold text-zinc-900 tracking-tight italic">
                  Recent Activity Logs
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-5 border-b border-zinc-50 last:border-0"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-100 shadow-none">
                      <Clock size={16} className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-zinc-900 tracking-tight">
                        STUDENT_ID_{i}00{i}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-400 tracking-[0.14em] mt-0.5">
                        Entry Recorded • 14:2{i} • Gate 01
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-semibold tracking-[0.14em] border border-emerald-100">
                    Verified
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "search") {
      return (
        <div className="animate-in fade-in duration-500">
          <SearchStudents />
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-emerald-950 to-zinc-900 rounded-3xl py-10 px-12 text-white shadow-none relative overflow-hidden group border border-white/10">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-[0.14em] text-emerald-400">
                Gate Security Operational • Terminal-A
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight mb-2 italic">
                Access Control Terminal
              </h1>
              <p className="text-zinc-100/80 font-medium text-lg max-w-lg leading-relaxed">
                Campus Security Engine. Orchestrate student entry and exit
                protocols through your administrative terminal with precision.
              </p>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-[0.05] translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
            <ScanLine size={400} />
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-7 rounded-3xl border border-zinc-100 shadow-none transition-all hover:border-emerald-200">
            <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em] mb-1 leading-none">
              Students Outside
            </p>
            <h3 className="text-4xl font-semibold text-zinc-900 leading-tight tracking-tight italic">
              {summary?.totalOutside || 0}
            </h3>
          </div>
          <div className="bg-white p-7 rounded-3xl border border-zinc-100 shadow-none transition-all hover:border-emerald-200">
            <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em] mb-1 leading-none">
              Today's Checkins
            </p>
            <h3 className="text-4xl font-semibold text-emerald-600 leading-tight tracking-tight italic">
              {summary?.todayCheckins || 0}
            </h3>
          </div>
          <div className="bg-white p-7 rounded-3xl border border-zinc-100 shadow-none transition-all hover:border-emerald-200">
            <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em] mb-1 leading-none">
              Today's Checkouts
            </p>
            <h3 className="text-4xl font-semibold text-amber-600 leading-tight tracking-tight italic">
              {summary?.todayCheckouts || 0}
            </h3>
          </div>
          <div className="bg-white p-7 rounded-3xl border border-zinc-100 shadow-none transition-all hover:border-emerald-200">
            <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em] mb-1 leading-none">
              Sync Status
            </p>
            <h3 className="text-4xl font-semibold text-zinc-900 leading-tight tracking-tight italic">
              Active
            </h3>
          </div>
        </div>

        {/* Search / Scan Section */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-none p-10 space-y-10">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-8 flex items-center text-zinc-300 group-focus-within:text-zinc-900 transition-colors">
              <Search size={26} />
            </div>
            <input
              type="text"
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value.toUpperCase())}
              placeholder="SCAN ID CARD OR ENTER UNIVERSITY ID..."
              className="w-full bg-zinc-50 border-2 border-zinc-50 px-20 py-8 rounded-3xl font-semibold text-2xl tracking-tight focus:bg-white focus:border-emerald-950 outline-none transition-all placeholder:text-zinc-300 shadow-none"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute inset-y-4 right-4 px-10 bg-emerald-950 text-white rounded-2xl font-semibold tracking-[0.14em] text-[11px] hover:bg-black transition-all flex items-center gap-3 shadow-none active:scale-95 disabled:opacity-50"
            >
              {searching ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ScanLine size={18} />
              )}
              Initialize Scan
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-6 ml-2">
                <Users size={18} className="text-zinc-400" />
                <h4 className="text-xs font-semibold text-zinc-400 tracking-[0.14em] leading-none">
                  Personnel Records Identified ({searchResults.length})
                </h4>
              </div>
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  className="bg-zinc-50 rounded-3xl p-7 flex items-center justify-between group hover:bg-white border border-transparent hover:border-zinc-100 transition-all shadow-none"
                >
                  <div className="flex items-center gap-7">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-zinc-900 font-semibold text-2xl shadow-none border border-zinc-100 overflow-hidden ring-4 ring-zinc-100/50">
                      {student.username[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-900 tracking-tight text-xl italic mb-1">
                        {student.name}
                      </h4>
                      <p className="text-xs font-bold text-zinc-400 tracking-[0.14em]">
                        {student.username} • {student.branch} {student.year}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleAction(student.username, "checkout")}
                      disabled={processingId === student.username}
                      className="flex items-center gap-2.5 px-8 py-4 bg-amber-500 text-white rounded-2xl font-semibold tracking-[0.14em] text-[10px] hover:bg-amber-600 transition-all shadow-none active:scale-95 disabled:opacity-50"
                    >
                      {processingId === student.username ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                      Log Exit
                    </button>
                    <button
                      onClick={() => handleAction(student.username, "checkin")}
                      disabled={processingId === student.username}
                      className="flex items-center gap-2.5 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-semibold tracking-[0.14em] text-[10px] hover:bg-emerald-700 transition-all shadow-none active:scale-95 disabled:opacity-50"
                    >
                      {processingId === student.username ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ArrowDownLeft size={16} />
                      )}
                      Log Entry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Info Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-10 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden group border border-white/10 shadow-none">
          <div className="relative z-10 space-y-3 text-center md:text-left">
            <h3 className="text-3xl font-semibold tracking-tight leading-tight italic">
              Gate Synchronization System
            </h3>
            <p className="text-emerald-100 font-medium text-lg max-w-xl opacity-90 leading-relaxed">
              Terminal is actively synchronized with the central server. All
              entry and exit movements are recorded with military-grade
              precision and security.
            </p>
          </div>
          <div className="relative z-10 mt-8 md:mt-0">
            <div className="px-8 py-4 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center gap-5 border border-white/20">
              <span className="font-semibold tracking-[0.14em] text-[11px]">
                System Operational
              </span>
              <div className="w-3 h-3 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_15px_rgba(110,231,183,1)]" />
            </div>
          </div>
          <div className="absolute right-0 top-0 opacity-10 -translate-y-1/4 translate-x-1/4 group-hover:scale-110 transition-transform duration-1000">
            <Shield size={300} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminShell
      navGroups={navGroups}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as any)}
      onLogout={logout}
      username={username}
      roleLabel="Security Portal"
      showSidebarProfile
      enableNavSearch
      collapseBranding="abbreviate"
      navSpacing="compact"
    >
      {renderContent()}
    </AdminShell>
  );
}
