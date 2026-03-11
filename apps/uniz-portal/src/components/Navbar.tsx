import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useStudentData } from "../hooks/student_info";
import { Link, useNavigate } from "react-router-dom";
import {
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
    <header className="fixed top-0 inset-x-0 z-[100] bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="unifrakturcook-bold text-4xl text-slate-900 tracking-tight leading-none group-hover:scale-105 transition-transform duration-300">
              uniZ
            </span>
          </Link>
        </div>
        {/* Right: Action Buttons */}
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <button
              onClick={() => navigate("/student/signin")}
              className="px-8 py-2.5 bg-slate-950 text-white rounded-full text-[14px] font-bold border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:bg-slate-800 hover:shadow-[0_0_25px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Sign in
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/student/profile")}
                className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/50 hover:bg-white transition-all border border-slate-200/50 shadow-sm"
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
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
