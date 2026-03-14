/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useRecoilState, useSetRecoilState } from "recoil";
import { adminUsername, is_authenticated, resetTokenState } from "../../store";
import { useNavigate } from "react-router-dom";
import { toast } from "@/utils/toast-ref";
import {
  SIGNIN,
  FORGOT_PASS_ENDPOINT,
  VERIFY_OTP_ENDPOINT,
  SET_NEW_PASS_ENDPOINT,
  REQUEST_OTP_EMAIL_ENDPOINT,
} from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";
import { User, Lock, KeyRound, ArrowLeft, ChevronLeft } from "lucide-react";
import LoginScreen from "../../components/ui/login-1";
import { Turnstile } from "@marsidev/react-turnstile";

type SigninProps = {
  type: "student" | "admin" | "faculty";
};

interface SigninResponse {
  msg?: string;
  student_token?: string;
  admin_token?: string;
  success?: boolean;
  role?: string;
}

export default function Signin({ type }: SigninProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"signin" | "forgot" | "verifyOtp">("signin");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useRecoilState(resetTokenState);

  const [isLoading, setIsLoading] = useState(false);
  const [authState] = useRecoilState(is_authenticated);
  const setAdmin = useSetRecoilState<any>(adminUsername);
  const setAuth = useSetRecoilState(is_authenticated);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    // Only redirect if a token is actually present in storage
    const hasToken =
      localStorage.getItem("student_token") ||
      localStorage.getItem("admin_token") ||
      localStorage.getItem("faculty_token");

    if (authState.is_authnticated && hasToken) {
      const redirectPath =
        authState.type === "student"
          ? "/student"
          : authState.type === "admin"
            ? "/admin"
            : "/faculty";
      navigate(redirectPath, { replace: true });
    }
  }, [authState, navigate, type]);

  // Force reset state when switching between login modes (student/admin/faculty)
  useEffect(() => {
    setUsername("");
    setPassword("");
    setOtp("");
    setNewPassword("");
    setStep("signin");
    setIsLoading(false);
  }, [type]);

  const sendDataToBackend = async () => {
    if (username.trim() === "" || password.trim() === "") {
      toast.error("Username and password are required");
      return;
    }

    const isStudentFormat = /^O\d+/i.test(username.trim());

    if (type === "student" && !isStudentFormat) {
      toast.error(
        "Student username must be your valid college ID (e.g., O210001)",
      );
      return;
    }

    if ((type === "admin" || type === "faculty") && isStudentFormat) {
      toast.error(
        `Students are not allowed to access the ${type === "admin" ? "Admin" : "Faculty"} Portal`,
      );
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient<SigninResponse>(SIGNIN(type), {
        method: "POST",
        body: JSON.stringify({
          // For students we uppercase (roll numbers); for admin/faculty backend does case-insensitive lookup
          username:
            type === "student"
              ? username.trim().toUpperCase()
              : username.trim(),
          password: password.trim(),
          captchaToken: import.meta.env.DEV
            ? "uniz_dev_bypass_token_2026"
            : captchaToken,
        }),
      });

      if (!data) return;

      // Explicit Role Mismatch Checks
      if (type === "admin" && data.role === "student") {
        toast.error(
          "This account is a Student account. Please use the Student Login.",
        );
        return;
      }
      if (
        type === "student" &&
        (data.role === "admin" || data.role === "webmaster")
      ) {
        toast.error("This is an Admin account. Please use the Admin Login.");
        return;
      }

      const token =
        data.student_token || data.admin_token || (data as any).token;

      if (type === "student" && token && data.role === "student") {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("faculty_token");
        localStorage.setItem("student_token", token);
        localStorage.setItem("username", username.trim());
        setAuth({ is_authnticated: true, type: "student" });
        toast.success(`Welcome back, ${username.trim()}!`);
        navigate("/student", { replace: true });
      } else if (
        type === "admin" &&
        (data.role === "teacher" || data.role === "faculty") &&
        (token || data.success)
      ) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("admin_token");
        localStorage.setItem("faculty_token", token || "");
        localStorage.setItem("username", username.trim());
        localStorage.setItem("role", data.role || "teacher");
        setAuth({ is_authnticated: true, type: "faculty" });
        toast.success(`Welcome Professor ${username.trim()}!`);
        navigate("/faculty", { replace: true });
      } else if (type === "admin" && (token || data.success)) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("faculty_token");
        localStorage.setItem("admin_token", token);
        localStorage.setItem("username", username.trim());
        localStorage.setItem("admin_role", (data as any).role || "admin");

        setAuth({ is_authnticated: true, type: "admin" });
        setAdmin(username.trim());
        toast.success("Welcome back, Admin!");
        setTimeout(() => navigate("/admin", { replace: true }), 100);
      } else if (type === "faculty" && token) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("admin_token");
        localStorage.setItem("faculty_token", token);
        localStorage.setItem("username", username.trim());
        localStorage.setItem("role", (data as any).role);
        setAuth({ is_authnticated: true, type: "faculty" });
        toast.success(`Welcome Professor ${username.trim()}!`);
        navigate("/faculty", { replace: true });
      } else {
        toast.error("Access denied: Invalid credentials for this portal.");
      }
    } catch (error: any) {
      // apiClient handles toasts, but we can add fallback
      console.error("Signin failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async () => {
    if (username.trim() === "") {
      toast.error("Please enter your email/ID");
      return;
    }

    const isStudentFormat = /^O\d+/i.test(username.trim());

    if (type === "student" && !isStudentFormat) {
      toast.error("Student ID must be a valid college ID (e.g., O210001)");
      return;
    }

    if ((type === "admin" || type === "faculty") && isStudentFormat) {
      toast.error(
        `Students cannot request OTP from the ${type === "admin" ? "Admin" : "Faculty"} Portal`,
      );
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient<{
        success: boolean;
        message?: string;
        deliveryMethod?: "push" | "email";
        email?: string;
      }>(FORGOT_PASS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ username: username.trim() }),
      });

      if (data && data.success) {
        toast.success(data.message || "Security code sent successfully", {
          icon: <span>{data.deliveryMethod === "push" ? "📱" : "📧"}</span>,
          autoClose: 5000,
        });
        setStep("verifyOtp");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const requestEmailOtp = async () => {
    const isStudentFormat = /^O\d+/i.test(username.trim());

    if (type === "student" && !isStudentFormat) {
      toast.error("Student ID must be a valid college ID (e.g., O210001)");
      return;
    }

    if ((type === "admin" || type === "faculty") && isStudentFormat) {
      toast.error(
        `Students cannot request OTP from the ${type === "admin" ? "Admin" : "Faculty"} Portal`,
      );
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient<{
        success: boolean;
        message?: string;
        deliveryMethod?: "email";
      }>(REQUEST_OTP_EMAIL_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ username: username.trim() }),
      });

      if (data && data.success) {
        toast.success(
          data.message || "Security code dispatched to your email",
          {
            icon: <span></span>,
            autoClose: 5000,
          },
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiClient<{
        success: boolean;
        message?: string;
        resetToken?: string;
      }>(VERIFY_OTP_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          otp: otp.trim(),
        }),
      });

      if (data && data.success && data.resetToken) {
        setResetToken(data.resetToken);
        toast.success(data.message || "OTP Verified");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword.trim() === "") {
      toast.error("New password is required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient<{ success: boolean; message?: string }>(
        SET_NEW_PASS_ENDPOINT,
        {
          method: "POST",
          body: JSON.stringify({
            username: username.trim(),
            resetToken: resetToken,
            newPassword: newPassword,
          }),
        },
      );

      if (data && data.success) {
        toast.success(data.message || "Password reset successfully");
        setOtp("");
        setNewPassword("");
        setResetToken(null);
        setStep("signin");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "signin") sendDataToBackend();
    if (step === "forgot") requestOtp();
    if (step === "verifyOtp") resetPassword();
  };

  const getHeroTitle = () => {
    return null;
  };

  const dashboardLabel =
    type === "student"
      ? "Student Login"
      : type === "faculty"
        ? "Faculty Portal"
        : "Administrator Portal";

  return (
    <div className="min-h-screen bg-white relative">
      <Button
        variant="ghost"
        className="absolute top-8 left-8 p-2 text-white hover:text-white/80 transition-all z-50 flex items-center gap-2 font-bold"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Home
      </Button>

      <LoginScreen
        isLogin={step === "signin"}
        title={
          step === "signin"
            ? dashboardLabel
            : step === "forgot"
              ? "Reset Password"
              : "New Credentials"
        }
        subtitle={
          step === "signin"
            ? "Enter your credentials to access the portal"
            : step === "forgot"
              ? "We'll send an OTP to your registered ID"
              : "Verify your identity to proceed"
        }
        heroTitle={getHeroTitle() || undefined}
        bottomText="Rgukt Ongole"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {step === "signin" && (
            <div className="space-y-4">
              <Input
                label="Username / ID"
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder={
                  type === "student"
                    ? "University ID (e.g. O210001)"
                    : type === "faculty"
                      ? "Staff ID"
                      : "Admin ID"
                }
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                className="h-12"
              />
              <Input
                label="Password"
                type="password"
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12"
              />

              {import.meta.env.VITE_TURNSTILE_SITE_KEY ? (
                <div className="flex justify-center py-2">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => setCaptchaToken(null)}
                  />
                </div>
              ) : (
                import.meta.env.DEV && (
                  <div className="text-center py-2 text-[10px] text-amber-600 font-medium">
                    ⚠️ Turnstile Disabled (No Site Key)
                  </div>
                )
              )}

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm text-navy-900 hover:text-navy-800 font-bold transition-all"
                  onClick={() => setStep("forgot")}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-[15px] font-bold shadow-xl shadow-navy-100 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
                isLoading={isLoading}
                type="submit"
                disabled={
                  !!import.meta.env.VITE_TURNSTILE_SITE_KEY &&
                  !import.meta.env.DEV &&
                  !captchaToken
                }
              >
                Sign In
              </Button>

              {type === "admin" && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    className="text-[11px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest transition-all"
                    onClick={() => {
                      setUsername("security");
                      setPassword("security@uniz");
                    }}
                  >
                    Quick Access (Security)
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "forgot" && (
            <div className="space-y-4">
              <Input
                label="Student / Staff ID"
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                placeholder="Enter your ID to receive OTP"
                className="h-12"
              />
              <Button
                className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-[15px] font-bold"
                size="lg"
                isLoading={isLoading}
                onClick={requestOtp}
              >
                Send OTP
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 font-bold transition-all group"
                  onClick={() => setStep("signin")}
                >
                  <ArrowLeft className="w-3 h-3 mr-1.5 group-hover:-translate-x-1 transition-transform" />
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {step === "verifyOtp" && (
            <div className="space-y-4">
              <Input
                label="Verification Code"
                icon={<KeyRound className="w-4 h-4" />}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="h-12"
                disabled={!!resetToken}
              />

              {!resetToken && (
                <div className="space-y-4">
                  <Button
                    className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-[15px] font-bold"
                    size="lg"
                    isLoading={isLoading}
                    onClick={handleVerifyOtp}
                  >
                    Verify OTP
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-[11px] text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest underline transition-all"
                      onClick={requestEmailOtp}
                      disabled={isLoading}
                    >
                      Resend via Email
                    </button>
                  </div>
                </div>
              )}

              {!!resetToken && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <Input
                    label="New Secure Password"
                    type="password"
                    icon={<Lock className="w-4 h-4" />}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="h-12"
                  />
                  <Button
                    className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-[15px] font-bold"
                    size="lg"
                    isLoading={isLoading}
                    onClick={resetPassword}
                  >
                    Set New Password
                  </Button>
                </div>
              )}
            </div>
          )}
        </form>
      </LoginScreen>
    </div>
  );
}
