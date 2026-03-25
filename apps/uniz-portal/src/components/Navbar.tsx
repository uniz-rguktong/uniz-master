import { useRecoilState, useRecoilValue } from "recoil";
import { is_authenticated, student } from "../store";
import { useStudentData } from "../hooks/student_info";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon } from "lucide-react";

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
    <header className="fixed top-0 inset-x-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-[72px] px-6">
        {/* Left: Logo - Cal.com style font */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2 cursor-pointer group">
            <span className="text-2xl font-black text-[#111111] tracking-tighter hover:opacity-80 transition-opacity">
              uniZ.
            </span>
          </Link>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/student/signin")}
                className="px-6 py-2.5 bg-[#111111] text-white rounded-xl text-[13px] font-bold hover:bg-black transition-all shadow-xl active:scale-95"
              >
                Get started
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/student/profile")}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200/50 shadow-sm group"
              >
                <div className="w-7 h-7 rounded-lg bg-navy-900 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                  {user?.profile_url ? (
                    <img
                      src={user.profile_url}
                      className="w-full h-full object-cover"
                    />
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
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
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
