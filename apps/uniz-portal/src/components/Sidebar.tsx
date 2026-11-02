import { useRecoilValue } from "recoil";
import { student } from "../store";
import { useNavigate } from "react-router-dom";
import { useIsAuth } from "../hooks/is_authenticated";
import { useLogout } from "../hooks/useLogout";
import { useStudentData } from "../hooks/student_info";
import { useState, useEffect, lazy, Suspense, useRef, type ReactElement } from "react";
import { enableOutingsAndOutpasses } from "@/config/featureFlags";
import { isModuleEnabled } from "@/lib/flags";
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
  MessageSquare,
  Wallet,
  BookOpen,
  Briefcase,
  Info,
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
  ANDROID_APK_FILENAME,
  ANDROID_APK_URL,
  openIosDownloadModal,
} from "../lib/androidApp";
import { AndroidLogo, AppleLogo } from "./DownloadAppBanner";
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
const MyLibrary = lazy(() => import("../pages/library/MyLibrary"));
const StudentPlacement = lazy(() => import("../pages/student/placement/StudentPlacement"));
const AlumniHome = lazy(() => import("../pages/alumni/AlumniHome"));
const StudentInfo = lazy(() => import("../pages/info/StudentInfo"));
const StudentFees = lazy(() => import("../pages/student/fees/StudentFees"));
const StudentFeedback = lazy(
  () => import("../pages/student/feedback/StudentFeedback"),
);
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
    | "feedback"
    | "fees"
    | "info"
    | "alumni"
    | "placement"
    | "library"
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
  const [showNotice, setShowNotice] = useState(false);
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

    ...(isModuleEnabled("LIBRARY")
      ? [
          {
            id: "library",
            label: "Library",
            href: "/student/library",
            content: "library" as const,
            icon: BookOpen,
            activeColor: "text-navy-900",
            hoverColor: "hover:text-navy-700",
          },
        ]
      : []),
    ...(isModuleEnabled("PLACEMENT")
      ? [
          {
            id: "placement",
            label: "Placements",
            href: "/student/placement",
            content: "placement" as const,
            icon: Briefcase,
            activeColor: "text-navy-900",
            hoverColor: "hover:text-navy-700",
          },
        ]
      : []),
    ...(isModuleEnabled("ALUMNI")
      ? [
          {
            id: "alumni",
            label: "Alumni",
            href: "/student/alumni",
            content: "alumni" as const,
            icon: GraduationCap,
            activeColor: "text-navy-900",
            hoverColor: "hover:text-navy-700",
          },
        ]
      : []),
    ...(isModuleEnabled("INFO_CENTRE")
      ? [
          {
            id: "info",
            label: "Info Centre",
            href: "/student/info",
            content: "info" as const,
            icon: Info,
            activeColor: "text-navy-900",
            hoverColor: "hover:text-navy-700",
          },
        ]
      : []),
    ...(isModuleEnabled("FEES")
      ? [
          {
            id: "fees",
            label: "Fees",
            href: "/student/fees",
            content: "fees" as const,
            icon: Wallet,
            activeColor: "text-navy-900",
            hoverColor: "hover:text-navy-700",
          },
        ]
      : []),
    ...(isModuleEnabled("FEEDBACK")
      ? [
          {
            id: "feedback",
            label: "Feedback",
            href: "/student/feedback",
            content: "feedback" as const,
            icon: MessageSquare,
            activeColor: "text-navy-900",
            hoverColor: "hover:text-navy-700",
          },
        ]
      : []),
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
    feedback: <StudentFeedback />,
    fees: <StudentFees />,
    "info": <StudentInfo />,
    "alumni": <AlumniHome />,
    "placement": <StudentPlacement />,
    library: <MyLibrary kind="student" />,
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

      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#021227]/[0.96] px-4 text-white backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-[#021227]/[0.94] md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 -ml-2 items-center justify-center rounded-xl transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:hidden"
            onClick={() => setDrawerOpen((open) => !open)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <a href="/" className="flex items-center gap-2.5 text-white no-underline">
            <img
              src="/logo.png"
              alt="UniZ — RGUKT Ongole"
              className="h-8 w-8 shrink-0 rounded-full bg-white object-contain ring-1 ring-white/25 shadow-sm"
            />
            <span className="text-[15px] font-semibold tracking-[-0.01em]">Exam Cell</span>
            <span className="hidden h-5 w-px bg-white/20 lg:block" aria-hidden="true" />
            <span className="hidden text-[13px] font-medium text-white/60 lg:block">
              {navItems.find((n) => n.content === content)?.label}
            </span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBellButton
            size="sm"
            active={content === "notifications"}
            className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20 hover:!text-white"
          />
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-semibold leading-none tabular-nums">
              {userData?.username || "Student"}
            </p>
            <p className="mt-1 text-[11px] font-medium text-white/60">
              {UNIZ_CAMPUS_LABEL}
            </p>
          </div>
          <div className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/20">
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
            className="fixed inset-0 z-40 bg-[#021227]/50 backdrop-blur-[2px] md:hidden"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        <aside
          className={cn(
            "z-50 flex w-[248px] shrink-0 flex-col border-r border-[#E6EAF0] bg-white md:sticky md:top-14 md:h-[calc(100vh-56px)]",
            drawerOpen ? "fixed top-14 bottom-16 left-0 rounded-r-2xl shadow-[0_24px_48px_-12px_rgba(2,18,39,0.45)]" : "hidden md:flex",
          )}
        >
          <nav className="flex-1 space-y-0.5 overflow-y-auto py-5" aria-label="Student">
            <p className="px-6 pb-3 text-[12px] font-medium text-[#64748B]">Navigation</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = content === item.content;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.href)}
                  aria-current={active ? "page" : undefined}
                  className={cn(portalSidebarItemClass, active && portalSidebarItemActiveClass)}
                >
                  <Icon size={18} strokeWidth={active ? 2 : 1.75} className={active ? "text-[#0A2540]" : "text-[#94A3B8] transition-colors duration-150 group-hover:text-[#0A2540]"} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mx-3 mb-3 grid grid-cols-2 gap-2 border-t border-[#EEF1F5] pt-4">
            <a
              href={ANDROID_APK_URL}
              download={ANDROID_APK_FILENAME}
              title="Download Android App (.apk)"
              className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 text-[11px] font-bold uppercase tracking-[0.04em] text-[#0A2540] transition-colors duration-150 hover:border-[#0A2540] hover:bg-[#0A2540] hover:text-white"
            >
              <AndroidLogo className="h-3.5 w-3.5 shrink-0" />
              <span>Android</span>
            </a>
            <button
              type="button"
              onClick={openIosDownloadModal}
              title="Download iOS App"
              className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 text-[11px] font-bold uppercase tracking-[0.04em] text-[#0A2540] transition-colors duration-150 hover:border-[#0A2540] hover:bg-[#0A2540] hover:text-white"
            >
              <AppleLogo className="h-3.5 w-3.5 shrink-0" />
              <span>iOS App</span>
            </button>
          </div>
          <button type="button" onClick={() => setShowConfirm(true)} className={portalLogoutPillClass}>
            <LogOut size={14} />
            Logout
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[#F7F8FA]">
          <main ref={mainRef} className="flex-1 pb-20 md:pb-0">
            <div className="mx-auto min-h-full w-full max-w-[1200px] px-4 py-6 md:px-10 md:py-10">
              {content !== "dashboard" && (
                <div className="mb-4 md:hidden">
                  <button
                    onClick={() => navigate("/student")}
                    aria-label="Back to dashboard"
                    className="-ml-2 flex h-11 items-center gap-1 rounded-xl px-2 font-sans text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#0A2540]/[0.04] hover:text-[#0A2540]"
                  >
                    <ChevronLeft size={18} strokeWidth={2} />
                    Dashboard
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

      <nav
        aria-label="Student quick links"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#E6EAF0] bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
      >
        {navItems
          .filter((n) => ["dashboard", "registration", "gradehub", "attendance"].includes(n.content))
          .map((item) => {
            const Icon = item.icon;
            const active = content === item.content;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0A2540]",
                  active ? "text-[#0A2540] font-semibold" : "text-[#64748B]",
                )}
              >
                {active && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-[#EA2027]" aria-hidden="true" />}
                <span className={cn("flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150", active && "bg-[#0A2540]/[0.07]")}>
                  <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                </span>
                {item.label}
              </button>
            );
          })}
        <button
          type="button"
          onClick={() => setDrawerOpen((open) => !open)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          className={cn(
            "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
            drawerOpen ? "text-[#0A2540]" : "text-[#64748B]",
          )}
        >
          <span className={cn("flex h-8 w-12 items-center justify-center rounded-full", drawerOpen && "bg-[#0A2540]/[0.08]")}>
            <Menu size={20} />
          </span>
          Menu
        </button>
      </nav>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogout}
        message="Are you sure you want to end your session?"
      />
    </div>
  );
}
