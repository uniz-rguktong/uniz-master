import { useRecoilValue } from "recoil";
import { student } from "../store";
import { useNavigate } from "react-router-dom";
import { useIsAuth } from "../hooks/is_authenticated";
import { useLogout } from "../hooks/useLogout";
import { useStudentData } from "../hooks/student_info";
import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { enableOutingsAndOutpasses } from "../pages/student/student";
import {
  User,
  Clock,
  CalendarDays,
  GraduationCap,
  CalendarCheck,
  LogOut,
  AlertCircle,
  X,
  Layers,
  ScanLine,
  LayoutGrid,
  Lock,
} from "lucide-react";
import { Error } from "../App";
import { ConfirmModal } from "./ConfirmPopup";
import { motion, AnimatePresence } from "framer-motion";
import { InAppNotificationBell } from "./InAppNotificationBell";

const Attendance = lazy(() => import("../pages/attendance/Attendance"));
const OutpassOuting = lazy(() => import("../pages/student/outpass&outing"));
const ResetPassword = lazy(() => import("../pages/student/resetpass"));
const RequestComp = lazy(() => import("../pages/student/request-component"));
const Student = lazy(() => import("../pages/student/student"));
const GradeHub = lazy(() => import("../pages/promotions/GradeHub"));
const CurrentSemester = lazy(() => import("../pages/student/CurrentSemester"));
const Grievance = lazy(() => import("../pages/student/Grievance"));
const SeatingArrangement = lazy(
  () => import("../pages/student/components/SeatingArrangement"),
);

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
  | "attendance"
  | "grievance"
  | "currentSemester"
  | "seating"
  | "error";
}

const ContentSkeleton = () => (
  <div className="flex h-screen items-center justify-center text-neutral-400 font-bold uppercase tracking-widest text-sm animate-pulse">
    Loading...
  </div>
);

