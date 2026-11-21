import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useStudentData } from "../hooks/student_info";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchTurnstile } from "../utils/prefetchTurnstile";
import { Lockup } from "@/components/brand/Mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar } from "@/components/ui/avatar";

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
  const isHome = location.pathname === "/";

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

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] flex h-16 items-center border-b border-[var(--sb-border)] bg-navy-900 px-4 text-white min-[821px]:px-10",
        isHome && "max-[820px]:h-[60px]",
      )}
    >
      <button type="button" onClick={() => navigate("/")} className="text-white" aria-label="UniZ home">
        <Lockup mark={32} word={20} tone="chrome" className="max-[820px]:[&_span]:sr-only" />
      </button>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle tone="chrome" />
        {!isAuthenticated ? (
          <button
            type="button"
            onMouseEnter={prefetchTurnstile}
            onFocus={prefetchTurnstile}
            onClick={() => navigate("/student/signin")}
            className="inline-flex h-[38px] items-center rounded-full bg-white px-5 text-dense font-semibold text-navy-900 transition-colors duration-150 hover:bg-navy-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Sign in
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate("/student")}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-white hover:bg-white/10"
            >
              <Avatar
                size={32}
                src={user?.profile_url}
                alt={user?.name ? `${user.name} profile photo` : "Profile photo"}
                name={formatNavDisplayName(user?.name)}
              />
              <span className="hidden text-dense font-medium sm:inline">
                {formatNavDisplayName(user?.name)}
              </span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
              aria-label="Sign out"
            >
              <LogOut size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
