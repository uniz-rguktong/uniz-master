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
import { useNavigate } from "react-router-dom";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { clearSession } from "../../../utils/security";
import StudentDetails from "../Webmaster/StudentDetails";
import SubjectManagement from "../Webmaster/SubjectManagement";
import UploadSection from "../Webmaster/UploadSection";
import GradesSection from "../Webmaster/GradesSection";
import StudentBulkSection from "../Webmaster/StudentBulkSection";
import SystemLogsSection from "../Webmaster/SystemLogsSection";

export default function DeanDashboard() {
  useIsAuth();
  const navigate = useNavigate();
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

  const handleLogout = () => {
    clearSession();
    navigate("/");
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
          <div className="p-8 space-y-10 animate-in fade-in duration-700">
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-[32px] p-12 text-white shadow-2xl shadow-blue-200/50 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col gap-2">
                <span className="text-blue-100 font-semibold uppercase tracking-[0.25em] text-[10px] opacity-80">
                  RGUKT Ongole • Academic Portal
                </span>
                <h1 className="text-5xl font-semibold tracking-[-0.03em] mb-1 leading-tight">
                  Welcome back, <br />
                  <span className="text-white/100">{username}</span>
                </h1>
                <p className="text-blue-100/80 font-medium text-lg max-w-md mt-4 leading-relaxed">
                  Monitor institutional performance and manage academic operations from your central command.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none"></div>
              <div className="absolute right-[-50px] bottom-[-50px] opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                <LayoutDashboard size={400} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {navItems.slice(1).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:translate-y-[-4px] hover:border-blue-100 transition-all group text-left relative overflow-hidden"
                >
                  <div className="p-4 rounded-[20px] bg-slate-50 text-slate-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 inline-block shadow-inner group-hover:shadow-lg group-hover:shadow-blue-200">
                    <item.icon size={26} />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-1.5 tracking-tight group-hover:text-blue-700 transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-semibold leading-none">
                    Access Module
                  </p>
                  <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <ChevronRight size={20} />
                    </div>
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
