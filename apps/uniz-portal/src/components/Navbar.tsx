import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useState } from "react";
import { useStudentData } from "../hooks/student_info";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  Code,
  Cpu,
  Settings,
  Zap,
  Building,
  MapPin,
  ShieldCheck,
  GraduationCap,
  Mail,
  ExternalLink,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from "lucide-react";

const NavItem = ({ label, hasDropdown, activeDropdown, setActiveDropdown, menuData, navigate }: any) => (
  <div
    className="relative"
    onMouseEnter={() => hasDropdown && setActiveDropdown(label)}
    onMouseLeave={() => hasDropdown && setActiveDropdown(null)}
  >
    <button
      className={`flex items-center gap-1.5 px-4 py-2 text-[14px] font-semibold transition-all duration-300 ${activeDropdown === label ? "text-slate-900 bg-slate-50 rounded-lg" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50 rounded-lg"
        }`}
    >
      {label}
      {hasDropdown && (
        <ChevronDown
          size={13}
          className={`transition-transform duration-300 ${activeDropdown === label ? "rotate-180" : ""}`}
        />
      )}
    </button>

    <AnimatePresence>
      {activeDropdown === label && hasDropdown && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute left-1/2 -translate-x-1/2 top-full pt-3 z-[100]"
        >
          <div className={`bg-white rounded-[28px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-100 p-6 ${label === "Departments" ? "w-[840px]" : "w-[640px]"}`}>
            <div className={`grid gap-2 ${label === "Departments" ? "grid-cols-3" : "grid-cols-2"}`}>
              {menuData[label]?.map((item: any) => (
                <button
                  key={item.title}
                  onClick={() => {
                    navigate(item.path);
                    setActiveDropdown(null);
                  }}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group text-left"
                >
                  <div className="mt-0.5 p-2 bg-slate-50 border border-slate-100/50 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all text-slate-400 group-hover:text-slate-900 shrink-0">
                    <item.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-slate-900 mb-0.5 flex items-center gap-1.5">
                      {item.title}
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                    </h4>
                    <p className="text-[12px] text-slate-500 font-medium leading-normal line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function Navbar() {
  const [isAuth, setAuth] = useRecoilState(is_authenticated);
  const user = useRecoilValue(student);
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useStudentData();

  const logout = () => {
    localStorage.removeItem("student_token");
    localStorage.removeItem("username");
    localStorage.removeItem("admin_token");
    setAuth({ is_authnticated: false, type: "" });
    navigate("/");
  };

  const isAuthenticated =
    (isAuth.is_authnticated &&
      isAuth.type === "student" &&
      localStorage.getItem("student_token")) ||
    (localStorage.getItem("student_token") && user);

  const menuData: any = {
    Academics: [
      {
        title: "Faculty",
        desc: "Meet our dedicated academic experts and researchers.",
        icon: Users,
        path: "/academics/faculty",
      },
      {
        title: "Rules & Regulations",
        desc: "Comprehensive guidelines for institutional conduct.",
        icon: BookOpen,
        path: "/academics/rules",
      },
      {
        title: "Academic Calendar",
        desc: "Key dates and milestones for the academic year.",
        icon: Calendar,
        path: "/academics/calendar",
      },
      {
        title: "Exam Cell",
        desc: "Examination schedules, results, and notifications.",
        icon: ClipboardList,
        path: "/examcell",
      },
    ],
    Departments: [
      {
        title: "Computer Science",
        desc: "Innovating the future of engineering and AI.",
        icon: Code,
        path: "/departments/cse",
      },
      {
        title: "Electronics & Comm.",
        desc: "Advancing communication technologies.",
        icon: Cpu,
        path: "/departments/ece",
      },
      {
        title: "Mechanical Eng.",
        desc: "Engineering the physical world of tomorrow.",
        icon: Settings,
        path: "/departments/mech",
      },
      {
        title: "Electrical Eng.",
        desc: "Powering systems and sustainable energy.",
        icon: Zap,
        path: "/departments/eee",
      },
      {
        title: "Civil Engineering",
        desc: "Building sustainable infrastructure.",
        icon: Building,
        path: "/departments/civil",
      },
    ],
    Campus: [
      {
        title: "Infrastructure",
        desc: "Explore our state-of-the-art campus facilities.",
        icon: MapPin,
        path: "/institute/campus",
      },
      {
        title: "Administration",
        desc: "Our leadership and organizational structure.",
        icon: ShieldCheck,
        path: "/institute/administration",
      },
      {
        title: "Alumni Network",
        desc: "Connecting with our global community.",
        icon: GraduationCap,
        path: "/institute/alumni",
      },
      {
        title: "Contact Us",
        desc: "Get in touch with our institutional helpdesk.",
        icon: Mail,
        path: "/contact-us",
      },
    ],
  };

  return (
    <header className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center justify-center bg-transparent shrink-0">
              <span className="unifrakturcook-bold text-3xl text-slate-800 tracking-tight leading-none">
                uniZ
              </span>
            </div>
          </Link>

          {/* Nav Menu Items */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavItem
              label="Academics"
              hasDropdown
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              menuData={menuData}
              navigate={navigate}
            />
            <NavItem
              label="Departments"
              hasDropdown
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              menuData={menuData}
              navigate={navigate}
            />
            <NavItem
              label="Campus"
              hasDropdown
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
              menuData={menuData}
              navigate={navigate}
            />
            <button
              onClick={() => navigate("/examcell")}
              className="px-4 py-2 text-[14px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all rounded-lg"
            >
              Exams
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/student/profile")}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 transition-all group"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                  {user?.profile_url ? (
                    <img src={user.profile_url} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={14} />
                  )}
                </div>
                <span className="text-[13px] font-bold text-slate-800">
                  {user?.name?.split(" ")[0]}
                </span>
              </button>
              <button
                onClick={logout}
                className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/student/signin")}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[14px] font-bold shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-1.5"
              >
                Get started <ChevronRight size={14} className="mt-0.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
