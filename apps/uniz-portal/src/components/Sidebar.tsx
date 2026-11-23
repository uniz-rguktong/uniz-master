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
  Lock,
  Home,
  HelpCircle,
  ClipboardCheck,
  PanelLeft,
  MoreHorizontal,
} from "lucide-react";
import { Error } from "../App";
import { ConfirmModal } from "./ConfirmPopup";
import {
  StudentPageSkeleton,
  studentContentSkeletonVariant,
} from "./StudentPageSkeleton";
import { NotificationBellButton } from "./NotificationBellButton";
import { AppIcon, Lockup } from "@/components/brand/Mark";
import { Avatar } from "@/components/ui/avatar";
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

type NavItem = {
  id: string;
  label: string;
  href: string;
  content: MainContent["content"];
  icon: typeof Home;
  section: "top" | "academics" | "account";
};

export default function Sidebar({ content }: MainContent) {
  useIsAuth();
  useStudentData();
  const userData = useRecoilValue<any>(student);
  const navigate = useNavigate();
  const mainRef = useRef<HTMLDivElement>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showNotice, setShowNotice] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      // If pulled down more than 150px while at the top
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

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Home",
      href: "/student",
      content: "dashboard",
      icon: Home,
      section: "top",
    },
    ...(enableOutingsAndOutpasses
      ? [
          {
            id: "outing",
            label: "Outing Requests",
            href: "/student/outing",
            content: "outing" as const,
            icon: Clock,
            section: "academics" as const,
          },
          {
            id: "outpass",
            label: "Outpass Requests",
            href: "/student/outpass",
            content: "outpass" as const,
            icon: CalendarDays,
            section: "academics" as const,
          },
        ]
      : []),
    {
      id: "registration",
      label: "Registration",
      href: "/student/registration",
      content: "registration",
      icon: ClipboardCheck,
      section: "academics",
    },
    {
      id: "gradehub",
      label: "Results",
      href: "/student/gradehub",
      content: "gradehub",
      icon: GraduationCap,
      section: "academics",
    },
    {
      id: "attendance",
      label: "Attendance",
      href: "/student/attendance",
      content: "attendance",
      icon: CalendarCheck,
      section: "academics",
    },
    {
      id: "resetpassword",
      label: "Password",
      href: "/student/resetpassword",
      content: "resetpassword",
      icon: Lock,
      section: "account",
    },
    {
      id: "grievance",
      label: "Grievance",
      href: "/student/grievance",
      content: "grievance",
      icon: AlertCircle,
      section: "account",
    },
    {
      id: "help",
      label: "Help",
      href: "/student/help",
      content: "help",
      icon: HelpCircle,
      section: "account",
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

  const pageName =
    navItems.find((item) => item.content === content)?.label ??
    (content === "notifications" ? "Notifications" : "uniZ");

  const moreItems = navItems.filter((item) => item.section === "account" || item.id === "outing" || item.id === "outpass");
  const moreActive = moreItems.some((item) => item.content === content);

  const go = (href: string) => {
    setMoreOpen(false);
    setMenuOpen(false);
    navigate(href);
  };

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = content === item.content;
    return (
      <button
        key={item.id}
        type="button"
        title={collapsed ? item.label : undefined}
        onClick={() => go(item.href)}
        className={cn(
          "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-dense transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          collapsed && "justify-center px-0",
          active ? "bg-navy-800 font-semibold text-white" : "font-medium text-navy-300 hover:bg-white/[0.06] hover:text-white",
        )}
      >
        <Icon size={18} strokeWidth={1.75} aria-hidden />
        {collapsed ? null : <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  const section = (name: string, items: NavItem[]) =>
    items.length ? (
      <div>
        {collapsed ? null : (
          <p className="px-3 pb-2 pt-6 text-small font-medium text-navy-300">{name}</p>
        )}
        <div className="flex flex-col gap-0.5">{items.map(renderItem)}</div>
      </div>
    ) : null;

  const tabs = [
    { label: "Home", icon: Home, href: "/student", active: content === "dashboard" },
    { label: "Registration", icon: ClipboardCheck, href: "/student/registration", active: content === "registration" },
    { label: "Results", icon: GraduationCap, href: "/student/gradehub", active: content === "gradehub" },
    { label: "Attendance", icon: CalendarCheck, href: "/student/attendance", active: content === "attendance" },
  ];

  return (
    <div className="min-h-screen bg-bg text-text">
      {!enableOutingsAndOutpasses && showNotice ? (
        <div className="flex items-center gap-3 border-b border-border bg-tint px-4 py-3 text-small text-text-2">
          <p className="flex-1 text-center">
            Outpass and outing feature has been currently disabled by the administration
          </p>
          <button
            type="button"
            onClick={() => setShowNotice(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Dismiss notice"
          >
            <X size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      ) : null}

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-40 hidden flex-col border-r border-[var(--sb-border)] bg-navy-900 min-[821px]:flex",
          collapsed ? "w-[72px]" : "w-[248px]",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-[var(--sb-div)]",
            collapsed ? "justify-center px-2" : "pl-5 pr-3",
          )}
        >
          {collapsed ? (
            <AppIcon title="uniZ" />
          ) : (
            <Lockup height={32} tone="chrome" title="uniZ" />
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Student">
          {navItems.filter((item) => item.section === "top").map(renderItem)}
          {section("Academics", navItems.filter((item) => item.section === "academics"))}
          {section("Account", navItems.filter((item) => item.section === "account"))}
        </nav>
        <div className="border-t border-[var(--sb-div)] p-3">
          <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
            <Avatar
              size={36}
              src={userData?.profile_url}
              alt={userData?.name ? `${userData.name} profile photo` : "Student profile photo"}
              name={userData?.name || "Student"}
            />
            {collapsed ? null : (
              <div className="min-w-0 flex-1">
                <p className="truncate text-dense font-semibold text-white">
                  {userData?.name || "Student"}
                </p>
                <p className="truncate text-small text-navy-300">
                  {userData?.email || "Student"}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-navy-300 hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label="Log out"
            >
              <LogOut size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mt-2 flex h-10 w-full items-center justify-center rounded-md text-navy-300 hover:bg-white/[0.06] hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </aside>

      <div className={cn("flex min-h-screen flex-col", collapsed ? "min-[821px]:pl-[72px]" : "min-[821px]:pl-[248px]")}>
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between bg-navy-900 px-4 text-white min-[821px]:hidden">
          <span className="text-white">
            <AppIcon title="uniZ" />
          </span>
          <p className="truncate px-3 text-[17px] font-semibold leading-6">{pageName}</p>
          <div className="flex items-center gap-1">
            <NotificationBellButton tone="chrome" active={content === "notifications"} />
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Account menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            >
              <Avatar
                size={32}
                src={userData?.profile_url}
                alt=""
                name={userData?.name || "Student"}
              />
            </button>
          </div>
        </header>

        <header className="sticky top-0 z-30 hidden h-16 items-center justify-end gap-2 border-b border-border bg-bg px-10 min-[821px]:flex">
          <NotificationBellButton active={content === "notifications"} />
          <button
            type="button"
            className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Avatar
              size={36}
              src={userData?.profile_url}
              alt={userData?.name ? `${userData.name} profile photo` : "Student profile photo"}
              name={userData?.name || "Student"}
            />
          </button>
        </header>

        {menuOpen ? (
          <div className="fixed right-4 top-16 z-50 w-56 rounded-lg border border-border bg-surface p-2 shadow-md dark:shadow-none min-[821px]:right-10">
            <p className="px-3 py-2 text-dense font-semibold text-head">{userData?.name || "Student"}</p>
            <p className="px-3 pb-2 text-small text-text-2">{userData?.email || ""}</p>
            <button
              type="button"
              className="flex h-10 w-full items-center rounded-sm px-3 text-left text-dense font-medium text-text-2 hover:bg-tint"
              onClick={() => setShowConfirm(true)}
            >
              Log out
            </button>
          </div>
        ) : null}

        <main ref={mainRef} className="flex-1 px-4 py-6 pb-[calc(68px+16px+env(safe-area-inset-bottom))] min-[821px]:px-10 min-[821px]:py-8 min-[821px]:pb-10">
          <Suspense fallback={<ContentSkeleton content={content} />}>
            {contentMap[content] || <Error />}
          </Suspense>
        </main>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-[68px] items-end justify-around bg-navy-900 px-1 pb-[max(8px,env(safe-area-inset-bottom))] min-[821px]:hidden"
        aria-label="Student"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => go(tab.href)}
              className={cn(
                "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-caption font-medium",
                tab.active ? "text-white" : "text-navy-300",
              )}
            >
              <span className={cn("flex h-7 w-14 items-center justify-center rounded-full", tab.active && "bg-navy-800")}>
                <Icon size={22} strokeWidth={1.75} aria-hidden />
              </span>
              {tab.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((value) => !value)}
          className={cn(
            "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 text-caption font-medium",
            moreActive ? "text-white" : "text-navy-300",
          )}
        >
          <span className={cn("flex h-7 w-14 items-center justify-center rounded-full", moreActive && "bg-navy-800")}>
            <MoreHorizontal size={22} strokeWidth={1.75} aria-hidden />
          </span>
          More
        </button>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 min-[821px]:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-overlay"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-[68px] rounded-t-xl border border-border bg-surface p-3 pb-4">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-border-strong" />
            {moreItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.href)}
                  className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-dense font-medium text-text hover:bg-tint"
                >
                  <Icon size={18} strokeWidth={1.75} aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogout}
        message="Are you sure you want to end your session?"
      />
    </div>
  );
}
