/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import {
  Users,
  GraduationCap,
  LogOut,
  LayoutDashboard,
  Layout,
  Bell,
  Activity,
  Smartphone,
  Lock,
  BookOpen,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import CurriculumManager from "../Curriculum";
import ProfilePopup from "../ProfilePopup";
import SecuritySection from "./SecuritySection";
import WebmasterOverview from "./WebmasterOverview";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import StudentDetails from "./StudentDetails";
import FacultyManagement from "./FacultyManagement";
import UploadSection from "./UploadSection";
import BannersSection from "./BannersSection";
import UpdatesSection from "./UpdatesSection";
import WebsiteUpdatesSection from "./WebsiteUpdatesSection";
// import TendersSection from "./TendersSection";
import PushNotificationSection from "./PushNotificationSection";
import StudentBulkSection from "./StudentBulkSection";
import SystemLogsSection from "./SystemLogsSection";
// import SeatingUploadSection from "./SeatingUploadSection";

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
    | "subjects"
    | "security"
    | "grievances"
    | "outpass"
    | "outings"
    | "website_updates"
  >("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const headerAvatarRef = useRef<HTMLButtonElement>(null);
  const [activeAnchor, setActiveAnchor] =
    useState<React.RefObject<HTMLElement>>(headerAvatarRef);

  const username = (localStorage.getItem("username") || "Webmaster").replace(
    /"/g,
    "",
  );
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
          .catch(() => {});
      });
    }
  }, []);

  const role = (localStorage.getItem("role") || "webmaster")
    .toLowerCase()
    .replace(/"/g, "");

  const navGroups = [
    {
      group: null,
      items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
    },
    {
      group: "Students",
      items: [
        { id: "student", label: "Student Details", icon: Users },
        // Restricted to Webmaster and COE
        ...(role === "webmaster" || role === "coe"
          ? [{ id: "student_bulk", label: "Student Bulk Ops", icon: Users }]
          : []),
      ],
    },
    ...(role === "swo"
      ? [
          {
            group: "Welfare",
            items: [
              { id: "grievances", label: "Grievances", icon: BookOpen },
              { id: "outpass", label: "Outpass Logs", icon: GraduationCap },
              { id: "outings", label: "Outing Protocol", icon: Activity },
            ],
          },
        ]
      : []),
    {
      group: "Academic",
      items: [
        ...(role === "webmaster" || role === "coe"
          ? [{ id: "attendance", label: "Attendance Upload", icon: Layout }]
          : []),
        ...(role === "webmaster" || role === "coe"
          ? [{ id: "grades", label: "Grades Upload", icon: GraduationCap }]
          : []),
        // Restricted: Director/Dean/SWO don't manage subjects
        ...(role === "webmaster" || role === "coe"
          ? [{ id: "subjects", label: "Manage Subjects", icon: BookOpen }]
          : []),
      ],
    },
    {
      group: "Campus",
      items: [
        { id: "banners", label: "Home Banners", icon: Layout },
        { id: "updates", label: "Campus Updates", icon: Bell },
        { id: "website_updates", label: "Website Updates", icon: Globe },
        { id: "push_alerts", label: "Push Alerts", icon: Smartphone },
      ],
    },
    {
      group: "Management",
      items: [
        ...(role === "webmaster" || role === "coe"
          ? [{ id: "faculty_mgmt", label: "Faculty Management", icon: Users }]
          : []),
        ...(role === "webmaster" || role === "coe"
          ? [{ id: "system_logs", label: "System & Logs", icon: Activity }]
          : []),
        { id: "security", label: "Security", icon: Lock },
      ],
    },
  ];

  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
  };

  const renderComingSoon = (title: string) => (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-50 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-navy-900/5 group-hover:scale-110 transition-transform duration-500" />
        <Activity className="w-8 h-8 text-slate-200 group-hover:text-navy-900 transition-colors" />
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-4 italic uppercase">
        {title} System Initialization
      </h3>
      <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed text-sm uppercase tracking-widest opacity-60">
        Automated {title.toLowerCase()} workflows are currently in deployment.
        <br />
        Please coordinate via manual channels for urgent actions.
      </p>
      <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
        <span className="w-2 h-2 rounded-full bg-navy-900 animate-pulse" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Mirroring Student Experience Platform
        </span>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "student":
        return <StudentDetails />;
      case "student_bulk":
        return <StudentBulkSection />;
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
      case "subjects":
        return <CurriculumManager />;
      case "security":
        return <SecuritySection username={username} />;
      case "website_updates":
        return <WebsiteUpdatesSection />;
      case "grievances":
        return renderComingSoon("Grievance Redressal");
      case "outpass":
        return renderComingSoon("Outpass Records");
      case "outings":
        return renderComingSoon("Outing Logs");

      default:
        return (
          <div className="animate-in fade-in duration-500">
            <WebmasterOverview username={username} />
          </div>
        );
    }
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          )}
        </button>
        {/* Sidebar Branding - Hides when collapsed for sleek look */}
        <div
          className={`px-4 pt-8 pb-4 transition-all duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}
        >
          <div className="flex items-center justify-center">
            <h1 className="unifrakturcook-bold text-4xl text-slate-900 tracking-tight">
              uniZ
            </h1>
          </div>
        </div>{" "}
        {/* Navigation Section - Sleek and Direct */}
        <nav
          className={`flex-1 ${isSidebarOpen ? "px-4" : "px-3"} py-4 overflow-y-auto space-y-7 custom-sidebar-scroll`}
        >
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              {group.group && isSidebarOpen && (
                <h4 className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5 opacity-80">
                  {group.group}
                </h4>
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
                      w-full flex items-center ${isSidebarOpen ? "space-x-3.5 px-4" : "justify-center px-0"} py-3 rounded-xl text-left transition-all duration-200 group relative
                        ${
                          isActive
                            ? "bg-white text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50"
                            : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
                        }
                      `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabGlow"
                        className="absolute inset-0 bg-navy-900/5 rounded-xl blur-[2px]"
                        initial={false}
                      />
                    )}
                    <div className="flex items-center justify-center min-w-[22px] relative z-10">
                      <Icon
                        size={20}
                        className={`shrink-0 transition-colors
                            ${
                              isActive
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
          ))}

          {/* Special Logout Item */}
          <div className="pt-4 border-t border-slate-100/50">
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center ${isSidebarOpen ? "space-x-3.5 px-4" : "justify-center px-0"} py-3 rounded-xl text-left transition-all duration-200 group hover:bg-red-50 hover:text-red-500 text-slate-500
              `}
              title={!isSidebarOpen ? "LOGOUT" : ""}
            >
              <div className="flex items-center justify-center min-w-[22px]">
                <LogOut
                  size={20}
                  className="text-slate-400 group-hover:text-red-500 transition-colors"
                />
              </div>
              {isSidebarOpen && (
                <span className="text-[13.5px] font-semibold whitespace-nowrap tracking-tight leading-none">
                  LOGOUT
                </span>
              )}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        {/* New minimal header */}
        <header className=" sticky top-0 z-40 px-10 py-5 flex items-center justify-end bg-white/40 backdrop-blur-md border-b border-white/20">
          {/* Right group: name+email → avatar → logout */}
          <div className="flex items-center gap-4">
            {/* Name + email - left of avatar */}
            <div className="text-right">
              <p className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight">
                {profileName || username}
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5 lowercase tracking-tight">
                {profileEmail || `${username}@rguktong.ac.in`}
              </p>
            </div>

            {/* Circular profile photo - opens popup */}
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
