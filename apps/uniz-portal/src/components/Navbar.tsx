import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useEffect, useState } from "react";
import { useStudentData } from "../hooks/student_info";
import { Button } from "./Button";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Building2,
  BookOpen,
  Microscope,
  GraduationCap,
  Shield,
  Phone,
  Library,
  FileText,
} from "lucide-react";
import { isMaintenance } from "../App";
// import { useWebSocket } from "../hooks/useWebSocket";
// import { cn } from "../utils/cn";

const UserSkeleton = () => (
  <div className="flex items-center space-x-3 animate-pulse">
    <div className="bg-slate-200 rounded-full h-9 w-9"></div>
    <div className="space-y-1">
      <div className="bg-slate-200 h-3 w-24 rounded"></div>
      <div className="bg-slate-200 h-2 w-32 rounded"></div>
    </div>
  </div>
);

export default function Navbar() {
  const [isAuth, setAuth] = useRecoilState(is_authenticated);
  const user = useRecoilValue(student);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  // const { isConnected } = useWebSocket(undefined);

  // Safely parse admin name
  const rawAdminName = localStorage.getItem("username");
  const adminName = rawAdminName ? rawAdminName.replace(/^"|"$/g, "") : null;

  useEffect(() => {
    if (user?.name || user?.email) {
      setIsLoading(false);
    }
  }, [user]);

  useStudentData();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    if (name.startsWith("Warden")) return "W";
    const parts = name.split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name[0].toUpperCase();
  };

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

  const isAdminAuthenticated =
    (isAuth.is_authnticated &&
      isAuth.type === "admin" &&
      localStorage.getItem("admin_token")) ||
    (localStorage.getItem("admin_token") && adminName);

  return (
    <header className="flex flex-col w-full top-0 z-50 font-sans shadow-xl">
      <nav className="bg-white border-b border-gray-100 py-4 md:py-6 relative z-20">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Brand Section */}
          <Link to="/" className="flex items-center gap-4 group py-1">
            <img
              src="/assets/ongole_logo.png"
              className="w-14 h-14 md:w-20 md:h-20 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
              alt="Ongole Logo"
            />
            <div className="flex flex-col justify-center">
              <h1 className="font-serif font-bold text-lg md:text-2xl text-[#800000] leading-none tracking-tight uppercase">
                Rajiv Gandhi University of Knowledge Technologies
              </h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold tracking-widest mt-1.5 uppercase hidden md:block">
                Catering to the Educational Needs of Gifted Rural Youth of
                Andhra Pradesh
              </p>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold tracking-widest mt-0.5 uppercase hidden md:block">
                (Established by the Govt of Andhra Pradesh and recognizes as per
                section 2(f),12(B) of UGC Act 1956)
              </p>
            </div>
          </Link>

          {/* Right Section: Gov Logos & Auth */}
          <div className="flex items-center gap-6">
            {/* Decorative Gov Elements (Desktop Only) */}
            <div className="hidden xl:flex items-center gap-6 opacity-100 p-2">
              <img
                src="/assets/make_in_india.png"
                alt="Make In India"
                className="h-14 w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer drop-shadow-sm mix-blend-multiply"
              />

              <img
                src="/assets/naac.png"
                alt="NAAC A+ Grade"
                className="h-14 w-14 object-contain hover:scale-105 transition-transform duration-300 cursor-pointer drop-shadow-sm mix-blend-multiply"
              />
            </div>

            {/* Search & Auth */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                isLoading ? (
                  <UserSkeleton />
                ) : (
                  <div className="flex items-center gap-3 pl-1 pr-1 py-1 rounded-full border border-slate-200 bg-white hover:border-[#800000]/30 transition-colors shadow-sm ml-2">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold border-2 border-white shadow overflow-hidden">
                      {user?.profile_url ? (
                        <img
                          src={user.profile_url}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[#800000] text-xs">
                          {getInitials(user?.name)}
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:block pr-3">
                      <p className="text-sm font-bold text-slate-800 leading-tight">
                        {user?.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="hidden sm:flex hover:bg-red-50 text-slate-400 hover:text-[#800000] rounded-full w-9 h-9 p-0"
                    >
                      <LogOut size={16} />
                    </Button>
                  </div>
                )
              ) : isAdminAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#800000]">
                    {adminName}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="border-[#800000] text-[#800000] hover:bg-[#800000] hover:text-white transition-colors h-9 text-xs"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                !isMaintenance && (
                  <Link to="/student/signin">
                    <button className="bg-[#800000] hover:bg-[#600000] text-white shadow-md shadow-red-900/10 px-8 rounded-md tracking-wide font-bold uppercase text-xs h-10 ml-2 transition-all">
                      Login
                    </button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Strip */}
      <div className="bg-white border-b border-gray-200 py-2 hidden lg:block shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] relative z-10">
        <div className="container mx-auto px-4 flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest relative">
          {/* The Institute Dropdown */}
          <div className="relative group/dropdown">
            <span className="flex items-center gap-2 cursor-pointer hover:text-[#800000] transition-colors group-hover/dropdown:text-[#800000] py-1">
              <span className="text-[#800000] group-hover/dropdown:text-[#800000] transition-colors">
                <Building2 size={16} />
              </span>{" "}
              The Institute
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 mt-0 pt-2 w-56 hidden group-hover/dropdown:block z-50">
              <div className="bg-white border border-slate-100 shadow-xl rounded-lg overflow-hidden flex flex-col">
                <Link
                  to="/institute/campus"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold border-b border-slate-50"
                >
                  Campus
                </Link>
                <Link
                  to="/institute/administration"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold border-b border-slate-50"
                >
                  Administration
                </Link>
                <Link
                  to="/institute/alumni"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold"
                >
                  Alumni
                </Link>
              </div>
            </div>
          </div>

          {/* Academics Dropdown */}
          <div className="relative group/dropdown">
            <span className="flex items-center gap-2 cursor-pointer hover:text-[#800000] transition-colors group-hover/dropdown:text-[#800000] py-1">
              <span className="text-[#800000] group-hover/dropdown:text-[#800000] transition-colors">
                <BookOpen size={16} />
              </span>{" "}
              Academics
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 mt-0 pt-2 w-64 hidden group-hover/dropdown:block z-50">
              <div className="bg-white border border-slate-100 shadow-xl rounded-lg overflow-hidden flex flex-col">
                <Link
                  to="/academics/faculty"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold border-b border-slate-50"
                >
                  Faculty
                </Link>
                <Link
                  to="/academics/rules"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold border-b border-slate-50"
                >
                  Rules and Regulations
                </Link>
                <Link
                  to="/academics/calendar"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold"
                >
                  Academic Calender
                </Link>
              </div>
            </div>
          </div>

          {/* Departments Dropdown */}
          <div className="relative group/dropdown">
            <span className="flex items-center gap-2 cursor-pointer hover:text-[#800000] transition-colors group-hover/dropdown:text-[#800000] py-1">
              <span className="text-[#800000] group-hover/dropdown:text-[#800000] transition-colors">
                <Microscope size={16} />
              </span>{" "}
              Departments
            </span>
            <div className="absolute left-1/2 -translate-x-1/2 mt-0 pt-2 w-72 hidden group-hover/dropdown:block z-50">
              <div className="bg-white border border-slate-100 shadow-xl rounded-lg overflow-hidden flex flex-col">
                <Link
                  to="/departments/civil"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold border-b border-slate-50"
                >
                  Civil Engineering
                </Link>
                <Link
                  to="/departments/cse"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold border-b border-slate-50"
                >
                  Computer Science Engineering
                </Link>
                <Link
                  to="/departments/mech"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold border-b border-slate-50"
                >
                  Mechanical Engineering
                </Link>
                <Link
                  to="/departments/ece"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold border-b border-slate-50"
                >
                  Electronics and Communication Engineering
                </Link>
                <Link
                  to="/departments/eee"
                  className="px-4 py-3 hover:bg-slate-50 text-slate-600 hover:text-[#800000] transition-colors text-[11px] font-bold"
                >
                  Electrical and Electronics Engineering
                </Link>
              </div>
            </div>
          </div>

          <Link
            to="/examcell"
            className="flex items-center gap-2 cursor-pointer hover:text-[#800000] transition-colors group py-1"
          >
            <span className="text-[#800000] group-hover:text-[#800000] transition-colors">
              <FileText size={16} />
            </span>{" "}
            Examcell
          </Link>

          {/* External Links */}
          <a
            href="https://campushub.sreecharandesu.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer hover:text-[#800000] transition-colors group py-1"
          >
            <span className="text-[#800000] group-hover:text-[#800000] transition-colors">
              <GraduationCap size={16} />
            </span>{" "}
            Campus Hub
          </a>

          <a
            href="https://campusschield.sreecharandesu.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer hover:text-[#800000] transition-colors group py-1"
          >
            <span className="text-[#800000] group-hover:text-[#800000] transition-colors">
              <Shield size={16} />
            </span>{" "}
            Campus Shield
          </a>

          <Link
            to="/library"
            className="flex items-center gap-2 cursor-pointer hover:text-[#800000] transition-colors group py-1"
          >
            <span className="text-[#800000] group-hover:text-[#800000] transition-colors">
              <Library size={16} />
            </span>{" "}
            Grievance
          </Link>

          {/* Contact Us */}
          <Link
            to="/contact-us"
            className="flex items-center gap-2 cursor-pointer hover:text-[#800000] transition-colors group py-1"
          >
            <span className="text-[#800000] group-hover:text-[#800000] transition-colors">
              <Phone size={16} />
            </span>{" "}
            Contact Us
          </Link>
        </div>
      </div>

      {/* News Ticker / Updates Strip */}
      <div className="bg-slate-50 border-b border-slate-200 py-1 flex items-center overflow-hidden h-8">
        <div className="flex-1 overflow-hidden relative h-full flex items-center ml-4">
          <div className="whitespace-nowrap animate-[marquee_25s_linear_infinite] text-[11px] font-bold text-slate-700 uppercase tracking-wide flex gap-12">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>{" "}
              Semester registrations for AY 2025-26 open now
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Annual
              Sports Meet scheduled for next week
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>{" "}
              Examination results for E1/E2 released
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span> New
              block inauguration by Hon'ble Minister
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
