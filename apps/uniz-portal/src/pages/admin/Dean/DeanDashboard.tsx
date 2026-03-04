/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Users,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  LogOut,
  Menu,
  ChevronRight,
  LayoutDashboard,
  Activity,
} from "lucide-react";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import StudentDetails from "../Webmaster/StudentDetails";
import SubjectManagement from "../Webmaster/SubjectManagement";
import UploadSection from "../Webmaster/UploadSection";
import GradesSection from "../Webmaster/GradesSection";
import StudentBulkSection from "../Webmaster/StudentBulkSection";
import SystemLogsSection from "../Webmaster/SystemLogsSection";

export default function DeanDashboard() {
  useIsAuth();
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "student"
    | "student_bulk"
    | "subjects"
    | "attendance"
    | "grades"
    | "grades_mgmt"
    | "system_logs"
  >("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const username = JSON.parse(localStorage.getItem("username") || '"Dean"');

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "student", label: "Student Details", icon: Users },
    { id: "student_bulk", label: "Student Bulk Ops", icon: Users },
    { id: "subjects", label: "Manage Subjects", icon: BookOpen },
    { id: "attendance", label: "Attendance Upload", icon: CalendarCheck },
    { id: "grades", label: "Grades Upload", icon: GraduationCap },
    { id: "grades_mgmt", label: "Grade Management", icon: GraduationCap },
    { id: "system_logs", label: "System & Logs", icon: Activity },
  ];

  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "student":
        return <StudentDetails />;
      case "student_bulk":
        return <StudentBulkSection />;
      case "subjects":
        return <SubjectManagement />;
      case "attendance":
        return <UploadSection type="attendance" />;
      case "grades":
        return <UploadSection type="grades" />;
      case "grades_mgmt":
        return <GradesSection />;
      case "system_logs":
        return <SystemLogsSection />;
      default:
        return (
          <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-[28px] py-6 px-10 text-white shadow-2xl shadow-blue-200/50 relative overflow-hidden group">
              <div className="relative z-10 space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-pulse"></span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-blue-100">
                    RGUKT Ongole • Academic Portal
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.03em] mb-1.5 leading-none">
                    Welcome back, {username}
                  </h1>
                  <p className="text-blue-100/80 font-medium text-[15px] max-w-lg mt-4 leading-relaxed">
                    Monitor institutional performance and manage academic operations from your central command.
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
                      Initialize Module
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
    <div className="flex min-h-screen bg-[#F8FAFC] relative overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-100 transition-all duration-300 z-50 ${isSidebarOpen ? "w-72" : "w-20"
          } hidden md:flex flex-col premium-shadow h-screen sticky top-0`}
      >
        <div className="p-6 flex items-center gap-4 border-b border-slate-50 shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[14px] flex items-center justify-center shrink-0 shadow-lg shadow-blue-100 border-2 border-white rotate-[-3deg]">
            <span className="text-white font-semibold text-xl rotate-[3deg]">D</span>
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="font-semibold text-slate-900 text-lg tracking-tight leading-none">
                Dean Portal
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-blue-600/70 font-bold mt-1.5 px-0.5 leading-none">
                Academic Management
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 mt-4 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[20px] transition-all duration-300 group ${activeTab === item.id
                ? "bg-blue-600 text-white shadow-xl shadow-blue-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <item.icon
                size={20}
                className={`shrink-0 transition-transform group-hover:scale-110 ${activeTab === item.id ? "text-white" : "text-slate-400"}`}
              />
              {isSidebarOpen && (
                <span className={`text-[14px] tracking-tight transition-all ${activeTab === item.id ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              )}
              {isSidebarOpen && activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-100 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-full text-red-500 hover:bg-red-50 transition-all group"
          >
            <div className="min-w-[20px] flex justify-center">
              <LogOut size={20} className="shrink-0 transition-transform group-hover:rotate-12" />
            </div>
            {isSidebarOpen && <span className="text-[14px] font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        <header className="bg-white/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 h-[72px] px-8 flex justify-between items-center glass-panel">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 hover:bg-blue-50 rounded-xl transition-all md:block hidden text-slate-400 hover:text-blue-600 border border-transparent hover:border-blue-100"
          >
            {isSidebarOpen ? <Menu size={20} /> : <ChevronRight size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none tracking-tight">
                {username}
              </p>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest mt-1.5 opacity-70">
                Dean of Academics
              </p>
            </div>
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center font-semibold text-blue-700 shadow-inner group transition-all hover:scale-105 cursor-pointer">
              {username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-0">{renderContent()}</div>
      </main>
    </div>
  );
}
