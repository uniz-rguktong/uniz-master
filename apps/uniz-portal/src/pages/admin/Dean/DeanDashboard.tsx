/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Users,
  LayoutDashboard,
  Lock,
  Bell,
  Smartphone,
  Layout,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import StudentDetails from "../Webmaster/StudentDetails";
import SubjectManagement from "../Webmaster/SubjectManagement";
import UploadSection from "../Webmaster/UploadSection";
import StudentBulkSection from "../Webmaster/StudentBulkSection";
import SystemLogsSection from "../Webmaster/SystemLogsSection";
import FacultyManagement from "../Webmaster/FacultyManagement";
import DeanOverview from "./DeanOverview";
import BannersSection from "../Webmaster/BannersSection";
import UpdatesSection from "../Webmaster/UpdatesSection";
import PushNotificationSection from "../Webmaster/PushNotificationSection";
import SecuritySection from "../Webmaster/SecuritySection";

export default function DeanDashboard() {
  useIsAuth();
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "student"
    | "student_bulk"
    | "subjects"
    | "attendance"
    | "grades"
    | "semester_review"
    | "faculty"
    | "system_logs"
    | "banners"
    | "updates"
    | "push_alerts"
    | "security"
  >("dashboard");

  const username = (localStorage.getItem("username") || "Dean").replace(
    /"/g,
    "",
  );
  const role = (localStorage.getItem("admin_role") || "admin").replace(
    /"/g,
    "",
  );

  const roleLabel =
    role === "hod"
      ? "HOD Portal"
      : role === "swo" || role === "dsw"
        ? "SWO Portal"
        : "Dean Portal";

  const navGroups = [
    {
      group: null,
      items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
    },
    {
      group: "Students",
      items: [{ id: "student", label: "Student Details", icon: Users }],
    },
    {
      group: "Academic",
      items: [],
    },
    {
      group: "Campus",
      items: [
        { id: "banners", label: "Home Banners", icon: Layout },
        { id: "updates", label: "Campus Updates", icon: Bell },
        { id: "push_alerts", label: "Push Alerts", icon: Smartphone },
      ],
    },
    {
      group: "Management",
      items: [{ id: "security", label: "Security", icon: Lock }],
    },
  ];

  const { logout } = useLogout();

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
      case "faculty":
        return (
          <FacultyManagement
            deptRestrict={
              role === "hod"
                ? localStorage.getItem("department") || "CSE"
                : undefined
            }
          />
        );
      case "system_logs":
        return <SystemLogsSection />;
      case "banners":
        return <BannersSection />;
      case "updates":
        return <UpdatesSection />;
      case "push_alerts":
        return <PushNotificationSection />;
      case "security":
        return <SecuritySection username={username} />;
      default:
        return (
          <div className="animate-in fade-in duration-500">
            <DeanOverview username={username} />
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
      roleLabel={roleLabel}
      showSidebarProfile
      enableNavSearch
      collapseBranding="abbreviate"
      navSpacing="compact"
    >
      {renderContent()}
    </AdminShell>
  );
}
