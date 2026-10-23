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
} from "lucide-react";
import { Error } from "../App";
import { ConfirmModal } from "./ConfirmPopup";
import { motion, AnimatePresence } from "framer-motion";
import { Dock } from "./ui/dock-two";
import { InteractiveMenu, InteractiveMenuItem } from "./ui/modern-mobile-menu";
import {
  StudentPageSkeleton,
  studentContentSkeletonVariant,
} from "./StudentPageSkeleton";
import { NotificationBellButton } from "./NotificationBellButton";
import {
  studentDesktopHeaderClass,
  studentLogoClass,
  studentMobileHeaderClass,
  studentShellClass,
} from "@/lib/student-ui";
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
      label: "Register",
      icon: ClipboardCheck,
      onClick: () => navigate("/student/registration"),
      isActive: content === "registration",
    },
    // Center tab — toggles academics panel
    { label: "Academics", icon: GraduationCap },
    {
      label: "Grievance",
      icon: AlertCircle,
      onClick: () => navigate("/student/grievance"),
      isActive: content === "grievance",
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
      description: "Grades, SGPA & transcripts",
      onClick: () => navigate("/student/gradehub"),
      isActive: content === "gradehub",
    },
    {
      label: "Attendance",
      icon: CalendarCheck,
      description: "Subject-wise attendance",
      onClick: () => navigate("/student/attendance"),
      isActive: content === "attendance",
    },
    {
      label: "Security",
      icon: Lock,
      description: "Change your password",
      onClick: () => navigate("/student/resetpassword"),
      isActive: content === "resetpassword",
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

  return (
    <div className={cn(studentShellClass)}>
      <AnimatePresence>
        {!enableOutingsAndOutpasses && showNotice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="portal-banner-gradient text-white py-2.5 px-6 flex items-center justify-between relative z-[100]"
          >
            <div className="flex-1 text-center text-[11px] md:text-[13px] font-sans font-bold tracking-tight">
              Outpass and outing feature has been currently disabled by the
              administration
            </div>
            <button
              onClick={() => setShowNotice(false)}
              className="p-1 hover:bg-white/20 rounded-portal-sm transition-colors shrink-0"
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
            className="shadow-whisper border-navy-200"
          />
        </div>

        {/* Main Content Area */}
        <main
          ref={mainRef}
          className="flex-1 md:overflow-y-auto md:max-h-screen"
        >
          {/* Mobile Header — ExamCell navy chrome */}
          <header className={cn(studentMobileHeaderClass, "px-6")}>
            <h1 className={studentLogoClass}>UNIZ</h1>
            <div className="flex items-center gap-2">
              <NotificationBellButton
                size="sm"
                active={content === "notifications"}
                className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20 hover:!text-white"
              />
              <button
                onClick={() => setShowConfirm(true)}
                className="p-2 transition-colors font-sans text-white/80 active:text-white"
                aria-label="Log out"
              >
                <LogOut size={22} />
              </button>
            </div>
          </header>

          {/* Desktop Header — ExamCell navy chrome */}
          <header className={cn(studentDesktopHeaderClass, "px-8 md:pl-36")}>
            <div className="flex items-center gap-4">
              <h1 className={studentLogoClass}>UNIZ</h1>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBellButton
                active={content === "notifications"}
                className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20 hover:!text-white"
              />
              <div className="text-right hidden sm:block">
                <p className="text-[14px] font-bold text-white leading-none font-sans">
                  {userData?.name || "Student User"}
                </p>
                <p className="text-[11px] font-semibold text-white/70 mt-1 lowercase tracking-tight font-form">
                  {userData?.email || "N/A"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-portal-sm ring-1 ring-white/25 border border-white/20 overflow-hidden">
                {userData?.profile_url ? (
                  <img
                    src={userData.profile_url}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/15 text-white font-bold text-xs font-sans">
                    {userData?.name?.charAt(0) || "S"}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="w-10 h-10 flex items-center justify-center bg-white/10 text-white/80 hover:text-white hover:bg-white/15 rounded-portal-sm border border-white/15 transition-colors ml-2"
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <div className="pt-4 px-4 pb-32 md:p-10 md:ml-28 min-h-full bg-[#FAFAFA]">
            {content !== "dashboard" && (
              <div className="md:hidden mb-6">
                <button
                  onClick={() => navigate("/student")}
                  className="flex items-center gap-1 text-navy-500 font-bold text-[10px] tracking-[0.14em] py-2 font-sans"
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
            moreTitle="Academics"
          />
        </div>
      </div>
    </div>
  );
}
