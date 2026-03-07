"use client";
import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building,
  ShieldCheck,
  User,
  Cpu,
  Zap,
  Wrench,
  Settings,
  BookOpen,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoginUser {
  role: string;
  branch: string | null;
  clubId?: string | null;
  name: string;
}

interface LoginPageProps {
  onLogin: (user: LoginUser) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("cse");
  const [selectedClub, setSelectedClub] = useState("club1");
  const [dashboardType, setDashboardType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const branches = [
    { id: "cse", name: "Computer Science" },
    { id: "ece", name: "Electronics & Comm." },
    { id: "eee", name: "Electrical & Electronics" },
    { id: "mech", name: "Mechanical" },
    { id: "civil", name: "Civil Engineering" },
  ];

  const clubs = Array.from({ length: 8 }, (_, i) => ({
    id: `club${i + 1}`,
    name: `Club ${i + 1}`,
  }));

  const [email, setEmail] = useState("");

  // Demo credentials mapping for "Sign In" simulation
  const demoUsers = {
    "cse@admin.com": { role: "branch", branch: "cse", name: "CSE Admin" },
    "ece@admin.com": { role: "branch", branch: "ece", name: "ECE Admin" },
    "eee@admin.com": { role: "branch", branch: "eee", name: "EEE Admin" },
    "mech@admin.com": {
      role: "branch",
      branch: "mech",
      name: "Mechanical Admin",
    },
    "civil@admin.com": { role: "branch", branch: "civil", name: "Civil Admin" },
    "club@admin.com": { role: "club", branch: null, name: "Club Coordinator" },
    "super@admin.com": {
      role: "super_admin",
      branch: null,
      name: "Super Admin",
    },
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    // Determines user data based on mode
    let userData;

    if (!isLogin) {
      // REGISTER MODE: Use selected dropdown values
      userData = {
        role: dashboardType,
        branch: dashboardType === "branch" ? selectedBranch : null,
        clubId: dashboardType === "club" ? selectedClub : null,
        name:
          dashboardType === "branch"
            ? branches.find((b) => b.id === selectedBranch)?.name + " Admin"
            : "New User",
      };
    } else {
      // SIGN IN MODE: specific demo emails or default
      const demoUser = (demoUsers as any)[email.toLowerCase()];
      userData = demoUser || {
        role: "branch",
        branch: "cse", // Default fallback
        name: "Demo Admin",
      };
    }

    setIsLoading(false);
    onLogin(userData); // Pass data to App.jsx
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F6F6] font-[sans-serif] p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-[#10B981]/5 to-transparent pointer-events-none" />

      {/* Auth Form */}
      <div className="w-full max-w-md relative z-10">
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-10 rounded-[32px] shadow-2xl shadow-gray-200/50 border border-gray-100">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-[#6B7280]">
              {isLogin
                ? "Enter your credentials to access your account"
                : "Select your access level to join the portal"}
            </p>
          </div>

          {/* Toggle Type */}
          <div className="flex p-1 bg-[#F4F4F5] rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                isLogin
                  ? "bg-white text-[#1A1A1A] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                !isLogin
                  ? "bg-white text-[#1A1A1A] shadow-sm"
                  : "text-[#6B7280] hover:text-[#1A1A1A]"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Select Role
                  </label>
                  <Select
                    value={dashboardType}
                    onValueChange={setDashboardType}
                  >
                    <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branch">Branch Admin</SelectItem>
                      <SelectItem value="hho">HHO</SelectItem>
                      <SelectItem value="club">Club Coordinator</SelectItem>
                      <SelectItem value="sports">Sports Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Branch Selection (Dropdown) */}
                {dashboardType === "branch" && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-sm font-medium text-[#1A1A1A]">
                      Select Department
                    </label>
                    <Select
                      value={selectedBranch}
                      onValueChange={setSelectedBranch}
                    >
                      <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Club Selection (Dropdown) */}
                {dashboardType === "club" && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-sm font-medium text-[#1A1A1A]">
                      Select Club
                    </label>
                    <Select
                      value={selectedClub}
                      onValueChange={setSelectedClub}
                    >
                      <SelectTrigger className="w-full h-12 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]">
                        <SelectValue placeholder="Select Club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1A1A1A]">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all placeholder:text-gray-400"
                    placeholder="admin@rgukt.ac.in"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1A1A1A]">
                    Password
                  </label>
                  {isLogin && (
                    <a
                      href="#"
                      className="text-xs font-bold text-[#10B981] hover:underline"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#10B981] text-white rounded-xl font-bold text-sm tracking-wide hover:bg-[#059669] hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
