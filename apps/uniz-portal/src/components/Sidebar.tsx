import { useRecoilValue } from "recoil";
import { student } from "../store";
import { useNavigate } from "react-router-dom";
import { useIsAuth } from "../hooks/is_authenticated";
import { useLogout } from "../hooks/useLogout";
import { useStudentData } from "../hooks/student_info";
import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { enableOutingsAndOutpasses } from "../pages/student/student";
import {
  Clock,
  CalendarDays,
  GraduationCap,
  CalendarCheck,
  LogOut,
  AlertCircle,
  X,
  Layers,
  ChevronLeft,
  LayoutGrid,
  Lock,
  Home,
  HelpCircle,
} from "lucide-react";
import { Error } from "../App";
import { ConfirmModal } from "./ConfirmPopup";
import { motion, AnimatePresence } from "framer-motion";
import { Dock } from "./ui/dock-two";
import { InteractiveMenu, InteractiveMenuItem } from "./ui/modern-mobile-menu";
import { AnimatedTooltip } from "./ui/animated-tooltip";
import { developers } from "../constants/developers";

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
const HelpSupport = lazy(() => import("../pages/student/HelpSupport"));

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
  | "help"
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
      icon: Home,
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
      id: "grievance",
      label: "Grievance",
      href: "/student/grievance",
      content: "grievance",
      icon: AlertCircle,
      activeColor: "text-rose-600",
      hoverColor: "hover:text-rose-600",
    },
    {
      id: "help",
      label: "Help & Support",
      href: "/student/help",
      content: "help",
      icon: HelpCircle,
      activeColor: "text-navy-900",
      hoverColor: "hover:text-navy-900",
    },
  ];

  const dockItems = [
    ...navItems.map((item) => ({
      icon: item.icon,
      label: item.label,
      activeColor: item.activeColor,
      hoverColor: item.hoverColor,
      onClick: () => {
        navigate(item.href);
      },
      isActive: content === item.content,
    })),
    {
      icon: LogOut,
      label: "Logout",
      onClick: () => setShowConfirm(true),
      isActive: false,
      activeColor: "text-red-600",
      hoverColor: "hover:text-red-600",
    },
  ];

  const primaryMobileItems: InteractiveMenuItem[] = [
    {
      label: "Home",
      icon: Home,
      onClick: () => navigate("/student"),
      isActive: content === "dashboard",
    },
    {
      label: "Security",
      icon: Lock,
      onClick: () => navigate("/student/resetpassword"),
      isActive: content === "resetpassword",
    },
    {
      label: "Explore",
      icon: LayoutGrid,
      isActive: ["gradehub", "attendance", "grievance"].includes(
        content
      ),
    },
    {
      label: "Current Sem",
      icon: Layers,
      onClick: () => navigate("/student/current-semester"),
      isActive: content === "currentSemester",
    },
    {
      label: "Help",
      icon: HelpCircle,
      onClick: () => navigate("/student/help"),
      isActive: content === "help",
    },
  ];

  const moreMobileItems: InteractiveMenuItem[] = [
    {
      label: "Results",
      icon: GraduationCap,
      onClick: () => navigate("/student/gradehub"),
      isActive: content === "gradehub",
    },
    {
      label: "Attendance",
      icon: CalendarCheck,
      onClick: () => navigate("/student/attendance"),
      isActive: content === "attendance",
    },
    {
      label: "Grievance",
      icon: AlertCircle,
      onClick: () => navigate("/student/grievance"),
      isActive: content === "grievance",
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
    help: <HelpSupport />,
    error: <Error />,
  };

  return (
    <div className="flex flex-col min-h-screen bg-premium-gradient text-slate-900 selection:bg-navy-100 selection:text-navy-900">
      <AnimatePresence>
        {showNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-[#0B2A47] to-[#0F3B63] text-white py-2.5 px-6 flex items-center justify-between shadow-lg relative z-[100]"
          >
            <div className="flex-1 text-center text-[11px] md:text-[13px] font-sans font-bold tracking-tight">
              Outpass and outing feature has been currently disabled by the
              administration
            </div>
            <button
              onClick={() => setShowNotice(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col flex-1 relative">
        {/* Floating Desktop Dock */}
        <div className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-50">
          <Dock
            items={dockItems}
            className="shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-slate-100"
          />
        </div>

        {/* Main Content Area */}
        <main ref={mainRef} className="flex-1 md:overflow-y-auto md:max-h-screen">
          {/* Mobile Header */}
          <header className={`md:hidden sticky top-0 z-40 p-4 px-6 flex justify-between items-center h-16 transition-all duration-300 ${isScrolled ? "bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm" : "bg-transparent border-transparent"}`}>
            <h1 className={`unifrakturcook-bold text-3xl tracking-tighter transition-colors duration-300 ${isScrolled ? "text-slate-900" : "text-slate-800"}`}>
              uniZ
            </h1>
            <button
              onClick={() => setShowConfirm(true)}
              className={`p-2 transition-all font-sans ${isScrolled ? "text-slate-400 active:text-red-500" : "text-slate-500 active:text-red-600"}`}
            >
              <LogOut size={22} />
            </button>
          </header>

          {/* Re-designed Desktop Header (Pharmacy App Style) */}
          <header className={`sticky top-0 z-40 p-4 px-8 md:pl-36 justify-between items-center hidden md:flex transition-all duration-300 ${isScrolled ? "bg-white/60 backdrop-blur-md border-b border-white/20 shadow-sm" : "bg-transparent border-transparent shadow-none"}`}>
            {/* Left: App Branding */}
            <div className="flex items-center gap-4">
              <h1 className="unifrakturcook-bold text-3xl text-slate-800 tracking-tight">
                uniZ
              </h1>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[14px] font-bold text-slate-900 leading-none">
                  {userData?.name || "Student User"}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 mt-1 lowercase tracking-tight">
                  {userData?.email || "N/A"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-full ring-2 ring-navy-50 border-2 border-white overflow-hidden shadow-sm">
                {userData?.profile_url ? (
                  <img
                    src={userData.profile_url}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-navy-900 text-white font-bold text-xs">
                    {userData?.name?.charAt(0) || "S"}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full border border-slate-100 transition-all ml-2"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <div className="pt-4 px-4 pb-32 md:p-10 md:ml-28 min-h-full">
            {/* Mobile Back Button (Below Header) */}
            {content !== "dashboard" && (
              <div className="md:hidden mb-6">
                <button
                  onClick={() => navigate("/student")}
                  className="flex items-center gap-1 text-slate-500 font-bold text-[10px] uppercase tracking-widest py-2"
                >
                  <ChevronLeft size={20} strokeWidth={3} />

                </button>
              </div>
            )}
            <Suspense fallback={<ContentSkeleton />}>
              {contentMap[content] || <Error />}
            </Suspense>

            {/* Developer Credit Footer */}
            <div className="mt-20 py-8 border-t border-slate-100/50 flex flex-col md:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                developed and maintained by
              </span>
              <div className="flex items-center">
                <AnimatedTooltip items={developers} />
              </div>
            </div>
          </div>
        </main>

        <ConfirmModal
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleLogout}
          message="Are you sure you want to end your session?"
        />

        {/* Modern Mobile Bottom Navigation - Sticky Animated Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <InteractiveMenu 
            primaryItems={primaryMobileItems} 
            moreItems={moreMobileItems} 
          />
        </div>
      </div>
    </div>
  );
}
