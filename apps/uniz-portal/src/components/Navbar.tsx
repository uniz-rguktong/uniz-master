import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useStudentData } from "../hooks/student_info";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
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
    <header className="fixed inset-x-0 top-0 z-[100] flex h-[52px] items-center bg-[#0A2540] text-white">
      <div className="mx-auto flex h-full w-[94%] items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white no-underline">
          <img
            src="/logo.png"
            alt=""
            className="h-7 w-7 rounded-full object-cover brightness-0 invert"
          />
          <span className="text-[15px] font-bold uppercase tracking-[1.5px]">
            Exam Cell
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <span className="hidden text-[13px] font-bold uppercase tracking-[1px] sm:inline">
                {UNIZ_CAMPUS_LABEL}
              </span>
              <button
                type="button"
                onClick={() => navigate("/student/signin")}
                className="text-[12px] font-bold uppercase tracking-[1.5px] text-white hover:underline"
              >
                Login
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/student")}
                className="flex items-center gap-2 text-white"
              >
                <span className="hidden text-[13px] font-bold uppercase tracking-[0.4px] sm:inline">
                  {formatNavDisplayName(user?.name)}
                </span>
                <span className="hidden text-[11px] font-medium uppercase tracking-[0.5px] text-white/70 sm:inline">
                  {UNIZ_CAMPUS_LABEL}
                </span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="inline-flex h-8 w-8 items-center justify-center text-white/80 hover:text-white"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
