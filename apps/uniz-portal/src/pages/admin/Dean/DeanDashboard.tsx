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
  ShieldCheck,
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
import DeanReview from "./DeanReview";

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
    | "dean_review"
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
    { id: "dean_review", label: "Course Review", icon: ShieldCheck },
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
      case "dean_review":
        return <DeanReview />;
      case "system_logs":
        return <SystemLogsSection />;
      default:
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[28px] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-4xl font-semibold tracking-[-0.02em] mb-2">
                  Welcome, {username}
                </h1>
                <p className="text-slate-400 font-medium opacity-80">
                  Dean Control Center
                </p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4">
                <LayoutDashboard size={300} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {navItems.slice(1).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all group text-left"
                >
                  <div className="p-3 rounded-2xl bg-slate-50 text-slate-900 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors inline-block">
                    <item.icon size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">
                    {item.label}
                  </h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                    Access Module
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-200 transition-all duration-300 z-50 ${
          isSidebarOpen ? "w-72" : "w-20"
        } hidden md:flex flex-col shadow-xl`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-50">
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-white font-semibold">D</span>
          </div>
          {isSidebarOpen && (
            <span className="font-semibold text-xl tracking-tight text-slate-900 animate-in fade-in duration-300">
              Dean Portal
            </span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              {isSidebarOpen && (
                <span
                  className={`text-sm tracking-normal transition-all ${activeTab === item.id ? "font-semibold" : "font-medium"}`}
                >
                  {item.label}
                </span>
              )}
              {isSidebarOpen && activeTab === item.id && (
                <ChevronRight size={14} className="ml-auto opacity-50" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-red-500 hover:bg-red-50 transition-all font-semibold text-sm"
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 p-4 px-8 flex justify-between items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors md:block hidden"
          >
            {isSidebarOpen ? <Menu size={20} /> : <ChevronRight size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {username}
              </p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                Dean Academics
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-900">
              {username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}
