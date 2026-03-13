/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
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
import ProfilePopup from "./ProfilePopup";
import SearchStudents from "./searchstudents";

export default function SecurityPortal() {
  useIsAuth();
  const { logout } = useLogout();
  const [activeTab, setActiveTab] = useState<"dashboard" | "logs" | "search">(
    "dashboard",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const headerAvatarRef = useRef<HTMLButtonElement>(null);
  const [activeAnchor, setActiveAnchor] = useState<React.RefObject<HTMLElement>>(headerAvatarRef);
  const [globalSearch, setGlobalSearch] = useState("");

  const [scanQuery, setScanQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const username = (localStorage.getItem("username") || "Security").replace(/"/g, "");
  const initial = (profileName || username)[0]?.toUpperCase() ?? "S";

  const navGroups = [
    {
      group: null,
      items: [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      ]
    },
    {
      group: "Access Control",
      items: [
        { id: "search", label: "Search Directory", icon: Search },
        { id: "logs", label: "Activity Logs", icon: History },
      ]
    }
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

  // Fetch profile on mount
  useEffect(() => {
    const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
    if (token) {
      import("../../api/endpoints").then(({ BASE_URL }) => {
        fetch(`${BASE_URL}/profile/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setProfilePhoto(data.data.profile_url ?? null);
              setProfileName(data.data.name ?? null);
              setProfileEmail(data.data.email ?? null);
            }
          })
          .catch(() => { });
      });
    }
  }, []);

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
          <div className="bg-white rounded-[28px] border border-slate-100 p-8 space-y-6 shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History size={22} className="text-slate-400" />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
                  Recent Activity Logs
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-5 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-none">
                      <Clock size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[15px] font-black text-slate-900 tracking-tight">
                        STUDENT_ID_{i}00{i}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Entry Recorded • 14:2{i} • Gate 01
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
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
        <div className="bg-gradient-to-br from-emerald-950 to-slate-900 rounded-3xl py-10 px-12 text-white shadow-none relative overflow-hidden group border border-white/10">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Gate Security Operational • Terminal-A
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2 italic">
                Access Control Terminal
              </h1>
              <p className="text-slate-100/80 font-medium text-lg max-w-lg leading-relaxed">
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
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-none transition-all hover:border-emerald-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">
              Students Outside
            </p>
            <h3 className="text-4xl font-black text-slate-900 leading-tight tracking-tight italic">
              {summary?.totalOutside || 0}
            </h3>
          </div>
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-none transition-all hover:border-emerald-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">
              Today's Checkins
            </p>
            <h3 className="text-4xl font-black text-emerald-600 leading-tight tracking-tight italic">
              {summary?.todayCheckins || 0}
            </h3>
          </div>
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-none transition-all hover:border-emerald-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">
              Today's Checkouts
            </p>
            <h3 className="text-4xl font-black text-amber-600 leading-tight tracking-tight italic">
              {summary?.todayCheckouts || 0}
            </h3>
          </div>
          <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-none transition-all hover:border-emerald-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">
              Sync Status
            </p>
            <h3 className="text-4xl font-black text-navy-900 leading-tight tracking-tight italic">
              Active
            </h3>
          </div>
        </div>

        {/* Search / Scan Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-none p-10 space-y-10">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-8 flex items-center text-slate-300 group-focus-within:text-slate-900 transition-colors">
              <Search size={26} />
            </div>
            <input
              type="text"
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value.toUpperCase())}
              placeholder="SCAN ID CARD OR ENTER UNIVERSITY ID..."
              className="w-full bg-slate-50 border-2 border-slate-50 px-20 py-8 rounded-3xl font-black text-2xl tracking-tight focus:bg-white focus:border-emerald-950 outline-none transition-all placeholder:text-slate-300 shadow-none"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute inset-y-4 right-4 px-10 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all flex items-center gap-3 shadow-none active:scale-95 disabled:opacity-50"
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
                <Users size={18} className="text-slate-400" />
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                  Personnel Records Identified ({searchResults.length})
                </h4>
              </div>
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  className="bg-slate-50 rounded-3xl p-7 flex items-center justify-between group hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-none"
                >
                  <div className="flex items-center gap-7">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 font-black text-2xl shadow-none border border-slate-100 overflow-hidden ring-4 ring-slate-100/50">
                      {student.username[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight text-xl italic mb-1">
                        {student.name}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {student.username} • {student.branch} {student.year}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleAction(student.username, "checkout")}
                      disabled={processingId === student.username}
                      className="flex items-center gap-2.5 px-8 py-4 bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-600 transition-all shadow-none active:scale-95 disabled:opacity-50"
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
                      className="flex items-center gap-2.5 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-none active:scale-95 disabled:opacity-50"
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
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden group border border-white/10 shadow-none">
          <div className="relative z-10 space-y-3 text-center md:text-left">
            <h3 className="text-3xl font-black tracking-tight leading-tight italic">
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
              <span className="font-black uppercase tracking-widest text-[11px]">
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
    <div className="flex min-h-screen bg-[#fcfcfd] relative overflow-hidden text-slate-900 selection:bg-navy-100 selection:text-blue-900">
      {/* Sidebar */}
      <aside
        className={`bg-white transition-all duration-300 z-50 ${isSidebarOpen ? "w-[315px]" : "w-24"} hidden md:flex flex-col h-screen sticky top-0 border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-full p-1.5 shadow-md text-slate-400 hover:text-slate-600 hover:scale-110 active:scale-95 transition-all z-50 hidden lg:block"
        >
          {isSidebarOpen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          )}
        </button>

        {/* Sidebar Branding */}
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-center justify-center">
            <h1 className={`unifrakturcook-bold ${isSidebarOpen ? "text-4xl" : "text-3xl"} text-slate-900 tracking-tight transition-all duration-300`}>
              {isSidebarOpen ? "uniZ" : "Z"}
            </h1>
          </div>
        </div>

        {/* Search Style */}
        <div className="px-5 py-4">
          <div className="relative group">
            <Search className={`absolute ${isSidebarOpen ? "left-3" : "left-1/2 -translate-x-1/2"} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors`} size={16} />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder={isSidebarOpen ? "Search operations..." : ""}
              className={`w-full bg-slate-50 border border-slate-200/60 rounded-xl ${isSidebarOpen ? "pl-10 pr-8" : "px-0"} py-2 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-300 transition-all font-medium`}
            />
            {isSidebarOpen && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white border border-slate-200/60 rounded text-[9px] font-bold text-slate-400 uppercase">/</div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className={`flex-1 ${isSidebarOpen ? "px-4" : "px-3"} py-2 overflow-y-auto space-y-6 custom-sidebar-scroll`}>
          {(() => {
            const filteredGroups = navGroups.map(group => ({
              ...group,
              items: group.items.filter(item =>
                item.label.toLowerCase().includes(globalSearch.toLowerCase())
              )
            })).filter(group => group.items.length > 0);

            if (filteredGroups.length === 0 && globalSearch) {
              return (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Search size={20} className="text-slate-300" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4">No operations found</p>
                </div>
              );
            }

            return filteredGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                {group.group && isSidebarOpen && (
                  <h4 className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">{group.group}</h4>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      title={!isSidebarOpen ? item.label : ""}
                      className={`
                        w-full flex items-center ${isSidebarOpen ? "space-x-3.5 px-3.5" : "justify-center px-0"} py-2.5 rounded-xl text-left transition-all duration-200 group relative
                        ${isActive
                          ? "bg-slate-100 text-slate-900 shadow-sm shadow-black/5 ring-1 ring-slate-200/50"
                          : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
                        }
                      `}
                    >
                      <div className="flex items-center justify-center min-w-[22px]">
                        <Icon
                          size={20}
                          className={`shrink-0 transition-colors
                            ${isActive
                              ? "text-navy-900"
                              : "text-slate-400 group-hover:text-slate-600"
                            }`}
                        />
                      </div>
                      {isSidebarOpen && (
                        <span
                          className={`text-[13.5px] whitespace-nowrap tracking-tight leading-none
                            ${isActive ? "font-bold" : "font-semibold"}`}
                        >
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ));
          })()}

          {/* Special Logout Item (at the bottom of nav list) */}
          <div className="pt-2">
            <button
              onClick={() => logout()}
              className={`
                w-full flex items-center ${isSidebarOpen ? "space-x-3.5 px-3.5" : "justify-center px-0"} py-2.5 rounded-xl text-left transition-all duration-200 group hover:bg-red-50 hover:text-red-500 text-slate-500
              `}
              title={!isSidebarOpen ? "LOGOUT" : ""}
            >
              <div className="flex items-center justify-center min-w-[22px]">
                <LogOut size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
              </div>
              {isSidebarOpen && (
                <span className="text-[13.5px] font-semibold whitespace-nowrap tracking-tight leading-none">
                  LOGOUT
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* User Info Style (Back to minimal) */}
        <div className="mt-auto border-t border-slate-200/60 p-3 pb-5">
          <div
            onClick={() => {
              setActiveAnchor(avatarBtnRef);
              setProfilePopupOpen(true);
            }}
            className={`flex items-center ${isSidebarOpen ? "justify-start px-2" : "justify-center"} py-1.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <button
                ref={avatarBtnRef}
                className="w-8 h-8 rounded-xl overflow-hidden border-2 border-white shrink-0 bg-slate-100 flex items-center justify-center shadow-sm ring-1 ring-slate-200/60 transition-transform group-hover:scale-105"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-slate-600 font-bold text-[11px]">{initial}</span>
                )}
              </button>
              {isSidebarOpen && (
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">{profileName || username}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate mt-0.5">Security Portal</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        {/* New minimal header */}
        <header className=" sticky top-0 z-40 px-10 py-5 flex items-center justify-end bg-white/40 backdrop-blur-md border-b border-white/20">
          {/* Right group: name+email → avatar → logout */}
          <div className="flex items-center gap-4">
            {/* Name + email — left of avatar */}
            <div className="text-right">
              <p className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight">
                {profileName || username}
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5 lowercase tracking-tight">
                {profileEmail || `${username}@rguktong.ac.in`}
              </p>
            </div>

            {/* Circular profile photo — opens popup */}
            <button
              ref={headerAvatarRef}
              onClick={() => {
                setActiveAnchor(headerAvatarRef);
                setProfilePopupOpen(true);
              }}
              title="Profile"
              className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border-[3px] border-white hover:ring-2 hover:ring-navy-900 transition-all active:scale-95 shrink-0 shadow-md ring-1 ring-slate-200/50"
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-navy-900 text-white font-bold text-sm">
                  {initial}
                </div>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={() => logout()}
              title="Sign out"
              className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 shadow-sm"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Profile popup portal */}
        <ProfilePopup
          username={username}
          anchorRef={activeAnchor}
          open={profilePopupOpen}
          onClose={() => setProfilePopupOpen(false)}
          onProfileUpdate={(p) => {
            setProfilePhoto(p.profile_url ?? null);
            setProfileName(p.name ?? null);
            setProfileEmail(p.email ?? null);
          }}
          onLogout={() => logout()}
          initialPhoto={profilePhoto}
        />

        <div className="w-full px-10">{renderContent()}</div>
      </main>
    </div>
  );
}
