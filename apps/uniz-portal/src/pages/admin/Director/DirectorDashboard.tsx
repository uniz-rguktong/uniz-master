/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import {
  Users,
  LayoutDashboard,
  Layout,
  Bell,
  Smartphone,
  Lock,
  Activity,
  BookOpen,
  GraduationCap,
  Globe,
  CalendarClock,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import WebmasterOverview from "../Webmaster/WebmasterOverview";
import SecuritySection from "../Webmaster/SecuritySection";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import { useAdminSectionRoute } from "../../../hooks/useAdminSectionRoute";
import StudentDetails from "../Webmaster/StudentDetails";
import FacultyManagement from "../Webmaster/FacultyManagement";
import UploadSection from "../Webmaster/UploadSection";
import BannersSection from "../Webmaster/BannersSection";
import UpdatesSection from "../Webmaster/UpdatesSection";
import WebsiteUpdatesSection from "../Webmaster/WebsiteUpdatesSection";
import PushNotificationSection from "../Webmaster/PushNotificationSection";
import StudentBulkSection from "../Webmaster/StudentBulkSection";
import SystemLogsSection from "../Webmaster/SystemLogsSection";
import SubjectManagement from "../Webmaster/SubjectManagement";
import CurriculumManager from "../Curriculum";
import SemesterBuilder from "../Webmaster/SemesterBuilder";

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
        "attendance",
        "grades",
        "subjects",
        "semester_registration",
        "faculty_mgmt",
        "system_logs",
        "banners",
        "updates",
        "website_updates",
        "push_alerts",
        "security",
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
      items: [
        { id: "student", label: "Student Details", icon: Users },
        { id: "student_bulk", label: "Student Bulk Ops", icon: Users },
      ],
    },
    {
      group: "Academic",
      items: [
        { id: "attendance", label: "Attendance Upload", icon: Layout },
        { id: "grades", label: "Grades Upload", icon: GraduationCap },
        { id: "subjects", label: "Manage Subjects", icon: BookOpen },
        { id: "semester_registration", label: "Semester Registration", icon: CalendarClock },
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
        { id: "faculty_mgmt", label: "Faculty Management", icon: Users },
        { id: "system_logs", label: "System & Logs", icon: Activity },
        { id: "security", label: "Security", icon: Lock },
      ],
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
        return <CurriculumManager />;
      case "semester_registration":
        return <SemesterBuilder />;
      case "attendance":
        return <UploadSection type="attendance" />;
      case "grades":
        return <UploadSection type="grades" />;
      case "banners":
        return <BannersSection />;
      case "updates":
        return <UpdatesSection />;
      case "website_updates":
        return <WebsiteUpdatesSection />;
      case "push_alerts":
        return <PushNotificationSection />;
      case "faculty_mgmt":
        return <FacultyManagement />;
      case "system_logs":
        return <SystemLogsSection />;
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