export default function Sidebar({ content }: MainContent) {
  useIsAuth();
  useStudentData();
  const userData = useRecoilValue<any>(student);
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (mainRef.current) {
        setIsScrolled(mainRef.current.scrollTop > 10 || window.scrollY > 10);
      } else {
        setIsScrolled(window.scrollY > 10);
      }
    };
    window.addEventListener("scroll", handleScroll);
    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll);
    }

    // Pull to Refresh Implementation
    let touchStartPos = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartPos = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchCurrentPos = e.touches[0].clientY;
      // If pulled down more than 150px while at the top
      if (window.scrollY <= 0 && touchCurrentPos > touchStartPos + 150) {
        window.location.reload();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainEl) {
        mainEl.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const { logout } = useLogout();

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    {
      id: "dashboard",
      label: "My Profile",
      href: "/student",
      content: "dashboard",
      icon: User,
      activeColor: "text-navy-900",
      hoverColor: "hover:text-navy-900",
    },
    ...(enableOutingsAndOutpasses
      ? [
        {
          id: "outing",
          label: "Outing Requests",
          href: "/student/outing",
          content: "outing",
          icon: Clock,
          activeColor: "text-amber-500",
          hoverColor: "hover:text-amber-500",
        },
        {
          id: "outpass",
          label: "Outpass Requests",
          href: "/student/outpass",
          content: "outpass",
          icon: CalendarDays,
          activeColor: "text-orange-500",
          hoverColor: "hover:text-orange-500",
        },
      ]
      : []),
    {
      id: "gradehub",
      label: "Results",
      href: "/student/gradehub",
      content: "gradehub",
      icon: GraduationCap,
      activeColor: "text-emerald-600",
      hoverColor: "hover:text-emerald-600",
    },
    {
      id: "current-semester",
      label: "Current Sem",
      href: "/student/current-semester",
      content: "currentSemester",
      icon: Layers,
      activeColor: "text-navy-900",
      hoverColor: "hover:text-navy-900",
    },
    {
      id: "attendance",
      label: "Attendance",
      href: "/student/attendance",
      content: "attendance",
      icon: CalendarCheck,
      activeColor: "text-navy-900",
      hoverColor: "hover:text-navy-900",
    },
    {
      id: "resetpassword",
      label: "Password",
      href: "/student/resetpassword",
      content: "resetpassword",
      icon: Lock,
      activeColor: "text-slate-600",
      hoverColor: "hover:text-slate-600",
    },
    {
      id: "seating",
      label: "Exam Seating",
      href: "/student?tab=seating",
      content: "seating",
      icon: ScanLine,
      activeColor: "text-rose-600",
      hoverColor: "hover:text-rose-600",
    },
    {
      id: "grievance",
      label: "Grievance",
      href: "/student/grievance",
      content: "grievance",
      icon: AlertCircle,
      activeColor: "text-rose-600",
      hoverColor: "hover:text-rose-600",
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
    currentSemester: <CurrentSemester />,
    attendance: <Attendance />,
    grievance: <Grievance />,
    seating: <SeatingArrangement />,
    error: <Error />,
  };

  return (
    <div className="flex h-screen bg-[#fcfcfd] overflow-hidden">
      {/* 1. Traditional Sidebar (Desktop) / Drawer (Mobile) */}
      <aside
        className={`bg-white transition-all duration-300 z-50 fixed lg:static h-full border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col ${
          isSidebarOpen ? "w-[280px] translate-x-0" : "w-0 lg:w-24 -translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header/Logo */}
        <div className="px-6 py-8 flex items-center justify-between shrink-0">
          <h1 className={`unifrakturcook-bold text-4xl text-slate-900 transition-opacity duration-300 ${!isSidebarOpen && "lg:opacity-0"}`}>
            {isSidebarOpen ? "uniZ" : "Z"}
          </h1>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-sidebar-scroll py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = content === item.content;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.href);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center ${
                  isSidebarOpen ? "space-x-3.5 px-3.5" : "justify-center px-0"
                } py-2.5 rounded-xl text-left transition-all duration-200 group relative ${
                  isActive
                    ? "bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                    : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center justify-center min-w-[22px]">
                  <Icon
                    size={20}
                    className={`shrink-0 transition-colors ${
                      isActive ? "text-navy-900" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                </div>
                {isSidebarOpen && (
                  <span className={`text-[13.5px] font-semibold tracking-tight ${isActive ? "text-slate-900" : "text-slate-500"}`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info (Bottom of Sidebar) */}
        <div className="p-4 border-t border-slate-100 mt-auto">
          <button
            onClick={() => setShowConfirm(true)}
            className={`w-full flex items-center ${isSidebarOpen ? "space-x-3.5 px-3.5" : "justify-center px-0"} py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all group`}
          >
             <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
             {isSidebarOpen && <span className="text-[13.5px] font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. Main Layout */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#fcfcfd] relative">
        {/* Banner Notice */}
        <AnimatePresence>
          {showNotice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-navy-900 text-white py-2 px-6 flex items-center justify-between relative z-[60]"
            >
              <div className="flex-1 text-center text-[12px] font-bold tracking-tight">
                Outpass and outing feature has been currently disabled by the administration
              </div>
              <button onClick={() => setShowNotice(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className={`sticky top-0 z-40 transition-all duration-300 h-16 px-6 lg:px-10 flex items-center justify-between shrink-0 ${
          isScrolled 
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm" 
          : "bg-transparent border-transparent shadow-none"
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500"
            >
              <LayoutGrid size={20} />
            </button>
            <h2 className="text-[15px] font-bold text-slate-900 capitalize hidden sm:block">
              {content === "dashboard" ? "Student Profile" : content.replace(/([A-Z])/g, ' $1').trim()}
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <InAppNotificationBell />
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-bold text-slate-900 leading-none">{userData?.name || "Student"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{userData?.username || "ID"}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm ring-2 ring-white">
                {userData?.profile_url ? (
                  <img src={userData.profile_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-navy-900 text-white font-bold text-xs uppercase">
                    {userData?.name?.charAt(0) || "S"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <main 
          ref={mainRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-full">
            <Suspense fallback={<ContentSkeleton />}>
              {contentMap[content] || <Error />}
            </Suspense>
          </div>
        </main>

        <footer className="py-4 px-10 text-center border-t border-slate-100 bg-white/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            &copy; {new Date().getFullYear()} UniZ Educational Ecosystem. All rights Reserved.
          </p>
        </footer>
      </div>

      {/* Logout Confirmation */}
      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogout}
        message="Are you sure you want to end your session?"
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden shadow-2xl"
        />
      )}
    </div>
  );
}
