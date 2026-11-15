import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useStudentData } from "../hooks/student_info";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "fixed top-0 inset-x-0 z-[100]",
        isHome
          ? "bg-navy-900 border-b border-navy-800"
          : "bg-white/90 backdrop-blur-xl border-b border-navy-200/80",
      )}
    >
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        <Link
          to="/"
          className={cn(
            "uniz-logo-wordmark text-2xl hover:opacity-80 transition-opacity",
            isHome ? "!text-white" : "text-navy-900",
          )}
        >
          uniZ.
        </Link>

        <div className="flex items-center gap-1">
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigate("/student/signin")}
              className={cn(
                "px-5 py-2 rounded-lg text-[13px] font-medium transition-[color,background-color,transform] duration-150 active:scale-[0.98]",
                isHome
                  ? "bg-white text-navy-900 hover:bg-navy-50"
                  : "bg-navy-900 text-white hover:bg-navy-800",
              )}
            >
              Get started
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/student")}
                className={cn(
                  "flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors",
                  isHome ? "hover:bg-white/10" : "hover:bg-zinc-100/90",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1",
                    isHome
                      ? "bg-white/10 ring-white/20"
                      : "bg-zinc-100 ring-zinc-200/80",
                  )}
                >
                  {user?.profile_url ? (
                    <img
                      src={user.profile_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex h-full w-full items-center justify-center",
                        isHome ? "text-white/70" : "text-zinc-500",
                      )}
                    >
                      <UserIcon size={15} />
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium tracking-tight",
                    isHome ? "text-white/90" : "text-zinc-700",
                  )}
                >
                  {formatNavDisplayName(user?.name)}
                </span>
              </button>
              <button
                type="button"
                onClick={logout}
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-full transition-colors",
                  isHome
                    ? "text-white/60 hover:text-white hover:bg-white/10"
                    : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100",
                )}
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
