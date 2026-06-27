/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useRecoilState, useSetRecoilState } from "recoil";
import { adminUsername, is_authenticated, resetTokenState } from "../../store";
import { useNavigate } from "react-router-dom";
import { toast } from "@/utils/toast-ref";
import { cn } from "@/lib/utils";
import {
  SIGNIN,
  FORGOT_PASS_ENDPOINT,
  VERIFY_OTP_ENDPOINT,
  SET_NEW_PASS_ENDPOINT,
  REQUEST_OTP_EMAIL_ENDPOINT,
} from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";
import { parseJwt } from "../../utils/security";
import {
  User,
  Lock,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import LoginScreen from "../../components/ui/login-1";
import { TurnstileLoadingPlaceholder } from "../../components/ui/TurnstileLoadingPlaceholder";
import { Turnstile } from "@marsidev/react-turnstile";
import { motion, AnimatePresence } from "framer-motion";
import { prepareStudentSession } from "../../utils/studentSessionCache";

type SigninProps = {
  type: "student" | "admin" | "faculty";
};

const isStudentIdFormat = (value: string) => /^[A-Z]\d+/i.test(value.trim());
const isEmailFormat = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

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
      <label className="text-[10px] font-semibold text-zinc-400 tracking-[0.14em] block ml-1">
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
            className="w-12 h-14 text-center text-xl font-semibold rounded-2xl border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        color: "bg-zinc-200",
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
      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold tracking-wider text-zinc-400">
          Password strength
        </span>
        <span
          className={`text-[10px] font-semibold tracking-wider ${
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

// ─── Shared login styles ──────────────────────────────────────
const loginLabelClass =
  "text-[12px] font-medium text-zinc-600 normal-case tracking-normal mb-1.5";

const loginInputClass =
  "login-field !h-11 !rounded-xl !border-zinc-200 !bg-zinc-50/50 !text-[15px] !font-normal placeholder:!text-zinc-400 focus:!bg-white focus:!border-zinc-900 focus:!ring-2 focus:!ring-zinc-900/5 !shadow-none hover:!border-zinc-300 transition-all";

const loginInputWithIconClass = `${loginInputClass} !pl-10 !pr-3.5`;

const loginInputPasswordClass = `${loginInputClass} !pl-10 !pr-10`;

const loginBtnClass =
  "!rounded-xl w-full h-11 bg-zinc-950 hover:bg-zinc-800 text-white text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group transition-all duration-200 !hover:translate-y-0 shadow-[0_1px_2px_rgba(10,10,10,0.12)]";

const loginBtnShimmer =
  "pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]";

const TURNSTILE_TEST_SITE_KEY_PREFIX = "1x00000000000000000000AA";

function isLocalTestTurnstile() {
  const key = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
  return import.meta.env.DEV && key.startsWith(TURNSTILE_TEST_SITE_KEY_PREFIX);
}

function turnstileEnabled() {
  return !!import.meta.env.VITE_TURNSTILE_SITE_KEY;
}

function requiresCaptcha() {
  return turnstileEnabled() && !isLocalTestTurnstile();
}

function useCompactTurnstile() {
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 639px)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return compact;
}

/** Warm Cloudflare Turnstile script as soon as the sign-in form mounts. */
function useTurnstileScriptPreload() {
  useEffect(() => {
    const src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    if (document.querySelector(`script[src^="${src}"]`)) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = src;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  }, []);
}

/** Visible Cloudflare Turnstile — standard managed challenge */
function TurnstileWidget({
  turnstileRef,
  captchaTokenRef,
  onTokenChange,
}: {
  turnstileRef: React.RefObject<any>;
  captchaTokenRef: React.MutableRefObject<string | null>;
  onTokenChange: (token: string | null) => void;
}) {
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const compact = useCompactTurnstile();
  useTurnstileScriptPreload();

  if (!turnstileEnabled()) {
    return import.meta.env.DEV ? (
      <p className="text-center text-[11px] text-amber-600 font-medium py-1">
        Turnstile not configured (no site key)
      </p>
    ) : null;
  }

  return (
    <div
      className={cn(
        "relative flex w-full max-w-full flex-col items-center justify-center overflow-hidden rounded-xl px-1 py-2 sm:px-2 sm:py-2.5",
        isVerified
          ? "min-h-0 border-0 bg-transparent"
          : "min-h-[64px] border border-zinc-100 bg-zinc-50/60 sm:min-h-[72px]",
      )}
    >
      <AnimatePresence mode="wait">
        {!isWidgetReady && !isVerified && (
          <motion.div
            key="loading"
            className="absolute inset-0 z-10 flex items-center justify-center px-1"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <TurnstileLoadingPlaceholder compact={compact} />
          </motion.div>
        )}
        {isVerified && (
          <motion.div
            key="verified"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full max-w-full items-center gap-3 rounded-md border border-emerald-200/80 bg-emerald-50/90 px-3 py-2.5 sm:max-w-[302px] sm:px-4 sm:py-3"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-emerald-800">
                Security check passed
              </p>
              <p className="text-[10px] font-medium text-emerald-600/80">
                You can continue to sign in
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={
          isVerified
            ? "sr-only h-0 overflow-hidden"
            : cn(
                "flex w-full max-w-full justify-center",
                compact ? "min-h-[56px]" : "min-h-[65px]",
                !isWidgetReady && "invisible",
              )
        }
        aria-hidden={isVerified}
      >
        <Turnstile
          ref={turnstileRef}
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          scriptOptions={{ async: true }}
          options={{
            theme: "light",
            size: compact ? "compact" : "normal",
            appearance: "always",
          }}
          onSuccess={(token) => {
            captchaTokenRef.current = token;
            onTokenChange(token);
            setIsVerified(true);
            setIsWidgetReady(true);
          }}
          onExpire={() => {
            captchaTokenRef.current = null;
            onTokenChange(null);
            setIsVerified(false);
            setIsWidgetReady(false);
            turnstileRef.current?.reset();
          }}
          onError={() => {
            captchaTokenRef.current = null;
            onTokenChange(null);
            setIsVerified(false);
            setIsWidgetReady(false);
          }}
          onLoad={() => setIsWidgetReady(true)}
        />
      </div>
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
  const captchaTokenRef = useRef<string | null>(null);
  const turnstileRef = useRef<any>(null);
  const [resetToken, setResetToken] = useRecoilState(resetTokenState);

  const [isLoading, setIsLoading] = useState(false);

  const syncCaptchaToken = useCallback((token: string | null) => {
    captchaTokenRef.current = token;
    setCaptchaToken(token);
  }, []);
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

    const isStudentFormat = isStudentIdFormat(username);

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

    if (
      (type === "admin" || type === "faculty") &&
      !isStudentFormat &&
      username.includes("@") &&
      !isEmailFormat(username)
    ) {
      toast.error("Enter a valid staff ID or university email address");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      if (requiresCaptcha() && !captchaTokenRef.current) {
        toast.error("Please complete the security check below.");
        return;
      }

      const data = await apiClient<SigninResponse>(SIGNIN(type), {
        method: "POST",
        body: JSON.stringify({
          username:
            type === "student"
              ? username.trim().toUpperCase()
              : username.trim(),
          password: password.trim(),
          captchaToken: captchaTokenRef.current,
        }),
      });

      if (!data) {
        turnstileRef.current?.reset?.();
        syncCaptchaToken(null);
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
      const resolvedUsername = data.username || username.trim();

      if (type === "student" && token && data.role === "student") {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("faculty_token");
        localStorage.setItem("student_token", token);
        localStorage.setItem("username", resolvedUsername);
        prepareStudentSession(resolvedUsername);
        setAuth({ is_authenticated: true, type: "student" });
        toast.success(`Welcome back, ${resolvedUsername}.`, {
          title: "Signed in",
        });
        navigate("/student", { replace: true });
      } else if (
        type === "admin" &&
        (data.role === "teacher" || data.role === "faculty") &&
        (token || data.success)
      ) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("admin_token");
        localStorage.setItem("faculty_token", token || "");
        localStorage.setItem("username", resolvedUsername);
        localStorage.setItem("role", data.role || "teacher");
        setAuth({ is_authenticated: true, type: "faculty" });
        toast.success(`Welcome, Professor ${resolvedUsername}.`, {
          title: "Signed in",
        });
        navigate("/faculty", { replace: true });
      } else if (type === "admin" && (token || data.success)) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("faculty_token");
        localStorage.setItem("admin_token", token);
        localStorage.setItem("username", resolvedUsername);
        const jwtRole = token ? parseJwt(token)?.role : null;
        const jwtDept = token ? parseJwt(token)?.department : null;
        localStorage.setItem(
          "admin_role",
          (jwtRole || (data as any).role || "admin").toLowerCase(),
        );
        if (jwtDept) {
          localStorage.setItem("department", jwtDept);
        }

        setAuth({ is_authenticated: true, type: "admin" });
        setAdmin(resolvedUsername);
        toast.success("Your admin session is ready.", {
          title: "Signed in",
        });
        setTimeout(() => navigate("/admin", { replace: true }), 100);
      } else if (type === "faculty" && token) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("admin_token");
        localStorage.setItem("faculty_token", token);
        localStorage.setItem("username", resolvedUsername);
        localStorage.setItem("role", (data as any).role);
        setAuth({ is_authenticated: true, type: "faculty" });
        toast.success(`Welcome, Professor ${resolvedUsername}.`, {
          title: "Signed in",
        });
        navigate("/faculty", { replace: true });
      } else {
        toast.error("Access denied: Invalid credentials for this portal.");
      }
    } catch (error: any) {
      console.error("Signin failed:", error);
      turnstileRef.current?.reset();
      syncCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    username,
    password,
    type,
    navigate,
    setAuth,
    setAdmin,
    syncCaptchaToken,
  ]);

  const requestOtp = useCallback(async () => {
    if (username.trim() === "") {
      toast.error("Please enter your email/ID");
      return;
    }

    const isStudentFormat = isStudentIdFormat(username);

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

    if (
      (type === "admin" || type === "faculty") &&
      !isStudentFormat &&
      username.includes("@") &&
      !isEmailFormat(username)
    ) {
      toast.error("Enter a valid staff ID or university email address");
      return;
    }

    setIsLoading(true);
    try {
      if (requiresCaptcha() && !captchaTokenRef.current) {
        toast.error("Please complete the security check below.");
        return;
      }

      const data = await apiClient<{
        success: boolean;
        message?: string;
        deliveryMethod?: "push" | "email";
        email?: string;
      }>(FORGOT_PASS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          captchaToken: captchaTokenRef.current,
        }),
      });

      if (data && data.success) {
        const channel =
          data.deliveryMethod === "push"
            ? "your registered device"
            : "your registered email";
        toast.success(
          `Check ${channel} for your security code.`,
          {
            title: "Code sent",
            autoClose: 6000,
          },
        );
        setStep("verifyOtp");
      }
    } finally {
      setIsLoading(false);
    }
  }, [username, type]);

  const requestEmailOtp = useCallback(async () => {
    const isStudentFormat = isStudentIdFormat(username);

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

    if (
      (type === "admin" || type === "faculty") &&
      !isStudentFormat &&
      username.includes("@") &&
      !isEmailFormat(username)
    ) {
      toast.error("Enter a valid staff ID or university email address");
      return;
    }

    setIsLoading(true);
    try {
      if (requiresCaptcha() && !captchaTokenRef.current) {
        toast.error("Please complete the security check below.");
        return;
      }

      const data = await apiClient<{
        success: boolean;
        message?: string;
        deliveryMethod?: "email";
      }>(REQUEST_OTP_EMAIL_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          captchaToken: captchaTokenRef.current,
        }),
      });

      if (data && data.success) {
        toast.success("Check your email for the security code.", {
          title: "Code sent",
          autoClose: 6000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [username, type]);

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
        toast.success("You can now set a new password.", {
          title: "Code verified",
        });
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
        toast.success("Sign in with your new password.", {
          title: "Password updated",
        });
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
      ? "Sign in"
      : type === "faculty"
        ? "Faculty sign in"
        : "Admin sign in";

  const stepSubtitle =
    step === "signin"
      ? type === "student"
        ? "Use your university ID and password"
        : "Use your staff credentials"
      : step === "forgot"
        ? "We'll send a code to your registered email"
        : "Check your mail or notifications";

  const stepTitle =
    step === "signin"
      ? dashboardLabel
      : step === "forgot"
        ? "Reset password"
        : "New password";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <LoginScreen
        isLogin={step === "signin"}
        onBack={() => navigate("/")}
        title={stepTitle}
        subtitle={stepSubtitle}
        heroTitle={undefined}
        bottomText="RGUKT Ongole"
        role={type}
        stepKey={step}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ─── Sign In Step ─────────────────────────── */}
          {step === "signin" && (
            <div className="space-y-4">
              <Input
                label={
                  type === "student"
                    ? "University ID"
                    : "Staff ID or email"
                }
                labelClassName={loginLabelClass}
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  type === "student"
                    ? "O210001"
                    : "username or email@rguktong.ac.in"
                }
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                className={loginInputWithIconClass}
              />
              <div className="space-y-1">
                <Input
                  label="Password"
                  labelClassName={loginLabelClass}
                  type="password"
                  icon={<Lock className="w-4 h-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className={loginInputPasswordClass}
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    className="text-[12px] text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                    onClick={() => setStep("forgot")}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <TurnstileWidget
                turnstileRef={turnstileRef}
                captchaTokenRef={captchaTokenRef}
                onTokenChange={syncCaptchaToken}
              />

              <Button
                className={loginBtnClass}
                size="lg"
                isLoading={isLoading}
                type="submit"
                disabled={requiresCaptcha() && !captchaToken}
              >
                <span className="relative z-10">Continue</span>
                <span className={loginBtnShimmer} />
              </Button>
            </div>
          )}

          {/* ─── Forgot Password Step ─────────────────── */}
          {step === "forgot" && (
            <div className="space-y-4">
              <Input
                label="University ID"
                labelClassName={loginLabelClass}
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                placeholder="Enter your ID"
                className={loginInputWithIconClass}
              />

              <TurnstileWidget
                turnstileRef={turnstileRef}
                captchaTokenRef={captchaTokenRef}
                onTokenChange={syncCaptchaToken}
              />

              <Button
                className={loginBtnClass}
                size="lg"
                isLoading={isLoading}
                onClick={requestOtp}
                disabled={requiresCaptcha() && !captchaToken}
              >
                <span className="relative z-10">Send code</span>
                <span className={loginBtnShimmer} />
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="inline-flex items-center text-[13px] text-zinc-400 hover:text-zinc-950 font-medium transition-colors group"
                  onClick={() => setStep("signin")}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
                  Back to sign in
                </button>
              </div>
            </div>
          )}

          {/* ─── Verify OTP / Reset Password Step ─────── */}
          {step === "verifyOtp" && (
            <div className="space-y-4">
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={!!resetToken}
              />

              {!resetToken && (
                <div className="space-y-4">
                  <Button
                    className={loginBtnClass}
                    size="lg"
                    isLoading={isLoading}
                    onClick={handleVerifyOtp}
                  >
                    <span className="relative z-10">Verify OTP</span>
                    <span className={loginBtnShimmer} />
                  </Button>
                  <div className="text-center space-y-3">
                    <button
                      type="button"
                      className="text-[11px] text-zinc-500 hover:text-zinc-950 font-semibold tracking-wider transition-all disabled:opacity-50"
                      onClick={requestEmailOtp}
                      disabled={isLoading || (requiresCaptcha() && !captchaToken)}
                    >
                      Resend via Email
                    </button>

                    <TurnstileWidget
                      turnstileRef={turnstileRef}
                      captchaTokenRef={captchaTokenRef}
                      onTokenChange={syncCaptchaToken}
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
                      <span className="text-[11px] font-semibold text-emerald-700 tracking-[0.14em]">
                        OTP Verified
                      </span>
                    </motion.div>
                  </div>

                  <Input
                    label="New password"
                    labelClassName={loginLabelClass}
                    type="password"
                    icon={<Lock className="w-4 h-4" />}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className={loginInputPasswordClass}
                  />
                  <PasswordStrength password={newPassword} />
                  <Button
                    className={loginBtnClass}
                    size="lg"
                    isLoading={isLoading}
                    onClick={resetPassword}
                  >
                    <span className="relative z-10">Set new password</span>
                    <span className={loginBtnShimmer} />
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
