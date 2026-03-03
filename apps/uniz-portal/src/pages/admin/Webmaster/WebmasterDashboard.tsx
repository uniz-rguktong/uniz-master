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
  Layout,
  Bell,
  Activity,
  // Briefcase,
  Mail,
  Smartphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { clearSession } from "../../../utils/security";
import StudentDetails from "./StudentDetails";
import SubjectManagement from "./SubjectManagement";
import UploadSection from "./UploadSection";
import FacultyManagement from "./FacultyManagement";

import BannersSection from "./BannersSection";
import UpdatesSection from "./UpdatesSection";
// import TendersSection from "./TendersSection";
import EmailNotification from "../EmailNotification";
import PushNotificationSection from "./PushNotificationSection";
import GradesSection from "./GradesSection";
import StudentBulkSection from "./StudentBulkSection";
import SystemLogsSection from "./SystemLogsSection";
import SemesterRegistration from "./SemesterRegistration";

export default function WebmasterDashboard() {
  useIsAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "student"
    | "student_bulk"
    | "subjects"
    | "attendance"
    | "grades"
    | "banners"
    | "updates"
    // | "tenders"
    | "notifications"
    | "push_alerts"
    | "grades_mgmt"
    | "faculty_mgmt"
    | "semester_mgmt"
    | "system_logs"
  >("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const username = JSON.parse(
    localStorage.getItem("username") || '"Webmaster"',
  );

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "student", label: "Student Details", icon: Users },
    { id: "student_bulk", label: "Student Bulk Ops", icon: Users },
    { id: "subjects", label: "Manage Subjects", icon: BookOpen },
    { id: "attendance", label: "Attendance Upload", icon: CalendarCheck },
    { id: "grades", label: "Grades Upload", icon: GraduationCap },
    { id: "banners", label: "Home Banners", icon: Layout },
    { id: "updates", label: "Campus Updates", icon: Bell },
    { id: "notifications", label: "Email Broadcasts", icon: Mail },
    { id: "push_alerts", label: "Push Alerts", icon: Smartphone },
    // { id: "tenders", label: "Tenders", icon: Briefcase },
    { id: "grades_mgmt", label: "Grade Management", icon: GraduationCap },
    { id: "faculty_mgmt", label: "Staff Management", icon: Users },
    { id: "semester_mgmt", label: "Semester Rollout", icon: CalendarCheck },
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

      case "banners":
        return <BannersSection />;
      case "updates":
        return <UpdatesSection />;
      case "notifications":
        return <EmailNotification />;
      case "push_alerts":
        return <PushNotificationSection />;
      // case "tenders":
      //   return <TendersSection />;
      case "grades_mgmt":
        return <GradesSection />;
      case "faculty_mgmt":
        return <FacultyManagement />;
      case "semester_mgmt":
        return <SemesterRegistration />;
      case "system_logs":
        return <SystemLogsSection />;
      default:
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[28px] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-4xl font-semibold tracking-[-0.02em] mb-2">
                  Welcome, {username}
                </h1>
                <p className="text-blue-100 font-medium opacity-80">
                  Webmaster Control Center
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
                  className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm text-left hover:shadow-md transition-shadow"
                >
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 mb-4 inline-block">
                    <item.icon size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">
                    {item.label}
                  </h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
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
                WEBMASTER PORTAL
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
                    className={`text-[14px] whitespace-nowrap tracking-normal transition-all
                      ${isActive ? "font-semibold" : "font-medium"}`}
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
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 p-4 px-8 flex justify-between items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors md:block hidden text-slate-400 hover:text-blue-600"
          >
            {isSidebarOpen ? <Menu size={20} /> : <ChevronRight size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {username}
              </p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
                System Administrator
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
