/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { CheckCircle2, LayoutDashboard, ChevronLeft } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile, Tile } from "@/components/ui/tile";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import { useAdminSectionRoute } from "../../../hooks/useAdminSectionRoute";
import ApproveComp from "../approve-comp";
import UpdateStatus from "../../../components/UpdateStudentStatus";
import { useAdminDashboardStats } from "../../../hooks/useAdminDashboardStats";
import {
  enableOutingsAndOutpasses,
  filterOutpassOutingTabs,
  filterOutpassOutingNavItems,
} from "@/config/featureFlags";

export default function WardenDashboard() {
  useIsAuth();

  const allowedTabs = useMemo(
    () =>
      filterOutpassOutingTabs([
        "dashboard",
        "approve_outing",
        "approve_outpass",
        "status_update",
      ] as const),
    [],
  );
  const { activeTab, setActiveTab } = useAdminSectionRoute(allowedTabs);

  const rawRole = (localStorage.getItem("admin_role") || "warden").replace(
    /"/g,
    "",
  );
  const username =
    localStorage.getItem("username")?.replace(/"/g, "") || "Warden";
  const isMale = rawRole === "warden_male";
  const portalLabel = isMale ? "M-Warden Portal" : "F-Warden Portal";
  const systemLabel = isMale ? "Boys Hostel Secure" : "Girls Hostel Secure";

  const navGroups = [
    {
      group: null,
      items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
    },
    ...(enableOutingsAndOutpasses
      ? [
          {
            group: "Approvals",
            items: filterOutpassOutingNavItems([
              {
                id: "approve_outing",
                label: "Approve Outings",
                icon: CheckCircle2,
              },
              {
                id: "approve_outpass",
                label: "Approve Outpasses",
                icon: CheckCircle2,
              },
            ]),
          },
        ]
      : []),
  ];

  const navItems = navGroups.flatMap((group) => group.items);

  const { logout } = useLogout();
  const { data: academicStats } = useAdminDashboardStats("warden");

  const renderContent = () => {
    switch (activeTab) {
      case "approve_outing":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 md:hidden">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2 text-text-2 font-semibold text-caption mb-4"
              >
                <ChevronLeft size={14} /> Back to Hub
              </button>
            </div>
            <ApproveComp type="outing" />
          </div>
        );
      case "approve_outpass":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 md:hidden">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2 text-text-2 font-semibold text-caption mb-4"
              >
                <ChevronLeft size={14} /> Back to Hub
              </button>
            </div>
            <ApproveComp type="outpass" />
          </div>
        );
      case "status_update":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 md:hidden">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2 text-text-2 font-semibold text-caption mb-4"
              >
                <ChevronLeft size={14} /> Back to Hub
              </button>
            </div>
            <UpdateStatus />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <PageHeader
              title={`Welcome, ${username}`}
              meta={`${systemLabel}. Hostel operations and student movement.`}
            />
            {academicStats ? (
              <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
                <StatTile label="Total students" value={academicStats.totalStudents.toLocaleString()} line="Enrolled" />
                <StatTile
                  label="Average attendance"
                  value={academicStats.avgAttendancePct != null ? `${academicStats.avgAttendancePct}%` : "—"}
                  line="Institution"
                />
                <StatTile label="Active semesters" value={academicStats.activeSemesters} line="Running" />
                <StatTile label="Faculty" value={academicStats.totalFaculty} line="On record" />
              </div>
            ) : null}
            {navItems.length > 1 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {navItems.slice(1).map((item) => (
                  <Tile
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    line="Open this section"
                    onClick={() => setActiveTab(item.id)}
                  />
                ))}
              </div>
            ) : null}
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
      roleLabel={portalLabel}
      headerSubtitle="Residential Warden"
      showSidebarProfile
      enableNavSearch
      showHeaderMenuToggle
      mobileNavItems={navItems}
      sidebarVariant="overlay-mobile"
      collapseBranding="abbreviate"
      navSpacing="compact"
      contentClassName="px-4 md:px-10"
    >
      {renderContent()}
    </AdminShell>
  );
}
