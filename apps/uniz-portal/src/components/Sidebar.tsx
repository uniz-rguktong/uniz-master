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
  ChevronDown,
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
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeGroup, setActiveGroup] = useState<
    "student" | "academic" | "campus"
  >("student");

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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    <div className="flex flex-col md:flex-row min-h-screen bg-premium-gradient text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Top Header */}
      <div
        className={`md:hidden sticky top-0 left-0 right-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-3.5 flex items-center justify-between premium-shadow ${isOpen ? "hidden" : "flex"}`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-1.5 -ml-1 hover:bg-slate-100 rounded-lg transition-colors active:scale-90"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6 text-slate-700" />
          </button>
          <h1 className="font-bold text-slate-900 text-[19px] tracking-tight">
            RGUKT Ongole
          </h1>
        </div>

        {/* Profile Icon with Popup Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowProfilePopup(!showProfilePopup)}
            className="w-10 h-10 rounded-full bg-white p-[2px] border border-blue-100 shadow-sm overflow-hidden active:scale-95 transition-all"
          >
            {userData?.profile_url ? (
              <img
                src={userData.profile_url}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-semibold text-xs uppercase rounded-full">
                {userData?.name?.charAt(0) || "S"}
              </div>
            )}
          </button>

          {/* Profile Popup */}
          {showProfilePopup && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowProfilePopup(false)}
              />
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-5 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="flex flex-col gap-1.5 mb-5">
                  <span className="text-[17px] font-semibold text-slate-900 leading-tight">
                    {userData?.name || "Student"}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-tighter">
                      Year {userData?.year || "N/A"} •{" "}
                      {userData?.branch || "General"}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {userData?.email || ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowConfirm(true);
                    setShowProfilePopup(false);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-red-50 text-red-600 rounded-full font-semibold text-sm hover:bg-red-100 transition-colors border border-red-100/50"
                >
                  <LogOut className="w-4 h-4" />
                  Logout Account
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Redesigned for Mobile (Unstop Style) & Classic for Desktop */}
      <div
        className={`
          fixed top-0 left-0 h-screen z-40 transition-all duration-300 ease-in-out flex
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          w-full max-w-[320px] md:max-w-none md:w-72
          md:translate-x-0 md:sticky md:top-0 md:z-auto
          ${isOpen ? "bg-[#EBF5FF] md:bg-white/70" : "bg-white/70"}
          md:backdrop-blur-xl md:border-r md:border-white/50 premium-shadow
        `}
      >
        {/* MOBILE VIEW NAVIGATION (Unstop Style) */}
        <div className="flex w-full h-full md:hidden">
          {/* Left Strip - Refined with Light Blue Motif */}
          <div className="w-[72px] bg-[#EBF5FF] flex flex-col items-center py-6 relative z-10">
            {/* Logo - Transparent & Larger */}
            <div className="w-12 h-12 mb-6 mt-3 overflow-hidden">
              <img
                src="/assets/ongole_logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Icons List with Active 'Tab' Effect */}
            <div className="flex-1 w-full flex flex-col items-center space-y-2 mt-2">
              <button
                onClick={() => setActiveGroup("student")}
                className="w-full flex flex-col items-center group py-1"
              >
                <div className="w-full relative flex flex-col items-center py-1">
                  {activeGroup === "student" && (
                    <>
                      {/* The Merge Tab Background - Sliver Selective */}
                      <div className="absolute right-[-2px] top-0 bottom-0 left-3 bg-white rounded-l-[1.2rem] z-0 shadow-[-5px_0_15px_rgba(0,0,0,0.03)]" />
                      {/* Inverted Radius Top */}
                      <div className="absolute right-[-2px] top-[-10px] w-2.5 h-2.5 bg-white z-0">
                        <div className="w-full h-full bg-[#EBF5FF] rounded-br-[10px]" />
                      </div>
                      {/* Inverted Radius Bottom */}
                      <div className="absolute right-[-2px] bottom-[-10px] w-2.5 h-2.5 bg-white z-0">
                        <div className="w-full h-full bg-[#EBF5FF] rounded-tr-[10px]" />
                      </div>
                    </>
                  )}
                  <div
                    className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all group-active:scale-95 ${activeGroup === "student" ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
                  >
                    <img
                      src="/assets/student.png"
                      alt="Student"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold transition-colors mt-1 ${activeGroup === "student" ? "text-slate-900" : "text-slate-500"}`}
                >
                  Student
                </span>
              </button>

              <button
                onClick={() => setActiveGroup("academic")}
                className="w-full flex flex-col items-center group py-1"
              >
                <div className="w-full relative flex flex-col items-center py-1">
                  {activeGroup === "academic" && (
                    <>
                      <div className="absolute right-[-2px] top-0 bottom-0 left-3 bg-white rounded-l-[1.2rem] z-0 shadow-[-5px_0_15px_rgba(0,0,0,0.03)]" />
                      <div className="absolute right-[-2px] top-[-10px] w-2.5 h-2.5 bg-white z-0">
                        <div className="w-full h-full bg-[#EBF5FF] rounded-br-[10px]" />
                      </div>
                      <div className="absolute right-[-2px] bottom-[-10px] w-2.5 h-2.5 bg-white z-0">
                        <div className="w-full h-full bg-[#EBF5FF] rounded-tr-[10px]" />
                      </div>
                    </>
                  )}
                  <div
                    className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all group-active:scale-95 ${activeGroup === "academic" ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
                  >
                    <img
                      src="/assets/academics.png"
                      alt="Academic"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold transition-colors mt-1 ${activeGroup === "academic" ? "text-slate-900" : "text-slate-500"}`}
                >
                  Academic
                </span>
              </button>

              <button
                onClick={() => setActiveGroup("campus")}
                className="w-full flex flex-col items-center group py-1"
              >
                <div className="w-full relative flex flex-col items-center py-1">
                  {activeGroup === "campus" && (
                    <>
                      <div className="absolute right-[-2px] top-0 bottom-0 left-3 bg-white rounded-l-[1.2rem] z-0 shadow-[-5px_0_15px_rgba(0,0,0,0.03)]" />
                      <div className="absolute right-[-2px] top-[-10px] w-2.5 h-2.5 bg-white z-0">
                        <div className="w-full h-full bg-[#EBF5FF] rounded-br-[10px]" />
                      </div>
                      <div className="absolute right-[-2px] bottom-[-10px] w-2.5 h-2.5 bg-white z-0">
                        <div className="w-full h-full bg-[#EBF5FF] rounded-tr-[10px]" />
                      </div>
                    </>
                  )}
                  <div
                    className={`relative z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all group-active:scale-95 ${activeGroup === "campus" ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
                  >
                    <img
                      src="/assets/campus.png"
                      alt="Campus"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold transition-colors mt-1 ${activeGroup === "campus" ? "text-slate-900" : "text-slate-500"}`}
                >
                  Campus
                </span>
              </button>
            </div>

            {/* Bottom Left Actions - Aligned with Profile Banner */}
            <div className="mt-auto flex flex-col items-center space-y-8 pb-5">
              <button
                onClick={() => {
                  setShowConfirm(true);
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 rounded-full bg-white p-[1px] shadow-sm border border-blue-100 overflow-hidden">
                {userData?.profile_url ? (
                  <img
                    src={userData.profile_url}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-black text-sm uppercase rounded-full">
                    {userData?.name?.charAt(0) || "S"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Floating Card Menu - Optimized Height */}
          <div className="flex-1 py-3 pr-3 overflow-y-auto flex flex-col">
            <div className="bg-white rounded-[2rem] h-[87%] shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-white p-4 flex flex-col relative z-20">
              {/* Primary Action Button - Unstop style */}
              <button
                onClick={() => {
                  navigate("/student");
                  setIsOpen(false);
                }}
                className="w-full py-2.5 mb-2 px-6 rounded-full bg-[#EBF5FF] border border-blue-400/30 text-blue-800 font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-blue-100 transition-all active:scale-[0.98] shadow-sm"
              >
                RGUKT Ongole
              </button>

              {/* Navigation List */}
              <div className="flex-1 space-y-1 py-4 overflow-y-auto hide-scrollbar">
                {navItems
                  .filter((item) => {
                    if (activeGroup === "student") {
                      return [
                        "dashboard",
                        "outing",
                        "outpass",
                        "grievance",
                        "resetpassword",
                      ].includes(item.id);
                    }
                    if (activeGroup === "academic") {
                      return ["attendance", "gradehub"].includes(item.id);
                    }
                    if (activeGroup === "campus") {
                      return ["campushub", "studyspace"].includes(item.id);
                    }
                    return true;
                  })
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = content === item.content;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(item.href);
                          setIsOpen(false);
                        }}
                        className={`
                        w-full flex items-center gap-4 px-5 py-3 rounded-full transition-all
                        ${isActive
                            ? "bg-blue-50 text-blue-700 shadow-sm"
                            : "text-slate-600 hover:bg-slate-50"
                          }
                      `}
                      >
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                        />
                        <span
                          className={`text-[15px] text-left whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}
                        >
                          {item.label}
                        </span>
                        {(item.id === "dashboard" ||
                          item.id === "requestOuting") && (
                            <ChevronDown className="w-4 h-4 ml-auto text-slate-300" />
                          )}
                      </button>
                    );
                  })}
              </div>
            </div>
            <div className="mt-auto px-1 pb-4">
              <div className="rounded-2xl py-3.5 px-3 flex items-center gap-3 relative overflow-hidden">
                {/* Subtle Pattern Overlay Effect */}

                <div className="flex flex-col relative z-10 justify-center">
                  <span className="text-[18px] font-black text-slate-800 leading-none">
                    {userData?.name || "Student"}
                  </span>
                  <span className="text-[11px] font-bold text-blue-500 uppercase tracking-tighter mt-1">
                    Student Portal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DESKTOP VIEW SIDEBAR (Existing Classic Design) */}
        <div className="hidden md:flex md:flex-col w-full h-full">
          {/* Header with logo and collapse button */}
          <div className="flex items-center justify-between p-6 bg-transparent">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 flex items-center justify-center p-1">
                <img
                  src="/assets/ongole_logo.png"
                  className="h-full w-full object-contain"
                  alt="Ongole Logo"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-[19px] tracking-tight leading-none">
                  Ongole
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-blue-600/70 font-bold mt-1.5 px-0.5">
                  Student Portal
                </span>
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
                      w-full flex items-center space-x-3 px-4 py-3 rounded-full text-left transition-all duration-200 group relative
                      ${isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-50"
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
                        <span
                          className={`text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}
                        >
                          {item.label}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom section with profile and logout */}
          <div className="mt-auto px-3 py-4 space-y-1 border-t border-slate-50">
            {/* Profile Section */}
            <div className="">
              <div className="flex items-center px-3 py-2 transition-all duration-300 group">
                <div className="flex items-center justify-center min-w-[24px]">
                  <div className="w-[22px] h-[22px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                    {userData?.profile_url ? (
                      <img
                        src={userData.profile_url}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-700 font-bold text-[10px]">
                        {userData?.name?.charAt(0) || "S"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 ml-3">
                  <p className="text-[15px] font-semibold text-slate-900 truncate tracking-tight">
                    {userData?.name || "Student"}
                  </p>
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
      </div>

      {/* Main Content Area */}
      <main className="flex-1 transition-all duration-300 ease-in-out">
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
      {!isOpen && (
        <div
          className={`md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[72%] max-w-[280px] transition-all duration-500 ease-in-out ${isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-24 opacity-0 pointer-events-none"
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
              <span className="text-[9px] font-bold uppercase tracking-tight">
                Outpass
              </span>
            </button>

            {/* Results Option (Center) */}
            <button
              onClick={() => navigate("/student/gradehub")}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${content === "gradehub" ? "text-blue-600" : "text-slate-400"
                }`}
            >
              <GraduationCap className="h-6 w-6" />
              <span className="text-[9px] font-bold uppercase tracking-tight">
                Results
              </span>
            </button>

            {/* Settings Option */}
            <button
              onClick={() => navigate("/student/resetpassword")}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${content === "resetpassword" ? "text-blue-600" : "text-slate-400"
                }`}
            >
              <KeyRound className="h-6 w-6" />
              <span className="text-[9px] font-bold uppercase tracking-tight">
                Settings
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
