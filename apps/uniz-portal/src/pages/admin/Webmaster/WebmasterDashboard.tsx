/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import {
  Users,
  CalendarCheck,
  GraduationCap,
  LogOut,
  LayoutDashboard,
  Layout,
  Bell,
  Activity,
  Smartphone,
  ScanLine,
  Lock,
} from "lucide-react";
import ProfilePopup from "./ProfilePopup";
import SecuritySection from "./SecuritySection";
import WebmasterOverview from "./WebmasterOverview";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import StudentDetails from "./StudentDetails";
import UnifiedAcademicManager from "./UnifiedAcademicManager";
import FacultyManagement from "./FacultyManagement";
import UploadSection from "./UploadSection";

import BannersSection from "./BannersSection";
import UpdatesSection from "./UpdatesSection";
// import TendersSection from "./TendersSection";
import PushNotificationSection from "./PushNotificationSection";
import GradesSection from "./GradesSection";
import StudentBulkSection from "./StudentBulkSection";
import SystemLogsSection from "./SystemLogsSection";
import SeatingUploadSection from "./SeatingUploadSection";

export default function WebmasterDashboard() {
  useIsAuth();
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "student"
    | "student_bulk"
    | "academic_mgmt"
    | "attendance"
    | "grades"
    | "banners"
    | "updates"
    // | "tenders"
    | "push_alerts"
    | "grades_mgmt"
    | "faculty_mgmt"
    | "system_logs"
    | "exam_seating"
    | "security"
    | "exam_seating"
  >("dashboard");
  const isSidebarOpen = true;
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);

  const username = localStorage.getItem("username") || "Webmaster";

  const initials = username[0]?.toUpperCase() ?? "W";

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "student", label: "Student Details", icon: Users },
    { id: "student_bulk", label: "Student Bulk Ops", icon: Users },
    { id: "academic_mgmt", label: "Academic Rollout", icon: Layout },
    { id: "attendance", label: "Attendance Upload", icon: CalendarCheck },
    { id: "grades", label: "Grades Upload", icon: GraduationCap },
    { id: "banners", label: "Home Banners", icon: Layout },
    { id: "updates", label: "Campus Updates", icon: Bell },
    { id: "push_alerts", label: "Push Alerts", icon: Smartphone },
    // { id: "tenders", label: "Tenders", icon: Briefcase },
    { id: "grades_mgmt", label: "Grade Management", icon: GraduationCap },
    { id: "exam_seating", label: "Exam Seating", icon: ScanLine },
    { id: "faculty_mgmt", label: "Staff Management", icon: Users },
    { id: "system_logs", label: "System & Logs", icon: Activity },
    { id: "security", label: "Security", icon: Lock },
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
      case "academic_mgmt":
        return <UnifiedAcademicManager />;
      case "attendance":
        return <UploadSection type="attendance" />;
      case "grades":
        return <UploadSection type="grades" />;

      case "banners":
        return <BannersSection />;
      case "updates":
        return <UpdatesSection />;
      case "push_alerts":
        return <PushNotificationSection />;
      // case "tenders":
      //   return <TendersSection />;
      case "grades_mgmt":
        return <GradesSection />;
      case "faculty_mgmt":
        return <FacultyManagement />;
      case "system_logs":
        return <SystemLogsSection />;
      case "exam_seating":
        return <SeatingUploadSection />;
      case "security":
        return <SecuritySection username={username} />;
      default:
        return (
          <div className="animate-in fade-in duration-500">
            <WebmasterOverview username={username} />
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-100 transition-all duration-300 z-50 ${isSidebarOpen ? "w-52" : "w-16"} hidden md:flex flex-col h-screen sticky top-0`}
      >
        {/* Header with logo */}
        <div className="flex items-center justify-center w-full p-4 bg-transparent shrink-0">
          <span className="unifrakturcook-bold text-2xl text-slate-800 tracking-tight leading-none">
            uniZ
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative
                  ${isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <div className="flex items-center justify-center min-w-[20px]">
                  <Icon
                    size={18}
                    className={`shrink-0 transition-transform group-hover:scale-110 duration-200
                      ${isActive
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-700"
                      }`}
                  />
                </div>
                {isSidebarOpen && (
                  <span
                    className={`text-[12px] whitespace-nowrap tracking-tight transition-all
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
        <div className="mt-auto px-2 py-3 space-y-0.5 border-t border-slate-50 shrink-0">
          {/* Profile Display */}
          <div className="flex items-center px-3 py-2 group rounded-xl transition-colors">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-blue-200 shrink-0 bg-blue-50 flex items-center justify-center shadow-none">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <span className="text-blue-700 font-semibold text-[10px]">
                  {initials}
                </span>
              )}
            </div>
            {isSidebarOpen && (
              <div className="ml-2.5 flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-900 truncate tracking-tight">
                  {username}
                </p>
              </div>
            )}
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-left transition-all duration-200 group text-red-500 hover:bg-red-50"
          >
            <div className="flex items-center justify-center min-w-[20px]">
              <LogOut
                size={17}
                className="shrink-0 transition-transform group-hover:rotate-12"
              />
            </div>
            {isSidebarOpen && (
              <span className="text-[12px] font-semibold">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        {/* New minimal header */}
        <header className=" sticky top-0 z-40 px-8 py-4 flex items-center justify-end">
          {/* Right group: name+email → avatar → logout */}
          <div className="flex items-center gap-3">
            {/* Name + email — left of avatar */}
            <div className="text-right">
              <p className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight">
                {profileName || username}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 lowercase">
                {profileEmail || `${username}@rguktong.ac.in`}
              </p>
            </div>

            {/* Circular profile photo — opens popup */}
            <button
              ref={avatarBtnRef}
              onClick={() => setProfilePopupOpen((o) => !o)}
              title="Profile"
              className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 border-2 border-white hover:ring-2 hover:ring-blue-400 transition-all active:scale-95 shrink-0 shadow-none"
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-sm">
                  {initials}
                </div>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 shadow-none"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Profile popup portal */}
        <ProfilePopup
          username={username}
          anchorRef={avatarBtnRef as React.RefObject<HTMLElement>}
          open={profilePopupOpen}
          onClose={() => setProfilePopupOpen(false)}
          onProfileUpdate={(p) => {
            setProfilePhoto(p.profile_url ?? null);
            setProfileName(p.name ?? null);
            setProfileEmail(p.email ?? null);
          }}
          onLogout={handleLogout}
          initialPhoto={profilePhoto}
        />

        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
}
