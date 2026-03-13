/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
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
  Search,
  Brain,
  ChevronRight,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import ProfilePopup from "../ProfilePopup";
import SecuritySection from "./SecuritySection";
import WebmasterOverview from "./WebmasterOverview";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import StudentDetails from "./StudentDetails";
import UnifiedAcademicManager from "./UnifiedAcademicManager";
import FacultyManagement from "./FacultyManagement";
import UploadSection from "./UploadSection";
import SystemUserAnalytics from "./SystemUserAnalytics";

import BannersSection from "./BannersSection";
import UpdatesSection from "./UpdatesSection";
// import TendersSection from "./TendersSection";
import PushNotificationSection from "./PushNotificationSection";
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
    | "faculty_mgmt"
    | "system_logs"
    | "exam_seating"
    | "security"
    | "intelligence"
  >("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const avatarBtnRef = useRef<any>(null);
  const headerAvatarRef = useRef<HTMLButtonElement>(null);
  const [activeAnchor, setActiveAnchor] = useState<React.RefObject<HTMLElement>>(headerAvatarRef);
  const [searchQuery, setSearchQuery] = useState("");

  const username = (localStorage.getItem("username") || "Webmaster").replace(/"/g, "");
  const initial = (profileName || username)[0]?.toUpperCase() ?? "W";

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
        { id: "intelligence", label: "Intelligence", icon: Brain },
      ]
    },
    {
      group: "Students",
      items: [
        { id: "student", label: "Student Details", icon: Users },
        { id: "student_bulk", label: "Student Bulk Ops", icon: Users },
      ]
    },
    {
      group: "Academic",
      items: [
        { id: "academic_mgmt", label: "Sem Registration", icon: Layout },
        { id: "attendance", label: "Attendance Upload", icon: CalendarCheck },
        { id: "grades", label: "Grades Upload", icon: GraduationCap },
      ]
    },
    {
      group: "Campus",
      items: [
        { id: "banners", label: "Home Banners", icon: Layout },
        { id: "updates", label: "Campus Updates", icon: Bell },
        { id: "push_alerts", label: "Push Alerts", icon: Smartphone },
      ]
    },
    {
      group: "Management",
      items: [
        { id: "faculty_mgmt", label: "Staff Management", icon: Users },
        { id: "exam_seating", label: "Exam Seating", icon: ScanLine },
        { id: "system_logs", label: "System & Logs", icon: Activity },
        { id: "security", label: "Security", icon: Lock },
      ]
    }
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
      case "faculty_mgmt":
        return <FacultyManagement />;
      case "system_logs":
        return <SystemLogsSection />;
      case "exam_seating":
        return <SeatingUploadSection />;
      case "security":
        return <SecuritySection username={username} />;
      case "intelligence":
        return (
          <div className="animate-in fade-in duration-700">
            <SystemUserAnalytics />
          </div>
        );
      default:
        return (
          <div className="animate-in fade-in duration-500">
            <WebmasterOverview username={username} />
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-white relative overflow-hidden text-slate-900 selection:bg-blue-50 selection:text-blue-900">
      {/* Sidebar */}
      <aside
        className={`bg-[#fafafa] transition-all duration-300 z-50 ${isSidebarOpen ? "w-[256px]" : "w-16"} hidden md:flex flex-col h-screen sticky top-0 border-r border-slate-200/60 relative group/sidebar`}
      >
        {/* Subtle Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-12 bg-white border border-slate-200 rounded-full p-1 shadow-sm text-slate-400 hover:text-slate-600 opacity-0 group-hover/sidebar:opacity-100 transition-all z-50 hidden md:flex items-center justify-center hover:scale-110 active:scale-95"
        >
          {isSidebarOpen ? (
            <ChevronRight size={12} className="rotate-180" />
          ) : (
            <ChevronRight size={12} />
          )}
        </button>

        {/* Workspace Switcher Header */}
        <div className="p-3">
          <button className={`w-full flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"} p-1.5 hover:bg-slate-200/50 rounded-lg transition-colors group`}>
            <div className="flex items-center gap-2.5 min-w-0">
               <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                  {initial}
               </div>
               {isSidebarOpen && (
                 <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-semibold text-slate-900 truncate tracking-tight">
                      uniZ Portal
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-[9px] font-bold text-slate-600 uppercase tracking-tight">
                       Hobby
                    </span>
                 </div>
               )}
            </div>
            {isSidebarOpen && <ChevronsUpDown size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0" />}
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2">
           <div className="relative group">
              <Search size={14} className={`absolute ${isSidebarOpen ? "left-3" : "left-1/2 -translate-x-1/2"} top-1/2 -translate-y-1/2 text-slate-400`} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSidebarOpen ? "Find..." : ""}
                className={`w-full bg-white border border-slate-200 rounded-md ${isSidebarOpen ? "pl-9 pr-8" : "px-0"} py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-medium placeholder-slate-400`}
              />
              {isSidebarOpen && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 border border-slate-100 px-1 rounded bg-slate-50/50">F</span>
              )}
           </div>
        </div>

        {/* Navigation Section */}
        <nav className={`flex-1 ${isSidebarOpen ? "px-2" : "px-2"} py-2 overflow-y-auto space-y-0.5 custom-sidebar-scroll`}>
          {(() => {
            const filteredGroups = navGroups.map(group => ({
              ...group,
              items: group.items.filter(item =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
            })).filter(group => group.items.length > 0);

            return filteredGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-0.5">
                {group.group && isSidebarOpen && gIdx > 0 && <hr className="my-3 border-transparent" />}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`
                        w-full flex items-center ${isSidebarOpen ? "px-3" : "justify-center px-0"} py-1.5 rounded-md text-left transition-all duration-150 group relative
                        ${isActive
                          ? "bg-slate-200/80 text-slate-900"
                          : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                        }
                      `}
                    >
                      <div className="flex items-center justify-center min-w-[20px]">
                        <Icon size={16} className={`${isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900"} transition-colors`} />
                      </div>
                      {isSidebarOpen && (
                        <span className={`ml-3 text-[13px] tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>
                          {item.label}
                        </span>
                      )}
                      {isSidebarOpen && ["security", "Exam Seating", "Academic"].some(k => item.label.includes(k) || group.group?.includes(k)) && (
                         <ChevronRight size={12} className="ml-auto text-slate-300 group-hover:text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            ));
          })()}
        </nav>

        {/* Bottom User Info Footer */}
        <div className="mt-auto border-t border-slate-200 p-3">
          <div className={`flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"} gap-2`}>
             <button 
               onClick={() => {
                 setActiveAnchor(avatarBtnRef);
                 setProfilePopupOpen(true);
               }}
               className="flex-1 flex items-center gap-2.5 p-1 hover:bg-slate-200/50 rounded-lg transition-all group min-w-0"
             >
                <div ref={avatarBtnRef} className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                  {profilePhoto ? (
                    <img src={profilePhoto} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white text-[10px] font-black uppercase">
                      {initial}
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <span className="text-[13px] font-semibold text-slate-900 truncate tracking-tight">
                    {profileName || username}
                  </span>
                )}
                {isSidebarOpen && <MoreHorizontal size={14} className="ml-auto text-slate-400 group-hover:text-slate-600 shrink-0" />}
             </button>
             {isSidebarOpen && (
               <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-all shrink-0">
                  <Bell size={16} />
               </button>
             )}
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
              onClick={handleLogout}
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
          onLogout={handleLogout}
          initialPhoto={profilePhoto}
        />

        <div className="w-full px-10">{renderContent()}</div>
      </main>
    </div>
  );
}
