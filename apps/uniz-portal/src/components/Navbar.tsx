import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useStudentData } from "../hooks/student_info";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon } from "lucide-react";

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
    <header className="fixed top-0 inset-x-0 z-[100] bg-white/90 backdrop-blur-xl border-b border-zinc-100/80">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/" className="uniz-logo-wordmark text-2xl text-zinc-950 hover:opacity-80 transition-opacity">
          uniZ.
        </Link>

        <div className="flex items-center gap-1">
          {!isAuthenticated ? (
            <button
              onClick={() => navigate("/student/signin")}
              className="px-5 py-2 bg-zinc-950 text-white rounded-xl text-[13px] font-semibold hover:bg-zinc-800 transition-colors active:scale-[0.98]"
            >
              Get started
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/student")}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-zinc-100/90 transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 ring-1 ring-zinc-200/80 shrink-0">
                  {user?.profile_url ? (
                    <img
                      src={user.profile_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-zinc-500">
                      <UserIcon size={15} />
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-zinc-700 tracking-tight">
                  {formatNavDisplayName(user?.name)}
                </span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
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
