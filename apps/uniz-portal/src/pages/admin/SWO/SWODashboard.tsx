/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Clock,
  CalendarDays,
  LogOut,
  Menu,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import RequestManagement from "./RequestManagement";

export default function SWODashboard() {
  useIsAuth();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "outing" | "outpass"
  >("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const username = localStorage.getItem("username")?.replace(/"/g, "") || "SWO";

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "outing", label: "Outing Requests", icon: Clock },
    { id: "outpass", label: "Outpass Requests", icon: CalendarDays },
  ];

  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "outing":
        return <RequestManagement type="outing" />;
      case "outpass":
        return <RequestManagement type="outpass" />;
      default:
        return (
          <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <div className="bg-gradient-to-br from-slate-900 to-[#1e293b] rounded-[28px] py-6 px-10 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
              <div className="relative z-10 space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                    System Secure
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.03em] mb-1.5 leading-none">
                    Welcome, {username}
                  </h1>
                  <p className="text-slate-400 font-medium text-[15px] opacity-90 max-w-lg leading-relaxed">
                    Student Welfare Oversight Engine. Review and manage student
                    movement permissions with precision.
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#6366f1]/80 font-semibold mt-1.5 px-0.5">
                SWO PORTAL
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
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <div className="flex items-center justify-center min-w-[24px]">
                  <Icon
                    size={21}
                    className={`shrink-0 transition-transform group-hover:scale-110 duration-200
                      ${
                        isActive
                          ? "text-blue-600"
                          : "text-slate-400 group-hover:text-slate-700"
                      }`}
                  />
                </div>
                {isSidebarOpen && (
                  <span
                    className={`text-[13px] whitespace-nowrap tracking-tight transition-all
                      ${isActive ? "font-bold" : "font-semibold text-slate-500 group-hover:text-blue-600"}`}
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
          {/* Profile Display */}
          <div className="flex items-center px-4 py-3 group rounded-full transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center border border-blue-200 shadow-sm overflow-hidden shrink-0">
              <span className="text-blue-700 font-semibold text-[11px]">
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

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-full text-left transition-all duration-200 group text-red-500 hover:bg-red-50"
          >
            <div className="flex items-center justify-center min-w-[24px]">
              <LogOut
                size={20}
                className="shrink-0 transition-transform group-hover:rotate-12"
              />
            </div>
            {isSidebarOpen && (
              <span className="text-[15px] font-semibold">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        <header className="bg-white/95 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100/80 p-5 px-8 flex justify-between items-center shadow-sm shadow-slate-50/50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full hover:bg-white hover:shadow-lg transition-all md:flex hidden text-slate-400 hover:text-blue-600 active:scale-95"
          >
            {isSidebarOpen ? <Menu size={18} /> : <ChevronRight size={18} />}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {username}
              </p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                Student Welfare Officer
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-semibold text-blue-600">
              {username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}
