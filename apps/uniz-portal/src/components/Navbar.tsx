import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useStudentData } from "../hooks/student_info";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  LogOut,
  User as UserIcon,
} from "lucide-react";

export default function Navbar() {
  const [isAuth, setAuth] = useRecoilState(is_authenticated);
  const user = useRecoilValue(student);
  const navigate = useNavigate();

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

  return (
    <header className="sticky top-0 z-[100] bg-transparent backdrop-blur-xl border-b border-slate-100/50 px-[9px] py-2">
      <div className="w-full flex items-center justify-between h-16">
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="unifrakturcook-bold text-4xl text-slate-900 tracking-tight leading-none group-hover:scale-105 transition-transform duration-300">
              uniZ
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {!isAuthenticated && (
            <button
              onClick={() => navigate("/student/signin")}
              className="hidden md:block text-[14px] font-semibold text-slate-600 hover:text-slate-950 transition-colors"
            >
              Sign in
            </button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/student/profile")}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100/50 hover:bg-slate-100 transition-all border border-slate-200/50"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shadow-sm">
                  {user?.profile_url ? (
                    <img src={user.profile_url} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={16} />
                  )}
                </div>
                <span className="text-[14px] font-bold text-slate-800">
                  {user?.name?.split(" ")[0]}
                </span>
              </button>
              <button
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/student/signin")}
              className="px-6 py-3 bg-slate-950 text-white rounded-xl text-[14px] font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-2"
            >
              Get started <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
