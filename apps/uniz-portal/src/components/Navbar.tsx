import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useStudentData } from "../hooks/student_info";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Code2, LogOut, ArrowRight } from "lucide-react";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";

function formatNavDisplayName(name?: string | null): string {
  if (!name?.trim()) {
    return localStorage.getItem("username") ?? "Student";
  }
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default function Navbar() {
  const [isAuth, setAuth] = useRecoilState(is_authenticated);
  const user = useRecoilValue(student);
  const navigate = useNavigate();
  const location = useLocation();

  useStudentData();

  const logout = () => {
    localStorage.removeItem("student_token");
    localStorage.removeItem("username");
    localStorage.removeItem("admin_token");
    setAuth({ is_authenticated: false, type: "" });
    navigate("/");
  };

  const isAuthenticated =
    (isAuth.is_authenticated &&
      isAuth.type === "student" &&
      localStorage.getItem("student_token")) ||
    (localStorage.getItem("student_token") && user);

  const isDevelopersPage = location.pathname === "/developers";

  return (
    <header className="fixed inset-x-0 top-0 z-[100] flex h-[56px] items-center bg-[#0A2540] text-white border-b border-white/10 shadow-sm">
      <div className="mx-auto flex h-full w-full max-w-[1280px] px-4 sm:px-6 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 text-white no-underline group">
            <img
              src="/logo.png"
              alt="RGUKT Ongole"
              className="h-7 w-7 rounded-full object-cover brightness-0 invert transition-transform group-hover:scale-105"
            />
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold uppercase tracking-[1.5px]">
                Exam Cell
              </span>
              <span className="hidden sm:inline-block h-3.5 w-px bg-white/25" />
              <span className="hidden sm:inline text-[12px] font-semibold uppercase tracking-[1.2px] text-white/80">
                {UNIZ_CAMPUS_LABEL}
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-2 sm:gap-5">
          <a
            href="/#campus-updates"
            className="hidden md:inline-flex items-center text-[12px] font-bold uppercase tracking-[1.2px] text-white/80 hover:text-white transition-colors"
          >
            Updates
          </a>

          <Link
            to="/developers"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] text-[12px] font-bold uppercase tracking-[1.2px] transition-colors ${
              isDevelopersPage
                ? "bg-white/15 text-white border border-white/25"
                : "text-white/90 hover:text-white hover:bg-white/10"
            }`}
          >
            <Code2 size={14} className="shrink-0" />
            <span>Developers</span>
          </Link>

          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate("/student/signin")}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[4px] bg-white text-[#0A2540] text-[12px] font-bold uppercase tracking-[1.2px] hover:bg-navy-50 transition-colors shadow-sm"
            >
              <span>Login</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/student")}
                className="flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                <span className="hidden text-[13px] font-bold uppercase tracking-[0.4px] sm:inline">
                  {formatNavDisplayName(user?.name)}
                </span>
                <span className="sm:hidden text-[12px] font-bold uppercase tracking-[0.4px]">
                  Portal
                </span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
