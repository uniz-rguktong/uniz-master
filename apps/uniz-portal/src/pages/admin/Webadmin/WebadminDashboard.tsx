/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
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
  CalendarClock,
  Database,
  CircleHelp,
  UserCog,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/ui/empty-state";
import CurriculumManager from "../Curriculum";
import SemesterBuilder from "./SemesterBuilder";
import SecuritySection from "./SecuritySection";
import WebadminOverview from "./WebadminOverview";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import { useAdminSectionRoute } from "../../../hooks/useAdminSectionRoute";
import StudentDetails from "./StudentDetails";
import FacultyManagement from "./FacultyManagement";
import UploadSection from "./UploadSection";
import BannersSection from "./BannersSection";
import UpdatesSection from "./UpdatesSection";
import WebsiteUpdatesSection from "./WebsiteUpdatesSection";
import PushNotificationSection from "./PushNotificationSection";
import StudentBulkSection from "./StudentBulkSection";
import SystemLogsSection from "./SystemLogsSection";
import {
  enableOutingsAndOutpasses,
  filterOutpassOutingTabs,
} from "@/config/featureFlags";
import { parseJwt } from "@/utils/security";
import { resolveAdminPortalRole } from "@/utils/adminRole";
import DatabaseSection from "./database/DatabaseSection";
import HelpSection from "./HelpSection";
import RoleManagement from "../RoleManagement";
import { HowToButton } from "@/components/help/HowToButton";

export default function WebadminDashboard() {
  useIsAuth();

  const username = (localStorage.getItem("username") || "Webadmin").replace(
    /"/g,
    "",
  );

  const role = (localStorage.getItem("role") || "webadmin")
    .toLowerCase()
    .replace(/"/g, "");

  const adminToken = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
  const portalRole = resolveAdminPortalRole(
    adminToken ? parseJwt(adminToken) : null,
    username,
  );
  const canUseDatabase = portalRole === "webadmin";
  const canManageRoles = portalRole === "webadmin";
  const showHelp = role === "webadmin" || portalRole === "webadmin";

  const allowedTabs = useMemo(
    () =>
      filterOutpassOutingTabs([
        "dashboard",
        "student",
        ...(role === "webadmin" || role === "coe" ? ["student_bulk"] : []),
        ...(role === "swo" ? ["grievances", "outpass", "outings"] : []),
        ...(role === "webadmin" || role === "coe"
          ? [
              "attendance",
              "grades",
              "subjects",
              "semester_registration",
              "faculty_mgmt",
              "system_logs",
            ]
          : []),
        "banners",
        "updates",
        "website_updates",
        "push_alerts",
        "security",
        ...(canUseDatabase ? ["database"] : []),
        ...(canManageRoles ? ["role_mgmt"] : []),
        ...(showHelp ? ["help"] : []),
      ] as const),
    [role, canUseDatabase, canManageRoles, showHelp],
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
        ...(role === "webadmin" || role === "coe"
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
              ...(enableOutingsAndOutpasses
                ? [
                    {
                      id: "outpass",
                      label: "Outpass Logs",
                      icon: GraduationCap,
                    },
                    { id: "outings", label: "Outing Protocol", icon: Activity },
                  ]
                : []),
            ],
          },
        ]
      : []),
    {
      group: "Academic",
      items: [
        ...(role === "webadmin" || role === "coe"
          ? [{ id: "attendance", label: "Attendance Upload", icon: Layout }]
          : []),
        ...(role === "webadmin" || role === "coe"
          ? [{ id: "grades", label: "Grades Upload", icon: GraduationCap }]
          : []),
        ...(role === "webadmin" || role === "coe"
          ? [{ id: "subjects", label: "Manage Subjects", icon: BookOpen }]
          : []),
        ...(role === "webadmin" || role === "coe"
          ? [
              {
                id: "semester_registration",
                label: "Semester Registration",
                icon: CalendarClock,
              },
            ]
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
        ...(role === "webadmin" || role === "coe"
          ? [{ id: "faculty_mgmt", label: "Faculty Management", icon: Users }]
          : []),
        ...(role === "webadmin" || role === "coe"
          ? [{ id: "system_logs", label: "System & Logs", icon: Activity }]
          : []),
        ...(canManageRoles
          ? [{ id: "role_mgmt", label: "Roles", icon: UserCog }]
          : []),
        ...(canUseDatabase
          ? [{ id: "database", label: "Database", icon: Database }]
          : []),
        { id: "security", label: "Security", icon: Lock },
      ],
    },
    ...(showHelp
      ? [
          {
            group: "Help",
            items: [{ id: "help", label: "Help", icon: CircleHelp }],
          },
        ]
      : []),
  ];

  const { logout } = useLogout();

  const renderComingSoon = (title: string) => (
    <EmptyState
      title={`${title} is not available yet`}
      body={`Automated ${title.toLowerCase()} workflows are currently in deployment. Please coordinate via manual channels for urgent actions.`}
      icon={Activity}
    />
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
      case "semester_registration":
        return <SemesterBuilder />;
      case "security":
        return <SecuritySection username={username} />;
      case "website_updates":
        return <WebsiteUpdatesSection />;
      case "database":
        return <DatabaseSection />;
      case "role_mgmt":
        return <RoleManagement />;
      case "help":
        return <HelpSection />;
      case "grievances":
        return renderComingSoon("Grievance Redressal");
      case "outpass":
        return renderComingSoon("Outpass Records");
      case "outings":
        return renderComingSoon("Outing Logs");
      default:
        return (
          <div className="animate-in fade-in duration-500">
            <WebadminOverview username={username} />
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
      collapseBranding="hide"
      headerExtra={showHelp ? <HowToButton screen={activeTab} /> : undefined}
      mobileHeaderExtra={
        showHelp ? <HowToButton screen={activeTab} tone="chrome" /> : undefined
      }
    >
      {renderContent()}
    </AdminShell>
  );
}
