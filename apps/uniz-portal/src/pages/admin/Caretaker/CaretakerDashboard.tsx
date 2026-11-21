/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { CheckCircle2, RefreshCcw, LayoutDashboard } from "lucide-react";
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

export default function CaretakerDashboard() {
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

  const username = (localStorage.getItem("username") || "Caretaker").replace(
    /"/g,
    "",
  );

  const rawRole = (localStorage.getItem("admin_role") || "caretaker").replace(
    /"/g,
    "",
  );
  const isMale = rawRole === "caretaker_male";
  const portalLabel = isMale ? "M-Caretaker Portal" : "F-Caretaker Portal";
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
    {
      group: "Students",
      items: [
        { id: "status_update", label: "Status Update", icon: RefreshCcw },
      ],
    },
  ];

  const navItems = navGroups.flatMap((group) => group.items);

  const { logout } = useLogout();
  const { data: academicStats } = useAdminDashboardStats("caretaker");

  const searchExtra = (
    <p className="px-1 pt-2 text-small text-navy-300">{portalLabel}</p>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "approve_outing":
        return <ApproveComp type="outing" />;
      case "approve_outpass":
        return <ApproveComp type="outpass" />;
      case "status_update":
        return <UpdateStatus />;
      default:
        return (
          <div className="space-y-6">
            <PageHeader
              title={`Welcome, ${username}`}
              meta={`${systemLabel}. Oversee student movement and residential security.`}
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
      headerSubtitle="Student Housing Caretaker"
      showSidebarProfile
      enableNavSearch
      searchExtra={searchExtra}
      showHeaderMenuToggle
      collapseBranding="abbreviate"
      navSpacing="compact"
    >
      {renderContent()}
    </AdminShell>
  );
}
