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
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";
import {
  SECURITY_SUMMARY,
  SECURITY_CHECKIN,
  SECURITY_CHECKOUT,
  SEARCH_STUDENTS,
} from "../../api/endpoints";
import { toast } from "react-toastify";
import { apiClient } from "../../api/apiClient";
import { useSmartPolling } from "../../hooks/useSmartPolling";
import { useIsAuth } from "../../hooks/is_authenticated";
import { useLogout } from "../../hooks/useLogout";
import SearchStudents from "./searchstudents";

export default function SecurityPortal() {
  useIsAuth();
  const { logout } = useLogout();
  const [activeTab, setActiveTab] = useState<"dashboard" | "logs" | "search">("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const username = JSON.parse(localStorage.getItem("username") || '"Security"');

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "search", label: "Search Directory", icon: Search },
    { id: "logs", label: "Activity Logs", icon: History },
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

  const renderContent = () => {
    if (activeTab === "logs") {
      return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[28px] border border-slate-100 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History size={20} className="text-slate-400" />
                <h3 className="font-black text-slate-900 uppercase tracking-tight">
                  Recent Activity Logs
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
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
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
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
        <div className="bg-gradient-to-br from-slate-900 to-[#1e293b] rounded-[28px] py-6 px-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
          <div className="relative z-10 space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                Gate Security Operational
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] mb-1.5 leading-none">
                Access Control Terminal
              </h1>
              <p className="text-slate-400 font-medium text-[15px] opacity-90 max-w-lg leading-relaxed">
                Campus Security Engine. Orchestrate student entry and exit
                protocols through your administrative terminal.
              </p>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-[0.03] translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
            <ScanLine size={280} />
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Students Outside
            </p>
            <h3 className="text-3xl font-black text-slate-900 leading-none">
              {summary?.totalOutside || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Today's Checkins
            </p>
            <h3 className="text-3xl font-black text-emerald-500 leading-none">
              {summary?.todayCheckins || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Today's Checkouts
            </p>
            <h3 className="text-3xl font-black text-amber-500 leading-none">
              {summary?.todayCheckouts || 0}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Sync Status
            </p>
            <h3 className="text-3xl font-black text-blue-500 leading-none">
              Active
            </h3>
          </div>
        </div>

        {/* Search / Scan Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg p-8 space-y-8">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 group-focus-within:text-slate-900 transition-colors">
              <Search size={22} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              placeholder="SCAN ID CARD OR ENTER UNIVERSITY ID..."
              className="w-full bg-slate-50 border-2 border-slate-50 px-16 py-6 rounded-2xl font-black text-xl tracking-tight focus:bg-white focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 shadow-inner"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute inset-y-3 right-3 px-8 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-black/10 active:scale-95 disabled:opacity-50"
            >
              {searching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ScanLine size={16} />
              )}
              Initialize Scan
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-slate-400" />
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Personnel Record Identified
                </h4>
              </div>
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  className="bg-slate-50 rounded-2xl p-6 flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black text-xl shadow-sm border border-slate-100 overflow-hidden ring-4 ring-slate-100">
                      {student.username[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight text-lg">
                        {student.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {student.username} • {student.branch} {student.year}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
                      Log Exit
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
                      Log Entry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Info Banner */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden group">
          <div className="relative z-10 space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-black tracking-tight leading-tight">
              Gate Synchronization System
            </h3>
            <p className="text-emerald-100 font-medium text-sm max-w-xl">
              Terminal is actively synchronized with the central server. All
              entry and exit movements are recorded with military-grade
              precision.
            </p>
          </div>
          <div className="relative z-10 mt-6 md:mt-0">
            <div className="px-6 py-3 bg-white/20 backdrop-blur-md rounded-2xl flex items-center gap-4">
              <span className="font-black uppercase tracking-widest text-[10px]">
                System Operational
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_10px_rgba(110,231,183,1)]" />
            </div>
          </div>
          <div className="absolute right-0 top-0 opacity-10 -translate-y-1/4 translate-x-1/4">
            <Shield size={200} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-100 transition-all duration-300 z-50 ${isSidebarOpen ? "w-72" : "w-20"} hidden md:flex flex-col premium-shadow h-screen sticky top-0`}
      >
        {/* Header with logo */}
        <div className="flex items-center space-x-3.5 p-6 bg-transparent shrink-0">
          <div className="w-14 h-14 flex items-center justify-center p-1 shrink-0">
            <img
              src="/assets/ongole_logo.png"
              className="h-full w-full object-contain"
              alt="Ongole Logo"
            />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col animate-in fade-in duration-500">
              <span className="font-semibold text-slate-900 text-[19px] tracking-tight leading-none">
                Ongole
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-600/80 font-semibold mt-1.5 px-0.5">
                SECURITY PORTAL
              </span>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-full text-left transition-all duration-200 group relative
                  ${isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <div className="flex items-center justify-center min-w-[24px]">
                  <Icon
                    size={21}
                    className={`shrink-0 transition-transform group-hover:scale-110 duration-200
                      ${isActive
                        ? "text-emerald-600"
                        : "text-slate-400 group-hover:text-slate-700"
                      }`}
                  />
                </div>
                {isSidebarOpen && (
                  <span
                    className={`text-[13px] whitespace-nowrap tracking-tight transition-all
                      ${isActive ? "font-bold" : "font-semibold text-slate-500 group-hover:text-emerald-600"}`}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto px-3 py-4 space-y-1 border-t border-slate-50 shrink-0">
          <div className="flex items-center px-4 py-3 group rounded-full transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center border border-emerald-200 shadow-sm overflow-hidden shrink-0">
              <span className="text-emerald-700 font-semibold text-[11px]">
                {username[0].toUpperCase()}
              </span>
            </div>
            {isSidebarOpen && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-slate-900 truncate tracking-tight">
                  {username}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-full text-left transition-all duration-200 group text-red-500 hover:bg-red-50"
          >
            <div className="flex items-center justify-center min-w-[24px]">
              <LogOut size={20} className="shrink-0 transition-transform group-hover:rotate-12" />
            </div>
            {isSidebarOpen && <span className="text-[15px] font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        <header className="bg-white/95 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100/80 p-5 px-8 flex justify-between items-center shadow-sm shadow-slate-50/50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full hover:bg-white hover:shadow-lg transition-all md:flex hidden text-slate-400 hover:text-emerald-600 active:scale-95"
          >
            {isSidebarOpen ? <Menu size={18} /> : <ChevronRight size={18} />}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {username}
              </p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                Gate Security Officer
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-semibold text-emerald-600">
              {username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}
