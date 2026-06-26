/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import {
  Users,
  LayoutDashboard,
  Layout,
  Bell,
  Smartphone,
  Lock,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import SecuritySection from "../Webmaster/SecuritySection";
import WebmasterOverview from "../Webmaster/WebmasterOverview";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import { useAdminSectionRoute } from "../../../hooks/useAdminSectionRoute";
import StudentDetails from "../Webmaster/StudentDetails";
import FacultyManagement from "../Webmaster/FacultyManagement";
import UploadSection from "../Webmaster/UploadSection";
import BannersSection from "../Webmaster/BannersSection";
import UpdatesSection from "../Webmaster/UpdatesSection";
import PushNotificationSection from "../Webmaster/PushNotificationSection";
import StudentBulkSection from "../Webmaster/StudentBulkSection";
import SystemLogsSection from "../Webmaster/SystemLogsSection";
import SeatingUploadSection from "../Webmaster/SeatingUploadSection";
import SubjectManagement from "../Webmaster/SubjectManagement";
import UpdateStudentStatus from "../../../components/UpdateStudentStatus";
import RoleManagement from "../RoleManagement";

export default function DirectorDashboard() {
  useIsAuth();

  const username = (localStorage.getItem("username") || "Director").replace(
    /"/g,
    "",
  );

  const allowedTabs = useMemo(
    () =>
      [
        "dashboard",
        "student",
        "student_bulk",
        "academic_mgmt",
        "attendance",
        "grades",
        "banners",
        "updates",
        "push_alerts",
        "faculty_mgmt",
        "system_logs",
        "exam_seating",
        "security",
        "roles",
        "subjects",
        "status_update",
      ] as const,
    [],
  );

  const { activeTab, setActiveTab } = useAdminSectionRoute(allowedTabs);

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
      case "status_update":
        return <UpdateStudentStatus />;
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
      case "roles":
        return <RoleManagement />;
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
      onTabChange={(id) => setActiveTab(id)}
      onLogout={logout}
      username={username}
      enableNavSearch
      collapseBranding="hide"
      navSpacing="compact"
    >
      {renderContent()}
    </AdminShell>
  );
}
