import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useStudentData } from "../hooks/student_info";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchTurnstile } from "../utils/prefetchTurnstile";

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
        "fixed z-[100]",
        isHome
          ? "top-3 inset-x-0 flex justify-center px-4"
          : "top-0 inset-x-0 border-b border-navy-200 bg-white",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between",
          isHome
            ? "h-12 w-full max-w-3xl rounded-2xl border border-navy-200/80 bg-white/80 px-4 shadow-[0_8px_24px_rgba(11,42,71,0.06)] backdrop-blur-md sm:px-5"
            : "mx-auto h-14 w-full max-w-7xl px-6",
        )}
      >
        <Link
          to="/"
          className="uniz-logo-wordmark text-2xl text-navy-900 transition-opacity duration-300 hover:opacity-80"
        >
          uniZ.
        </Link>

        <div className="flex items-center gap-1">
          {!isAuthenticated ? (
            <button
              type="button"
              onMouseEnter={prefetchTurnstile}
              onFocus={prefetchTurnstile}
              onClick={() => navigate("/student/signin")}
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-[color,background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900 active:scale-[0.98]"
            >
              Get started
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/student")}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors duration-300 hover:bg-navy-50"
              >
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-navy-50 ring-1 ring-navy-200">
                  {user?.profile_url ? (
                    <img
                      src={user.profile_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-navy-500">
                      <UserIcon size={15} />
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-navy-800">
                  {formatNavDisplayName(user?.name)}
                </span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-full text-navy-400 transition-colors duration-300 hover:bg-navy-50 hover:text-navy-800"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={17} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
