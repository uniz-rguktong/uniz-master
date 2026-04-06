/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import {
  User,
  Lock,
  ArrowLeft,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import LoginScreen from "../../components/ui/login-1";
import { Turnstile } from "@marsidev/react-turnstile";
import { motion, AnimatePresence } from "framer-motion";

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

// ─── OTP Input Component ──────────────────────────────────────
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").slice(0, 6).split("");

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const next = [...digits];
    next[index] = char;
    onChange(next.join(""));
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(text);
    const focusIdx = Math.min(text.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block ml-1">
        Verification Code
      </label>
      <div className="flex gap-2.5 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] || ""}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className="w-12 h-14 text-center text-xl font-black rounded-xl border-2 border-neutral-200 bg-neutral-50 text-neutral-900 focus:outline-none focus:border-navy-900 focus:ring-2 focus:ring-navy-900/20 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Password Strength Meter ──────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const { score, label, color, width } = useMemo(() => {
    if (!password)
      return {
        score: 0,
        label: "",
        color: "bg-neutral-200",
        width: "0%",
      };
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;

    const levels = [
      { label: "Very Weak", color: "bg-red-500", width: "20%" },
      { label: "Weak", color: "bg-orange-500", width: "40%" },
      { label: "Fair", color: "bg-amber-500", width: "60%" },
      { label: "Strong", color: "bg-emerald-500", width: "80%" },
      { label: "Excellent", color: "bg-green-500", width: "100%" },
    ];
    const level = levels[Math.min(s, 4)];
    return { score: s, ...level };
  }, [password]);

  if (!password) return null;

  return (
    <motion.div
      className="space-y-1.5"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Password strength
        </span>
        <span
          className={`text-[10px] font-black uppercase tracking-wider ${
            score <= 1
              ? "text-red-500"
              : score <= 2
                ? "text-orange-500"
                : score <= 3
                  ? "text-amber-500"
                  : "text-emerald-600"
          }`}
        >
          {label}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Turnstile Widget (extracted to reduce duplication) ───────
function TurnstileWidget({
  turnstileRef,
  setCaptchaToken,
  isTurnstileLoaded,
  setIsTurnstileLoaded,
}: {
  turnstileRef: React.RefObject<any>;
  setCaptchaToken: (t: string | null) => void;
  isTurnstileLoaded: boolean;
  setIsTurnstileLoaded: (v: boolean) => void;
}) {
  if (!import.meta.env.VITE_TURNSTILE_SITE_KEY) {
    return import.meta.env.DEV ? (
      <div className="text-center py-2 text-[10px] text-amber-600 font-medium">
        ⚠️ Turnstile Disabled (No Site Key)
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col items-center py-2 relative min-h-[65px] justify-center">
      <AnimatePresence>
        {!isTurnstileLoaded && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 z-10 pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
            </div>
            <span className="text-[10px] font-black text-slate-400 mt-2 tracking-widest uppercase">
              Initializing Security
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <Turnstile
        ref={turnstileRef}
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
        onSuccess={(token) => {
          setCaptchaToken(token);
          setIsTurnstileLoaded(true);
        }}
        onExpire={() => {
          setCaptchaToken(null);
          setIsTurnstileLoaded(false);
          turnstileRef.current?.reset();
        }}
        onError={() => {
          setCaptchaToken(null);
          setIsTurnstileLoaded(false);
        }}
        onLoad={() => setIsTurnstileLoaded(true)}
      />
    </div>
  );
}

// ─── Main Signin Component ────────────────────────────────────
export default function Signin({ type }: SigninProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"signin" | "forgot" | "verifyOtp">(
    "signin",
  );
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);
  const [resetToken, setResetToken] = useRecoilState(resetTokenState);

  const [isLoading, setIsLoading] = useState(false);
  const [isTurnstileLoaded, setIsTurnstileLoaded] = useState(false);
  const [authState] = useRecoilState(is_authenticated);
  const setAdmin = useSetRecoilState<any>(adminUsername);
  const setAuth = useSetRecoilState(is_authenticated);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    const hasToken =
      localStorage.getItem("student_token") ||
      localStorage.getItem("admin_token") ||
      localStorage.getItem("faculty_token");

    if (authState.is_authenticated && hasToken) {
      const redirectPath =
        authState.type === "student"
          ? "/student"
          : authState.type === "admin"
            ? "/admin"
            : "/faculty";
      navigate(redirectPath, { replace: true });
    }
  }, [authState, navigate, type]);

  // Force reset state when switching between login modes
  useEffect(() => {
    setUsername("");
    setPassword("");
    setOtp("");
    setNewPassword("");
    setStep("signin");
    setIsLoading(false);
  }, [type]);

  const sendDataToBackend = useCallback(async () => {
    if (username.trim() === "" || password.trim() === "") {
      toast.error("Username and password are required");
      return;
    }

    const isStudentFormat = /^[A-Z]\d+/i.test(username.trim());

    if (type === "student" && !isStudentFormat) {
      toast.error(
        "Student username must be a valid University ID (e.g., O210001 or S220059)",
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
          username:
            type === "student"
              ? username.trim().toUpperCase()
              : username.trim(),
          password: password.trim(),
          captchaToken: captchaToken,
        }),
      });

      if (!data) {
        turnstileRef.current?.reset?.();
        setCaptchaToken(null);
        return;
      }

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
        setAuth({ is_authenticated: true, type: "student" });
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
        setAuth({ is_authenticated: true, type: "faculty" });
        toast.success(`Welcome Professor ${username.trim()}!`);
        navigate("/faculty", { replace: true });
      } else if (type === "admin" && (token || data.success)) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("faculty_token");
        localStorage.setItem("admin_token", token);
        localStorage.setItem("username", username.trim());
        localStorage.setItem("admin_role", (data as any).role || "admin");

        setAuth({ is_authenticated: true, type: "admin" });
        setAdmin(username.trim());
        toast.success("Welcome back, Admin!");
        setTimeout(() => navigate("/admin", { replace: true }), 100);
      } else if (type === "faculty" && token) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("admin_token");
        localStorage.setItem("faculty_token", token);
        localStorage.setItem("username", username.trim());
        localStorage.setItem("role", (data as any).role);
        setAuth({ is_authenticated: true, type: "faculty" });
        toast.success(`Welcome Professor ${username.trim()}!`);
        navigate("/faculty", { replace: true });
      } else {
        toast.error("Access denied: Invalid credentials for this portal.");
      }
    } catch (error: any) {
      console.error("Signin failed:", error);
      turnstileRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    username,
    password,
    type,
    captchaToken,
    navigate,
    setAuth,
    setAdmin,
  ]);

  const requestOtp = useCallback(async () => {
    if (username.trim() === "") {
      toast.error("Please enter your email/ID");
      return;
    }

    const isStudentFormat = /^[A-Z]\d+/i.test(username.trim());

    if (type === "student" && !isStudentFormat) {
      toast.error("Student ID must be a valid University ID (e.g., O210001 or S220059)");
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
        body: JSON.stringify({
          username: username.trim(),
          captchaToken: captchaToken,
        }),
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
  }, [username, type, captchaToken]);

  const requestEmailOtp = useCallback(async () => {
    const isStudentFormat = /^[A-Z]\d+/i.test(username.trim());

    if (type === "student" && !isStudentFormat) {
      toast.error("Student ID must be a valid University ID (e.g., O210001 or S220059)");
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
        body: JSON.stringify({
          username: username.trim(),
          captchaToken: captchaToken,
        }),
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
  }, [username, type, captchaToken]);

  const handleVerifyOtp = useCallback(async () => {
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
  }, [otp, username, setResetToken]);

  const resetPassword = useCallback(async () => {
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
  }, [newPassword, username, resetToken, setResetToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "signin") sendDataToBackend();
    if (step === "forgot") requestOtp();
    if (step === "verifyOtp") resetPassword();
  };

  const dashboardLabel =
    type === "student"
      ? "Student Login"
      : type === "faculty"
        ? "Faculty Portal"
        : "Administrator Portal";

  const stepSubtitle =
    step === "signin"
      ? "Enter your credentials to access the portal"
      : step === "forgot"
        ? "We'll send an OTP to your registered ID"
        : "Verify your identity to proceed";

  const stepTitle =
    step === "signin"
      ? dashboardLabel
      : step === "forgot"
        ? "Reset Password"
        : "New Credentials";

  return (
    <div className="min-h-screen bg-white relative">
      <Button
        variant="ghost"
        className="absolute top-6 left-4 md:top-8 md:left-8 p-2 text-slate-500 hover:text-slate-900 transition-all z-50 flex items-center gap-1.5 font-bold text-sm"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back to Home</span>
      </Button>

      <LoginScreen
        isLogin={step === "signin"}
        title={stepTitle}
        subtitle={stepSubtitle}
        heroTitle={undefined}
        bottomText="Rgukt Ongole"
        role={type}
        stepKey={step}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ─── Sign In Step ─────────────────────────── */}
          {step === "signin" && (
            <div className="space-y-4">
              <Input
                label="Username / ID"
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  type === "student"
                    ? "University ID (e.g. O210001 or S220059)"
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

              <TurnstileWidget
                turnstileRef={turnstileRef}
                setCaptchaToken={setCaptchaToken}
                isTurnstileLoaded={isTurnstileLoaded}
                setIsTurnstileLoaded={setIsTurnstileLoaded}
              />

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm text-navy-900 hover:text-navy-800 font-bold transition-all hover:underline underline-offset-4"
                  onClick={() => setStep("forgot")}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-[15px] font-bold shadow-xl shadow-navy-100 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                size="lg"
                isLoading={isLoading}
                type="submit"
                disabled={
                  !!import.meta.env.VITE_TURNSTILE_SITE_KEY && !captchaToken
                }
              >
                <span className="relative z-10">Sign In</span>
                <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                {!!import.meta.env.VITE_TURNSTILE_SITE_KEY &&
                  !captchaToken &&
                  username &&
                  password && (
                    <span className="absolute -bottom-6 left-0 w-full text-center text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
                      Awaiting Security Verification...
                    </span>
                  )}
              </Button>
            </div>
          )}

          {/* ─── Forgot Password Step ─────────────────── */}
          {step === "forgot" && (
            <div className="space-y-4">
              <Input
                label="Student / Staff ID"
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                placeholder="Enter your ID to receive OTP"
                className="h-12"
              />

              <TurnstileWidget
                turnstileRef={turnstileRef}
                setCaptchaToken={setCaptchaToken}
                isTurnstileLoaded={isTurnstileLoaded}
                setIsTurnstileLoaded={setIsTurnstileLoaded}
              />

              <Button
                className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-[15px] font-bold disabled:opacity-50 relative overflow-hidden group"
                size="lg"
                isLoading={isLoading}
                onClick={requestOtp}
                disabled={
                  !!import.meta.env.VITE_TURNSTILE_SITE_KEY &&
                  !import.meta.env.DEV &&
                  !captchaToken
                }
              >
                <span className="relative z-10">Send OTP</span>
                <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
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

          {/* ─── Verify OTP / Reset Password Step ─────── */}
          {step === "verifyOtp" && (
            <div className="space-y-5">
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={!!resetToken}
              />

              {!resetToken && (
                <div className="space-y-4">
                  <Button
                    className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-[15px] font-bold relative overflow-hidden group"
                    size="lg"
                    isLoading={isLoading}
                    onClick={handleVerifyOtp}
                  >
                    <span className="relative z-10">Verify OTP</span>
                    <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                  </Button>
                  <div className="text-center space-y-3">
                    <button
                      type="button"
                      className="text-[11px] text-slate-500 hover:text-slate-900 font-bold uppercase tracking-widest underline underline-offset-4 transition-all disabled:opacity-50"
                      onClick={requestEmailOtp}
                      disabled={
                        isLoading ||
                        (!!import.meta.env.VITE_TURNSTILE_SITE_KEY &&
                          !import.meta.env.DEV &&
                          !captchaToken)
                      }
                    >
                      Resend via Email
                    </button>

                    <TurnstileWidget
                      turnstileRef={turnstileRef}
                      setCaptchaToken={setCaptchaToken}
                      isTurnstileLoaded={isTurnstileLoaded}
                      setIsTurnstileLoaded={setIsTurnstileLoaded}
                    />
                  </div>
                </div>
              )}

              {!!resetToken && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {/* OTP Verified badge */}
                  <div className="flex items-center justify-center gap-2 py-2">
                    <motion.div
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">
                        OTP Verified
                      </span>
                    </motion.div>
                  </div>

                  <Input
                    label="New Secure Password"
                    type="password"
                    icon={<Lock className="w-4 h-4" />}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="h-12"
                  />
                  <PasswordStrength password={newPassword} />
                  <Button
                    className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-[15px] font-bold relative overflow-hidden group"
                    size="lg"
                    isLoading={isLoading}
                    onClick={resetPassword}
                  >
                    <span className="relative z-10">Set New Password</span>
                    <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </form>
      </LoginScreen>
    </div>
  );
}
