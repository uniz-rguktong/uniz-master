import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useNavigate } from "react-router-dom";
import { useIsAuth } from "../hooks/is_authenticated";
import { useState, lazy, Suspense } from "react";
import { enableOutingsAndOutpasses } from "../pages/student/student";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  GraduationCap,
  CalendarCheck,
  Home,
  Laptop,
  KeyRound,
  LogOut,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { Error } from "../App";
import { ConfirmModal } from "./ConfirmPopup";
import { Sidebar as SidebarUI, SidebarBody, SidebarLink } from "./ui/sidebar";
import { motion } from "framer-motion";

const CampusHub = lazy(() => import("../pages/promotions/CampusHub"));
const Attendance = lazy(() => import("../pages/attendance/Attendance"));
const StudySpace = lazy(() => import("../pages/promotions/StudySpace"));
const OutpassOuting = lazy(() => import("../pages/student/outpass&outing"));
const ResetPassword = lazy(() => import("../pages/student/resetpass"));
const RequestComp = lazy(() => import("../pages/student/request-component"));
const Student = lazy(() => import("../pages/student/student"));
const GradeHub = lazy(() => import("../pages/promotions/GradeHub"));
const Grievance = lazy(() => import("../pages/student/Grievance"));

export { enableOutingsAndOutpasses } from "../pages/student/student";

interface MainContent {
  content:
    | "outpass"
    | "outing"
    | "gradehub"
    | "resetpassword"
    | "dashboard"
    | "requestOuting"
    | "requestOutpass"
    | "campushub"
    | "studyspace"
    | "attendance"
    | "grievance"
    | "error";
}

const ContentSkeleton = () => (
  <div className="flex h-screen items-center justify-center text-neutral-400 font-bold uppercase tracking-widest text-sm animate-pulse">
    Loading...
  </div>
);

const Logo = () => {
  return (
    <div className="font-normal hidden md:flex space-x-2 items-center text-sm text-black py-1 relative z-20">
      <img
        src="/assets/ongole_logo.png"
        className="h-12 w-12 object-contain"
        alt="Ongole Logo"
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-extrabold text-xl tracking-tighter text-black whitespace-pre"
      >
        Ongole
      </motion.span>
    </div>
  );
};

const LogoIcon = () => {
  return (
    <div className="font-normal hidden md:flex space-x-2 items-center text-sm text-black py-1 relative z-20">
      <img
        src="/assets/ongole_logo.png"
        className="h-12 w-12 object-contain"
        alt="Ongole Logo"
      />
    </div>
  );
};

export default function Sidebar({ content }: MainContent) {
  useIsAuth();
  const userData = useRecoilValue<any>(student);
  const navigate = useNavigate();
  const [_isAuth, setAuth] = useRecoilState(is_authenticated);
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("student_token");
    localStorage.removeItem("username");
    localStorage.removeItem("admin_token");
    setAuth({
      is_authnticated: false,
      type: "",
    });
    navigate("/");
  };

  const navItems = [
    {
      label: "My Profile",
      href: "/student",
      content: "dashboard",
      icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
    },
    ...(enableOutingsAndOutpasses
      ? [
          {
            label: "Outing Requests",
            href: "/student/outing",
            content: "outing",
            icon: <Clock className="h-5 w-5 shrink-0" />,
          },
          {
            label: "Outpass Requests",
            href: "/student/outpass",
            content: "outpass",
            icon: <CalendarDays className="h-5 w-5 shrink-0" />,
          },
        ]
      : []),
    {
      label: "Results",
      href: "/student/gradehub",
      content: "gradehub",
      icon: <GraduationCap className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Attendance",
      href: "/student/attendance",
      content: "attendance",
      icon: <CalendarCheck className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Campus Hub",
      href: "/campushub",
      content: "campushub",
      icon: <Home className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Study Space",
      href: "/studyspace",
      content: "studyspace",
      icon: <Laptop className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/student/resetpassword",
      content: "resetpassword",
      icon: <KeyRound className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Grievance",
      href: "/student/grievance",
      content: "grievance",
      icon: <AlertCircle className="h-5 w-5 shrink-0" />,
    },
  ];

  const contentMap: Record<MainContent["content"], JSX.Element> = {
    outing: <OutpassOuting request="outing" />,
    outpass: <OutpassOuting request="outpass" />,
    resetpassword: <ResetPassword />,
    requestOuting: <RequestComp type="outing" />,
    requestOutpass: <RequestComp type="outpass" />,
    dashboard: <Student />,
    gradehub: <GradeHub />,
    campushub: <CampusHub />,
    studyspace: <StudySpace />,
    attendance: <Attendance />,
    grievance: <Grievance />,
    error: <Error />,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white overflow-hidden">
      <SidebarUI open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="md:hidden flex flex-col items-center mt-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-lg text-neutral-800">
                  {userData?.name || "Student"}
                </span>
                <div
                  onClick={() => {
                    navigate("/student?edit=true");
                    setOpen(false);
                  }}
                  className="cursor-pointer p-1.5 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors group"
                >
                  <Pencil className="h-4 w-4 text-neutral-400 group-hover:text-[#800000] transition-colors" />
                </div>
              </div>
              <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 bg-neutral-100 flex items-center justify-center">
                {userData?.profile_url ? (
                  <img
                    src={userData.profile_url}
                    className="h-full w-full object-cover"
                    alt="Avatar"
                  />
                ) : (
                  <span className="text-3xl font-bold text-neutral-800">
                    {userData?.name?.charAt(0)?.toUpperCase() || "S"}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {navItems.map((item, idx) => (
                <SidebarLink
                  key={idx}
                  isActive={content === item.content}
                  link={{
                    label: item.label,
                    href: "#",
                    icon: item.icon,
                    onClick: () => navigate(item.href),
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              className="hidden md:flex"
              link={{
                label: userData?.name || "Student",
                href: "#",
                icon: (
                  <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                    {userData?.profile_url ? (
                      <img
                        src={userData.profile_url}
                        className="h-full w-full object-cover"
                        alt="Avatar"
                      />
                    ) : (
                      <span className="text-xs font-bold text-neutral-800">
                        {userData?.name?.charAt(0)?.toUpperCase() || "S"}
                      </span>
                    )}
                  </div>
                ),
              }}
            />
            <SidebarLink
              link={{
                label: "Sign Out",
                href: "#",
                icon: (
                  <LogOut className="h-5 w-5 shrink-0 text-black group-hover/sidebar:text-white transition-colors" />
                ),
                onClick: () => setShowConfirm(true),
              }}
              className="mt-2 text-red-500"
            />
          </div>
        </SidebarBody>
      </SidebarUI>

      <main className="flex-1 h-screen overflow-y-auto bg-white md:rounded-tl-2xl md:border-l border-neutral-100 p-2 md:p-10">
        <Suspense fallback={<ContentSkeleton />}>
          {contentMap[content] || <Error />}
        </Suspense>
      </main>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogout}
        message="Are you sure you want to end your session?"
      />
    </div>
  );
}
