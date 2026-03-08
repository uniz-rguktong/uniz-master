import { useNavigate } from "react-router";
import { useState, useRef, useEffect } from "react";
import { useAdminname } from "../../hooks/adminname";
import { useIsAuth } from "../../hooks/is_authenticated";
import {
  UserPlus,
  ClipboardList,
  CalendarCheck,
  UserCog,
  Image as ImageIcon,
  Megaphone,
  CheckCircle2,
  BookOpen,
  LogOut,
  Zap,
  RefreshCcw,
  Search,
  LayoutGrid,
  Layers,
} from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import WebmasterDashboard from "./Webmaster/WebmasterDashboard";
import DeanDashboard from "./Dean/DeanDashboard";
import SWODashboard from "./SWO/SWODashboard";
import CaretakerDashboard from "./Caretaker/CaretakerDashboard";
import WardenDashboard from "./Warden/WardenDashboard";
import SecurityPortal from "./SecurityPortal";
import ProfilePopup from "./ProfilePopup";

const QuickActionButton = ({
  onClick,
  title,
  subtitle,
  Icon,
}: {
  onClick: () => void;
  title: string;
  subtitle: string;
  Icon: any;
}) => (
  <button
    onClick={onClick}
    className="group relative flex flex-col items-start p-7 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-300 text-left w-full overflow-hidden shadow-none"
  >
    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
      <Icon className="w-24 h-24" />
    </div>
    <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 mb-5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 border border-slate-100 group-hover:border-blue-500">
      <Icon className="w-6 h-6" />
    </div>
    <div className="relative z-10">
      <h3 className="font-black text-slate-900 text-xl leading-tight mb-1 group-hover:translate-x-1 transition-transform italic">
        {title}
      </h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
        {subtitle}
      </p>
    </div>
  </button>
);

export default function Admin() {
  useIsAuth();
  useAdminname();
  const navigate = useNavigate();
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const headerAvatarRef = useRef<HTMLButtonElement>(null);

  const username = localStorage.getItem("username") || "Admin";
  const initials = username[0]?.toUpperCase() ?? "A";
  const role = (localStorage.getItem("admin_role") || "admin").replace(/"/g, "");

  // Fetch profile on mount
  useEffect(() => {
    const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
    if (token) {
      import("../../api/endpoints").then(({ BASE_URL }) => {
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
          .catch(() => { });
      });
    }
  }, []);

  if (role === "webmaster") return <WebmasterDashboard />;
  if (role === "swo" || role === "dsw") return <SWODashboard />;
  if (role === "dean" || role === "hod") return <DeanDashboard />;
  if (role === "caretaker_male" || role === "caretaker_female") return <CaretakerDashboard />;
  if (role === "warden_male" || role === "warden_female" || role === "warden") return <WardenDashboard />;
  if (role === "security") return <SecurityPortal />;

  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
  };

  const isDirector = role === "director" || role === "webmaster";
  const isDean = role === "dean" || isDirector;
  const isHOD = role === "hod" || isDean;
  const isDSW = role === "dsw" || role === "swo" || isDean;
  const isWarden = role === "warden" || role.includes("warden") || isDSW;
  const isCaretaker = role === "caretaker" || role.includes("caretaker") || isWarden;
  const isSecurity = role === "security" || isDirector;

  const priorityActions = [];
  if (isCaretaker) {
    priorityActions.push({ onClick: () => navigate("/admin/approveouting"), title: "Approve Outings", subtitle: "Process Requests", Icon: CheckCircle2 });
    priorityActions.push({ onClick: () => navigate("/admin/approveoutpass"), title: "Approve Outpasses", subtitle: "Process Requests", Icon: CheckCircle2 });
  }

  const sections = [
    {
      title: "Academic Management",
      show: isDean || isHOD,
      items: [
        { onClick: () => navigate("/admin/current-semester"), title: "Current Session", subtitle: "Ongoing Academic Meta", Icon: Layers },
        { onClick: () => navigate("/admin/addgrades"), title: "Academic Records", subtitle: "Upload Grades", Icon: ClipboardList },
        { onClick: () => navigate("/admin/addattendance"), title: "Attendance", subtitle: "Daily Logs", Icon: CalendarCheck },
        { onClick: () => navigate("/admin/curriculum"), title: "Curriculum", subtitle: "Courses & Syllabus", Icon: BookOpen },
      ],
    },
    {
      title: "People & Roles",
      show: true,
      items: [
        ...(isDean ? [
          { onClick: () => navigate("/admin/addfaculty"), title: "Faculty", subtitle: "Manage Staff", Icon: UserPlus },
          { onClick: () => navigate("/admin/addstudents"), title: "Students", subtitle: "Import CSV", Icon: UserPlus },
        ] : []),
        ...(isDirector ? [{ onClick: () => navigate("/admin/roles"), title: "Roles", subtitle: "Permissions", Icon: UserCog }] : []),
        ...(isSecurity ? [{ onClick: () => navigate("/admin/searchstudents"), title: "Search", subtitle: "Find Students", Icon: Search }] : []),
      ],
    },
    {
      title: "Communication & Site",
      show: isDSW,
      items: [
        { onClick: () => navigate("/admin/notifications"), title: "Notifications", subtitle: "Broadcasts", Icon: Megaphone },
        ...(isDean ? [{ onClick: () => navigate("/admin/banners"), title: "Banners", subtitle: "Site Visuals", Icon: ImageIcon }] : []),
      ],
    },
    {
      title: "Operations",
      show: isCaretaker,
      items: [{ onClick: () => navigate("/admin/updatestudentstatus"), title: "Status Update", subtitle: "Force Check-in/out", Icon: RefreshCcw }],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 pb-20 font-outfit">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 px-10 py-5 flex items-center justify-between bg-white/40 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-4">
          <h1 className="unifrakturcook-bold text-4xl text-slate-900 tracking-tight">uniZ</h1>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] leading-none mb-1">Central Console</p>
            <p className="text-[15px] font-black text-slate-900 tracking-tight leading-none italic uppercase">{role.replace("_", " ")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight">
              {profileName || username}
            </p>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5 lowercase tracking-tight">
              {profileEmail || `${username}@rguktong.ac.in`}
            </p>
          </div>

          <button
            ref={headerAvatarRef}
            onClick={() => setProfilePopupOpen(true)}
            title="Profile"
            className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border-[3px] border-white hover:ring-2 hover:ring-blue-400 transition-all active:scale-95 shrink-0 shadow-md ring-1 ring-slate-200/50"
          >
            {profilePhoto ? (
              <img src={profilePhoto} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-sm">
                {initials}
              </div>
            )}
          </button>

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
        anchorRef={headerAvatarRef}
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

      <div className="max-w-7xl mx-auto px-10 py-12 space-y-16">
        {/* Priority Section */}
        {priorityActions.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2.5 mb-8 ml-1">
              <Zap className="w-5 h-5 text-blue-600 fill-blue-600" />
              <h2 className="text-xl font-black tracking-tight uppercase italic">
                Priority Operations
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {priorityActions.map((action) => (
                <QuickActionButton key={action.title} {...action} />
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Sections */}
        {sections.map(
          (section) =>
            section.show &&
            section.items.length > 0 && (
              <div
                key={section.title}
                className="animate-in fade-in slide-in-from-top-4 duration-700 delay-150"
              >
                <div className="flex items-center gap-2.5 mb-8 ml-1 border-b border-slate-100 pb-4">
                  <LayoutGrid className="w-4 h-4 text-slate-400" />
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    {section.title}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {section.items.map((item, i) => (
                    <QuickActionButton key={i} {...item} />
                  ))}
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  );
}
