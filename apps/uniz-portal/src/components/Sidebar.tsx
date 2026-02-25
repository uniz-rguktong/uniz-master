import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useNavigate } from "react-router-dom";
import { useIsAuth } from "../hooks/is_authenticated";
import { useState, lazy, Suspense, useEffect } from "react";
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
  AlertCircle,
  Menu,
  X
} from "lucide-react";
import { Error } from "../App";
import { ConfirmModal } from "./ConfirmPopup";

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

export default function Sidebar({ content }: MainContent) {
  useIsAuth();
  const userData = useRecoilValue<any>(student);
  const navigate = useNavigate();
  const [_isAuth, setAuth] = useRecoilState(is_authenticated);

  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Mobile dock scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      id: "dashboard",
      label: "My Profile",
      href: "/student",
      content: "dashboard",
      icon: LayoutDashboard,
    },
    ...(enableOutingsAndOutpasses
      ? [
        {
          id: "outing",
          label: "Outing Requests",
          href: "/student/outing",
          content: "outing",
          icon: Clock,
        },
        {
          id: "outpass",
          label: "Outpass Requests",
          href: "/student/outpass",
          content: "outpass",
          icon: CalendarDays,
        },
      ]
      : []),
    {
      id: "gradehub",
      label: "Results",
      href: "/student/gradehub",
      content: "gradehub",
      icon: GraduationCap,
    },
    {
      id: "attendance",
      label: "Attendance",
      href: "/student/attendance",
      content: "attendance",
      icon: CalendarCheck,
    },
    {
      id: "campushub",
      label: "Campus Hub",
      href: "/campushub",
      content: "campushub",
      icon: Home,
    },
    {
      id: "studyspace",
      label: "Study Space",
      href: "/studyspace",
      content: "studyspace",
      icon: Laptop,
    },
    {
      id: "resetpassword",
      label: "Settings",
      href: "/student/resetpassword",
      content: "resetpassword",
      icon: KeyRound,
    },
    {
      id: "grievance",
      label: "Grievance",
      href: "/student/grievance",
      content: "grievance",
      icon: AlertCircle,
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

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F8FAFC]">
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-white shadow-md border border-slate-100 md:hidden hover:bg-slate-50 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ?
          <X className="h-[19px] w-[19px] text-slate-600" /> :
          <Menu className="h-[19px] w-[19px] text-slate-600" />
        }
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen bg-white border-r border-slate-200 z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          w-72
          md:sticky md:top-0 md:z-auto
        `}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-6 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 flex items-center justify-center p-1">
              <img
                src="/assets/ongole_logo.png"
                className="h-full w-full object-contain"
                alt="Ongole Logo"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-[19px] tracking-tight leading-none">Ongole</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-blue-600/70 font-bold mt-1.5 px-0.5">Student Portal</span>
            </div>
          </div>
        </div>


        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = content === item.content;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      navigate(item.href);
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-3 rounded-md text-left transition-all duration-200 group relative
                      ${isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `}
                  >
                    <div className="flex items-center justify-center min-w-[24px]">
                      <Icon
                        className={`
                          h-[21px] w-[21px] flex-shrink-0
                          ${isActive
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-700"
                          }
                        `}
                      />
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto px-3 py-4 space-y-1">
          {/* Profile Section */}
          <div className="">
            <div className="flex items-center px-3 py-2 transition-all duration-300 group">
              <div className="flex items-center justify-center min-w-[24px]">
                <div className="w-[22px] h-[22px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                  {userData?.profile_url ? (
                    <img src={userData.profile_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-slate-700 font-bold text-[10px]">{userData?.name?.charAt(0) || 'S'}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 ml-3">
                <p className="text-[15px] font-semibold text-slate-900 truncate tracking-tight">{userData?.name || 'Student'}</p>
              </div>

            </div>
          </div>

          {/* Logout Button */}
          <div className="">
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-all duration-200 group relative text-red-500 hover:bg-red-50"
            >
              <div className="flex items-center justify-center min-w-[24px]">
                <LogOut className="h-[20px] w-[20px] flex-shrink-0 group-hover:text-red-600" />
              </div>
              <span className="text-[15px] font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main
        className="flex-1 transition-all duration-300 ease-in-out"
      >
        <div className="p-4 pb-32 md:p-10 min-h-full">
          <Suspense fallback={<ContentSkeleton />}>
            {contentMap[content] || <Error />}
          </Suspense>
        </div>
      </main>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogout}
        message="Are you sure you want to end your session?"
      />

      {/* Mobile Bottom Navigation Bar - Exact Unstop Dimensions */}
      <div
        className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[72%] max-w-[280px] transition-all duration-500 ease-in-out ${isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
          }`}
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.12)] px-4 py-3 flex items-center justify-between">
          {/* Outpass Option */}
          <button
            onClick={() => navigate("/student/outpass")}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${content === "outpass" ? "text-blue-600" : "text-slate-400"
              }`}
          >
            <CalendarDays className="h-6 w-6" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Outpass</span>
          </button>

          {/* Results Option (Center) */}
          <button
            onClick={() => navigate("/student/gradehub")}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${content === "gradehub" ? "text-blue-600" : "text-slate-400"
              }`}
          >
            <GraduationCap className="h-6 w-6" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Results</span>
          </button>

          {/* Settings Option */}
          <button
            onClick={() => navigate("/student/resetpassword")}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${content === "resetpassword" ? "text-blue-600" : "text-slate-400"
              }`}
          >
            <KeyRound className="h-6 w-6" />
            <span className="text-[9px] font-bold uppercase tracking-tight">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

