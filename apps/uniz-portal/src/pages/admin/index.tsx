import { useNavigate } from "react-router";
import { useAdminname } from "../../hooks/adminname";
import { useIsAuth } from "../../hooks/is_authenticated";
import {
  Settings,
  UserPlus,
  ClipboardList,
  CalendarCheck,
  UserCog,
  Image as ImageIcon,
  Megaphone,
  CheckCircle2,
  BookOpen,
  LogOut,
  RefreshCcw,
  Search,
  ScanLine,
  UserCircle,
} from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import WebadminDashboard from "./Webadmin/WebadminDashboard";
import DeanDashboard from "./Dean/DeanDashboard";
import SWODashboard from "./SWO/SWODashboard";
import CaretakerDashboard from "./Caretaker/CaretakerDashboard";
import WardenDashboard from "./Warden/WardenDashboard";
import SecurityPortal from "./SecurityPortal";
import DirectorDashboard from "./Director/DirectorDashboard";
import AdminLayout from "./layout";
import { PageHeader } from "@/components/ui/page-header";
import { Tile } from "@/components/ui/tile";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { parseJwt } from "../../utils/security";
import { resolveAdminPortalRole } from "../../utils/adminRole";
import { enableOutingsAndOutpasses } from "@/config/featureFlags";

export default function Admin() {
  useIsAuth();
  useAdminname();
  const navigate = useNavigate();
  const { logout } = useLogout();
  const username = (localStorage.getItem("username") || "Admin").replace(
    /"/g,
    "",
  );

  const adminToken = localStorage.getItem("admin_token");
  const decoded = adminToken ? parseJwt(adminToken) : null;
  const role = resolveAdminPortalRole(decoded, username);

  if (role === "webadmin" || role === "coe") {
    return <WebadminDashboard />;
  }

  if (role === "director") {
    return <DirectorDashboard />;
  }

  if (role === "swo" || role === "dsw") {
    return <SWODashboard />;
  }

  if (role === "dean" || role === "hod") {
    return <DeanDashboard />;
  }

  if (role === "caretaker_male" || role === "caretaker_female") {
    return <CaretakerDashboard />;
  }

  if (role === "warden_male" || role === "warden_female" || role === "warden") {
    return <WardenDashboard />;
  }

  if (role === "security") {
    return <SecurityPortal />;
  }

  const handleLogout = () => {
    logout();
  };

  const isDirector =
    role === "director" || role === "webadmin" || role === "coe";
  const isDean = role === "dean" || isDirector;
  const isHOD = role === "hod" || isDean;
  const isDSW = role === "dsw" || role === "swo" || isDean;
  const isWarden = role === "warden" || role.includes("warden") || isDSW;
  const isCaretaker =
    role === "caretaker" || role.includes("caretaker") || isWarden;
  const isSecurity = role === "security" || isDirector;

  // Define actions using a cleaner data structure
  const priorityActions = [];
  if (isCaretaker && enableOutingsAndOutpasses) {
    priorityActions.push({
      onClick: () => navigate("/admin/approveouting"),
      title: "Approve Outings",
      subtitle: "Process Requests",
      Icon: CheckCircle2,
    });
    priorityActions.push({
      onClick: () => navigate("/admin/approveoutpass"),
      title: "Approve Outpasses",
      subtitle: "Process Requests",
      Icon: CheckCircle2,
    });
  }

  if (role === "security") {
    priorityActions.push({
      onClick: () => navigate("/admin/security"),
      title: "Security Scanner",
      subtitle: "Gate Keeping",
      Icon: ScanLine,
    });
  }

  const sections = [
    {
      title: "Academic Management",
      show: isDean || isHOD,
      items: [
        {
          onClick: () => navigate("/admin/addgrades"),
          title: "Academic Records",
          subtitle: "Upload Grades",
          Icon: ClipboardList,
        },
        {
          onClick: () => navigate("/admin/addattendance"),
          title: "Attendance",
          subtitle: "Daily Logs",
          Icon: CalendarCheck,
        },
        {
          onClick: () => navigate("/admin/curriculum"),
          title: "Curriculum",
          subtitle: "Courses & Syllabus",
          Icon: BookOpen,
        },
      ],
    },
    {
      title: "People & Roles",
      show: true,
      items: [
        ...(isDean
          ? [
              {
                onClick: () => navigate("/admin/addfaculty"),
                title: "Faculty",
                subtitle: "Manage Staff",
                Icon: UserPlus,
              },
              {
                onClick: () => navigate("/admin/addstudents"),
                title: "Students",
                subtitle: "Import CSV",
                Icon: UserPlus,
              },
            ]
          : []),
        ...(isDirector
          ? [
              {
                onClick: () => navigate("/admin/roles"),
                title: "Roles",
                subtitle: "Permissions",
                Icon: UserCog,
              },
            ]
          : []),
        ...(isSecurity
          ? [
              {
                onClick: () => navigate("/admin/searchstudents"),
                title: "Search",
                subtitle: "Find Students",
                Icon: Search,
              },
            ]
          : []),
      ],
    },
    {
      title: "Communication & Site",
      show: isDSW,
      items: [
        {
          onClick: () => navigate("/admin/notifications"),
          title: "Notifications",
          subtitle: "Broadcasts",
          Icon: Megaphone,
        },
        ...(isDean
          ? [
              {
                onClick: () => navigate("/admin/banners"),
                title: "Banners",
                subtitle: "Site Visuals",
                Icon: ImageIcon,
              },
            ]
          : []),
      ],
    },
    {
      title: "Operations",
      show: isCaretaker,
      items: [
        {
          onClick: () => navigate("/admin/updatestudentstatus"),
          title: "Status Update",
          subtitle: "Force Check-in/out",
          Icon: RefreshCcw,
        },
      ],
    },
  ];

  const roleTitle = role.replace(/_/g, " ");

  return (
    <AdminLayout>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b border-border bg-bg px-4 min-[821px]:px-10">
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Profile" onClick={() => navigate("/admin/profile")}>
          <UserCircle size={18} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => navigate("/admin/settings")}>
          <Settings size={18} />
        </Button>
        <Avatar name={username} alt="" size={36} />
        <Button variant="ghost" size="compact" onClick={handleLogout}>
          <LogOut size={16} />
          Log out
        </Button>
      </header>
      <div className="mx-auto w-full max-w-[1280px] space-y-10 px-4 py-6 min-[821px]:px-10 min-[821px]:py-8">
        <PageHeader title={roleTitle} meta={`${username} · campus administration`} />
        {priorityActions.length > 0 && (
          <section className="space-y-5">
            <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">Priority</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {priorityActions.map((action) => (
                <Tile
                  key={action.title}
                  icon={action.Icon}
                  label={action.title}
                  line={action.subtitle}
                  onClick={action.onClick}
                />
              ))}
            </div>
          </section>
        )}
        {sections.map(
          (section) =>
            section.show &&
            section.items.length > 0 && (
              <section key={section.title} className="space-y-5">
                <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => (
                    <Tile
                      key={item.title}
                      icon={item.Icon}
                      label={item.title}
                      line={item.subtitle}
                      onClick={item.onClick}
                    />
                  ))}
                </div>
              </section>
            ),
        )}
      </div>
    </AdminLayout>
  );
}
