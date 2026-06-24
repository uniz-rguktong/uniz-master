/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Users,
  GraduationCap,
  LayoutDashboard,
  Layout,
  Bell,
  Activity,
  Smartphone,
  Lock,
  BookOpen,
  Globe,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { adminCardClass } from "@/components/admin/admin-ui";
import CurriculumManager from "../Curriculum";
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
import PushNotificationSection from "./PushNotificationSection";
import StudentBulkSection from "./StudentBulkSection";
import SystemLogsSection from "./SystemLogsSection";

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

  const username = (localStorage.getItem("username") || "Webmaster").replace(
    /"/g,
    "",
  );

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

  const renderComingSoon = (title: string) => (
    <div
      className={`flex flex-col items-center justify-center py-24 text-center ${adminCardClass} animate-in fade-in zoom-in duration-500`}
    >
      <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6 border border-zinc-100 shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-zinc-950/5 group-hover:scale-110 transition-transform duration-500" />
        <Activity className="w-8 h-8 text-zinc-200 group-hover:text-zinc-950 transition-colors" />
      </div>
      <h3 className="text-2xl font-black text-zinc-900 tracking-tight leading-none mb-4 italic uppercase">
        {title} System Initialization
      </h3>
      <p className="text-zinc-400 font-bold max-w-sm mx-auto leading-relaxed text-sm uppercase tracking-widest opacity-60">
        Automated {title.toLowerCase()} workflows are currently in deployment.
        <br />
        Please coordinate via manual channels for urgent actions.
      </p>
      <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-full border border-zinc-100">
        <span className="w-2 h-2 rounded-full bg-zinc-950 animate-pulse" />
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
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
    <AdminShell
      navGroups={navGroups}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as any)}
      onLogout={logout}
      username={username}
      collapseBranding="hide"
    >
      {renderContent()}
    </AdminShell>
  );
}
