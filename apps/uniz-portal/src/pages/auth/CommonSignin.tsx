/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useRecoilState, useSetRecoilState } from "recoil";
import { adminUsername, is_authenticated, resetTokenState } from "../../store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  SIGNIN,
  FORGOT_PASS_ENDPOINT,
  VERIFY_OTP_ENDPOINT,
  SET_NEW_PASS_ENDPOINT,
  REQUEST_OTP_EMAIL_ENDPOINT,
} from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";
import {
  User,
  Lock,
  Mail,
  KeyRound,
  ArrowLeft,
  GraduationCap,
  ChevronLeft,
} from "lucide-react";

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

    if (type === "student" && !username.toUpperCase().includes("O")) {
      toast.error(
        "Student username must be your college ID (e.g., containing 'O')",
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
        localStorage.setItem("faculty_token", token || "");
        localStorage.setItem("username", username.trim());
        localStorage.setItem("role", data.role || "teacher");
        setAuth({ is_authnticated: true, type: "faculty" });
        toast.success(`Welcome Professor ${username.trim()}!`);
        navigate("/faculty", { replace: true });
      } else if (type === "admin" && (token || data.success)) {
        localStorage.setItem("admin_token", token);
        localStorage.setItem("username", username.trim());
        localStorage.setItem("admin_role", (data as any).role || "admin");

        setAuth({ is_authnticated: true, type: "admin" });
        setAdmin(username.trim());
        toast.success("Welcome back, Admin!");
        setTimeout(() => navigate("/admin", { replace: true }), 100);
      } else if (type === "faculty" && token) {
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

    setIsLoading(true);
    try {
      const data = await apiClient<{ success: boolean; message?: string }>(
        FORGOT_PASS_ENDPOINT,
        {
          method: "POST",
          body: JSON.stringify({ username: username.trim() }),
        },
      );

      if (data && data.success) {
        toast.success(data.message || "OTP sent successfully");
        setStep("verifyOtp");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const requestEmailOtp = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<{ success: boolean; message?: string }>(
        REQUEST_OTP_EMAIL_ENDPOINT,
        {
          method: "POST",
          body: JSON.stringify({ username: username.trim() }),
        },
      );

      if (data && data.success) {
        toast.success(data.message || "OTP sent to your email");
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

  return (
    <div className="flex items-center justify-center bg-white relative min-h-screen">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 p-2 text-slate-500 hover:text-slate-900 transition-colors"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="w-6 h-6" />{" "}
        <span className="sr-only">Back to Home</span>
      </Button>

      <div className="w-full max-w-md bg-white border border-white shadow-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-slate-900 p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-3 ring-4 ring-slate-800/50">
            {step === "signin" ? (
              <User className="w-6 h-6 text-white" />
            ) : step === "forgot" ? (
              <Mail className="w-6 h-6 text-white" />
            ) : type === "faculty" ? (
              <GraduationCap className="w-6 h-6 text-white" />
            ) : (
              <KeyRound className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {step === "signin"
              ? type === "student"
                ? "Student Login"
                : type === "faculty"
                  ? "Faculty Portal"
                  : "Administrator"
              : step === "forgot"
                ? "Reset Password"
                : "New Credentials"}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {step === "signin"
              ? "Enter your credentials to access the portal"
              : step === "forgot"
                ? "We'll send an OTP to your registered devices"
                : "Enter the 6-digit verification code"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {step === "signin" && (
            <div className="space-y-4">
              <Input
                label="Username"
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                placeholder={
                  type === "student"
                    ? "University ID"
                    : type === "faculty"
                      ? "Staff ID / Email"
                      : "Admin ID"
                }
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
              />
              <Input
                label="Password"
                type="password"
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <div className="pt-2">
                <Button
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                  type="submit"
                >
                  Sign In
                </Button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-sm text-slate-900 hover:text-black font-bold uppercase tracking-widest underline transition-all"
                  onClick={() => setStep("forgot")}
                >
                  Forgot password?
                </button>
              </div>
              {type === "admin" && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    className="text-sm text-slate-900 hover:text-black font-bold uppercase tracking-widest underline transition-all opacity-50 hover:opacity-100"
                    onClick={() => {
                      setUsername("security");
                      setPassword("security@uniz");
                    }}
                  >
                    Quick Login (Security)
                  </button>
                </div>
              )}
            </div>
          )}

          {step === "forgot" && (
            <div className="space-y-4">
              <Input
                label="University ID"
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                placeholder="Enter your ID"
              />
              <div className="pt-2">
                <Button
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                  onClick={requestOtp}
                >
                  Send OTP
                </Button>
              </div>
              <div className="text-center pt-2">
                <button
                  type="button"
                  className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 font-medium transition-all group"
                  onClick={() => setStep("signin")}
                >
                  <ArrowLeft className="w-3 h-3 mr-1 group-hover:-translate-x-1 transition-transform" />{" "}
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {step === "verifyOtp" && (
            <div className="space-y-4">
              <Input
                label="One-Time Password"
                icon={<KeyRound className="w-4 h-4" />}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                disabled={!!resetToken}
              />

              {!resetToken && (
                <div className="pt-2">
                  <Button
                    className="w-full"
                    size="lg"
                    isLoading={isLoading}
                    onClick={handleVerifyOtp}
                  >
                    Verify OTP
                  </Button>
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest underline transition-all"
                      onClick={requestEmailOtp}
                      disabled={isLoading}
                    >
                      Didn't receive code? Try Email
                    </button>
                  </div>
                </div>
              )}

              {!!resetToken && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <Input
                    label="New Password"
                    type="password"
                    icon={<Lock className="w-4 h-4" />}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New strong password"
                  />
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      size="lg"
                      isLoading={isLoading}
                      onClick={resetPassword}
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
