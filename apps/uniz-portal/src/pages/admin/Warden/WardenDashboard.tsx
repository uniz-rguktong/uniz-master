/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  LogOut,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import ApproveComp from "../approve-comp";
import UpdateStatus from "../../../components/UpdateStudentStatus";

export default function WardenDashboard() {
  useIsAuth();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "approve_outing" | "approve_outpass" | "status_update"
  >("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const headerAvatarRef = useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const rawRole = (localStorage.getItem("admin_role") || "warden").replace(/"/g, "");
  const username = localStorage.getItem("username")?.replace(/"/g, "") || "Warden";
  const firstName = username.split(" ")[0];

  const isMale = rawRole === "warden_male";
  const portalLabel = isMale ? "M-Warden Portal" : "F-Warden Portal";
  const systemLabel = isMale ? "Boys Hostel Secure" : "Girls Hostel Secure";

  // Fetch profile on mount
  useEffect(() => {
    const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
    if (token) {
      import("../../../api/endpoints").then(({ BASE_URL }) => {
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

  const navGroups = [
    {
      group: null,
      items: [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      ]
    },
    {
      group: "Approvals",
      items: [
        { id: "approve_outing", label: "Approve Outings", icon: CheckCircle2 },
        { id: "approve_outpass", label: "Approve Outpasses", icon: CheckCircle2 },
      ]
    }
  ];

  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "approve_outing":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 md:hidden">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4"
              >
                <ChevronLeft size={14} /> Back to Hub
              </button>
            </div>
            <ApproveComp type="outing" />
          </div>
        );
      case "approve_outpass":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 md:hidden">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4"
              >
                <ChevronLeft size={14} /> Back to Hub
              </button>
            </div>
            <ApproveComp type="outpass" />
          </div>
        );
      case "status_update":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 md:hidden">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4"
              >
                <ChevronLeft size={14} /> Back to Hub
              </button>
            </div>
            <UpdateStatus />
          </div>
        );
      default:
        return (
          <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <div className="bg-gradient-to-br from-slate-900 to-[#1e293b] rounded-[28px] py-6 px-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
              <div className="relative z-10 space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isMale ? "bg-blue-400" : "bg-pink-400"} animate-pulse`}
                  ></span>
                  <span
                    className={`text-[8px] font-bold uppercase tracking-widest ${isMale ? "text-blue-400" : "text-pink-400"}`}
                  >
                    {systemLabel}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.03em] mb-1.5 leading-none">
                    Welcome, {username}
                  </h1>
                  <p className="text-slate-400 font-medium text-[15px] opacity-90 max-w-lg leading-relaxed">
                    Residential Governance Terminal. Orchestrate hostel
                    operations and maintain student safety through your
                    administrative console.
                  </p>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-[0.03] translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
                <LayoutDashboard size={280} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {navItems.slice(1).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm text-left transition-all group flex flex-col justify-between min-h-[150px]"
                >
                  <div className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 mb-4 inline-block transition-all duration-300 shadow-inner">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[14px] mb-1 leading-tight transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-[8px] text-slate-400 uppercase tracking-[0.2em] font-black opacity-60 group-hover:text-blue-500 transition-colors">
                      INITIALIZE MODULE
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`flex min-h-screen bg-[#fcfcfd] relative overflow-hidden text-slate-900 ${isMale ? "selection:bg-indigo-100 selection:text-indigo-900" : "selection:bg-fuchsia-100 selection:text-fuchsia-900"}`}>
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-100 transition-all duration-300 z-[70] 
          ${isSidebarOpen ? "w-72 translate-x-0" : "w-20 -translate-x-full md:translate-x-0"} 
          fixed md:sticky top-0 flex flex-col premium-shadow h-screen shadow-2xl md:shadow-none`}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                item.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
            })).filter(group => group.items.length > 0);

            if (filteredGroups.length === 0 && searchQuery) {
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
                              ? isMale ? "text-indigo-600" : "text-fuchsia-600"
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
              onClick={handleLogout}
              className={`
                w-full flex items-center ${isSidebarOpen ? "space-x-3.5 px-3.5" : "justify-center px-0"} py-2.5 rounded-xl text-left transition-all duration-200 group hover:bg-red-50 hover:text-red-500 text-slate-500
              `}
              title={!isSidebarOpen ? "Logout" : ""}
            >
              <div className="flex items-center justify-center min-w-[22px]">
                <LogOut size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
              </div>
            )}
          </div>
        </nav>

        {/* User Info Style (Back to minimal) */}
        <div className="mt-auto border-t border-slate-200/60 p-3 pb-5">
          <div
            onClick={() => {
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
                  <span className="text-slate-600 font-bold text-[10px] leading-tight text-center px-1 truncate">{firstName}</span>
                )}
              </button>
              {isSidebarOpen && (
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">{profileName || username}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate mt-0.5">{portalLabel}</p>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <span className="text-[15px] font-semibold">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-screen flex flex-col">
        <header className="bg-white/95 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100/80 p-4 px-6 md:px-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-lg transition-all text-slate-400 hover:text-blue-600 active:scale-95"
            >
              {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
            {!isSidebarOpen && (
              <h1 className="font-bold text-slate-900 text-[15px] hidden md:block">
                {navItems.find(i => i.id === activeTab)?.label}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {username}
              </p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                Residential Warden
              </p>
            </div>

            {/* Circular profile photo — opens popup */}
            <button
              ref={headerAvatarRef}
              onClick={() => {
                setProfilePopupOpen(true);
              }}
              title="Profile"
              className={`w-12 h-12 rounded-full overflow-hidden bg-slate-200 border-[3px] border-white hover:ring-2 ${isMale ? "hover:ring-indigo-400" : "hover:ring-fuchsia-400"} transition-all active:scale-95 shrink-0 shadow-md ring-1 ring-slate-200/50`}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isMale ? "bg-indigo-600" : "bg-fuchsia-600"} text-white font-bold text-[10px] leading-tight text-center px-1 truncate`}>
                  {firstName}
                </div>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 shadow-sm"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-7xl mx-auto w-full">{renderContent()}</div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 sticky bottom-0 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center justify-center h-full flex-1 gap-1 transition-all ${isActive ? "text-blue-600" : "text-slate-400"}`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-blue-50" : ""}`}>
                  <Icon size={isActive ? 20 : 18} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "opacity-100" : "opacity-60"}`}>
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
