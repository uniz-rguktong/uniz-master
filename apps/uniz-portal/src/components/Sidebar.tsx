import { useRecoilValue } from "recoil";
import { student } from "../store";
import { useNavigate } from "react-router-dom";
import { useIsAuth } from "../hooks/is_authenticated";
import { useLogout } from "../hooks/useLogout";
import { useStudentData } from "../hooks/student_info";
import { useState, useEffect, lazy, Suspense, useRef, type ReactElement } from "react";
import { enableOutingsAndOutpasses } from "@/config/featureFlags";
import {
  Clock,
  CalendarDays,
  GraduationCap,
  CalendarCheck,
  LogOut,
  AlertCircle,
  X,
  ChevronLeft,
  Lock,
  Home,
  HelpCircle,
  ClipboardCheck,
  Menu,
} from "lucide-react";
import { Error } from "../App";
import { ConfirmModal } from "./ConfirmPopup";
import { motion, AnimatePresence } from "framer-motion";
import {
  StudentPageSkeleton,
  studentContentSkeletonVariant,
} from "./StudentPageSkeleton";
import { NotificationBellButton } from "./NotificationBellButton";
import { SiteLegalFooter } from "./SiteLegalFooter";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";
import {
  portalLogoutPillClass,
  portalSidebarItemActiveClass,
  portalSidebarItemClass,
} from "@/lib/portal-ui";
import { cn } from "@/lib/utils";

const Attendance = lazy(() => import("../pages/attendance/Attendance"));
const OutpassOuting = lazy(() => import("../pages/student/outpass&outing"));
const ResetPassword = lazy(() => import("../pages/student/resetpass"));
const RequestComp = lazy(() => import("../pages/student/request-component"));
const Student = lazy(() => import("../pages/student/student"));
const GradeHub = lazy(() => import("../pages/promotions/GradeHub"));
const CurrentSemester = lazy(() => import("../pages/student/CurrentSemester"));
const Registration = lazy(() => import("../pages/student/Registration"));
const Grievance = lazy(() => import("../pages/student/Grievance"));
const SeatingArrangement = lazy(
  () => import("../pages/student/components/SeatingArrangement"),
);
const HelpSupport = lazy(() => import("../pages/student/HelpSupport"));
const NotificationCenter = lazy(() => import("../pages/NotificationCenter"));

export { enableOutingsAndOutpasses } from "@/config/featureFlags";

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
    | "notifications"
    | "currentSemester"
    | "registration"
    | "seating"
    | "help"
    | "error";
}

const ContentSkeleton = ({ content }: { content: MainContent["content"] }) => (
  <StudentPageSkeleton variant={studentContentSkeletonVariant(content)} />
);

export default function Sidebar({ content }: MainContent) {
  useIsAuth();
  useStudentData();
  const userData = useRecoilValue<any>(student);
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Pull to Refresh Implementation
    let touchStartPos = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartPos = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchCurrentPos = e.touches[0].clientY;
      if (window.scrollY <= 0 && touchCurrentPos > touchStartPos + 150) {
        window.location.reload();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
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
      hoverColor: "hover:text-navy-700",
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
      id: "registration",
      label: "Registration",
      href: "/student/registration",
      content: "registration",
      icon: ClipboardCheck,
      activeColor: "text-navy-900",
      hoverColor: "hover:text-navy-700",
    },
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
      hoverColor: "hover:text-navy-700",
    },
    {
      id: "resetpassword",
      label: "Password",
      href: "/student/resetpassword",
      content: "resetpassword",
      icon: Lock,
      activeColor: "text-navy-600",
      hoverColor: "hover:text-navy-600",
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
      hoverColor: "hover:text-navy-700",
    },
  ];

  const contentMap: Record<MainContent["content"], ReactElement> = {
    outing: <OutpassOuting request="outing" />,
    outpass: <OutpassOuting request="outpass" />,
    resetpassword: <ResetPassword />,
    requestOuting: <RequestComp type="outing" />,
    requestOutpass: <RequestComp type="outpass" />,
    dashboard: <Student />,
    gradehub: <GradeHub />,
    currentSemester: <CurrentSemester />,
    registration: <Registration />,
    attendance: <Attendance />,
    grievance: <Grievance />,
    notifications: <NotificationCenter portal="student" />,
    seating: <SeatingArrangement />,
    help: <HelpSupport />,
    error: <Error />,
  };

  const go = (href: string) => {
    setDrawerOpen(false);
    navigate(href);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-[#0A2540]">
      <AnimatePresence>
        {!enableOutingsAndOutpasses && showNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-[100] flex items-center justify-between bg-[#0A2540] px-6 py-2.5 text-white"
          >
            <div className="flex-1 text-center text-[11px] font-sans font-bold tracking-tight md:text-[13px]">
              Outpass and outing feature has been currently disabled by the
              administration
            </div>
            <button
              onClick={() => setShowNotice(false)}
              className="shrink-0 rounded-[2px] p-1 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="z-40 flex h-[52px] shrink-0 items-center justify-between bg-[#0A2540] px-4 text-white md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center md:hidden"
            onClick={() => setDrawerOpen((open) => !open)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <a href="/" className="flex items-center gap-2 text-white no-underline">
            <img src="/logo.png" alt="" className="h-7 w-7 rounded-full object-cover brightness-0 invert" />
            <span className="text-[15px] font-bold uppercase tracking-[1.5px]">Exam Cell</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBellButton
            size="sm"
            active={content === "notifications"}
            className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20 hover:!text-white"
          />
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-bold uppercase leading-none tracking-[0.4px]">
              {userData?.username || "Student"}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.6px] text-white/75">
              {UNIZ_CAMPUS_LABEL}
            </p>
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full border border-white/30">
            {userData?.profile_url ? (
              <img src={userData.profile_url} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/15 text-xs font-bold">
                {userData?.name?.charAt(0) || "S"}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {drawerOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[#021227]/30 md:hidden"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        <aside
          className={cn(
            "z-50 flex w-[220px] shrink-0 flex-col bg-[#E8E8E8] md:sticky md:top-[52px] md:h-[calc(100vh-52px)]",
            drawerOpen ? "fixed inset-y-[52px] left-0" : "hidden md:flex",
          )}
        >
          <nav className="flex-1 overflow-y-auto py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = content === item.content;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.href)}
                  className={cn(portalSidebarItemClass, active && portalSidebarItemActiveClass)}
                >
                  <Icon size={16} strokeWidth={1.75} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <button type="button" onClick={() => setShowConfirm(true)} className={portalLogoutPillClass}>
            <LogOut size={14} />
            Logout
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <main ref={mainRef} className="flex-1">
            <div className="min-h-full bg-white px-4 py-6 md:px-10 md:py-8">
              {content !== "dashboard" && (
                <div className="mb-4 md:hidden">
                  <button
                    onClick={() => navigate("/student")}
                    className="flex items-center gap-1 py-2 font-sans text-[10px] font-bold tracking-[0.14em] text-[#5A7A94]"
                  >
                    <ChevronLeft size={20} strokeWidth={3} />
                  </button>
                </div>
              )}
              <Suspense fallback={<ContentSkeleton content={content} />}>
                {contentMap[content] || <Error />}
              </Suspense>
            </div>
          </main>
          <SiteLegalFooter />
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogout}
        message="Are you sure you want to end your session?"
      />
    </div>
  );
}
