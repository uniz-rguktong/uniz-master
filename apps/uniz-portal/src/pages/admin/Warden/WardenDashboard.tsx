/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import {
  CheckCircle2,
  LayoutDashboard,
  ChevronLeft,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { adminHubCardClass } from "@/components/admin/admin-ui";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import { useAdminSectionRoute } from "../../../hooks/useAdminSectionRoute";
import ApproveComp from "../approve-comp";
import UpdateStatus from "../../../components/UpdateStudentStatus";

export default function WardenDashboard() {
  useIsAuth();

  const allowedTabs = useMemo(
    () =>
      [
        "dashboard",
        "approve_outing",
        "approve_outpass",
        "status_update",
      ] as const,
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
    {
      group: "Approvals",
      items: [
        { id: "approve_outing", label: "Approve Outings", icon: CheckCircle2 },
        {
          id: "approve_outpass",
          label: "Approve Outpasses",
          icon: CheckCircle2,
        },
      ],
    },
  ];

  const navItems = navGroups.flatMap((group) => group.items);

  const { logout } = useLogout();

  const renderContent = () => {
    switch (activeTab) {
      case "approve_outing":
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 md:hidden">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2 text-zinc-500 font-bold tracking-[0.14em] text-[10px] mb-4"
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
                className="flex items-center gap-2 text-zinc-500 font-bold tracking-[0.14em] text-[10px] mb-4"
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
                className="flex items-center gap-2 text-zinc-500 font-bold tracking-[0.14em] text-[10px] mb-4"
              >
                <ChevronLeft size={14} /> Back to Hub
              </button>
            </div>
            <UpdateStatus />
          </div>
        );
      default:
        return (
          <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <div className="bg-gradient-to-br from-zinc-950 to-zinc-800 rounded-3xl py-6 px-10 text-white shadow-2xl shadow-zinc-200/50 relative overflow-hidden group">
              <div className="relative z-10 space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isMale ? "bg-blue-400" : "bg-pink-400"} animate-pulse`}
                  />
                  <span
                    className={`text-[8px] font-bold tracking-[0.14em] ${isMale ? "text-blue-400" : "text-pink-400"}`}
                  >
                    {systemLabel}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.03em] mb-1.5 leading-none">
                    Welcome, {username}
                  </h1>
                  <p className="text-zinc-400 font-medium text-[15px] opacity-90 max-w-lg leading-relaxed">
                    Residential Governance Terminal. Orchestrate hostel
                    operations and maintain student safety through your
                    administrative console.
                  </p>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-[0.03] translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
                <LayoutDashboard size={280} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {navItems.slice(1).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`${adminHubCardClass} p-5 text-left group flex flex-col justify-between min-h-[150px]`}
                >
                  <div className="p-3.5 rounded-2xl bg-zinc-50 text-zinc-400 mb-4 inline-block transition-all duration-300">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-[14px] mb-1 leading-tight">
                      {item.label}
                    </h3>
                    <p className="text-[8px] text-zinc-400 tracking-[0.14em] font-semibold opacity-60 group-hover:text-zinc-700 transition-colors">
                      INITIALIZE MODULE
                    </p>
                  </div>
                </button>
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
