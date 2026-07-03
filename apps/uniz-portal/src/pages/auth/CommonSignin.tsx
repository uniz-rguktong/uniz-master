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
import { parseJwt } from "../../utils/security";
import {
  User,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Mail,
} from "lucide-react";
import LoginScreen from "../../components/ui/login-1";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";
import { Turnstile } from "@marsidev/react-turnstile";
import { motion } from "framer-motion";
import { prepareStudentSession } from "../../utils/studentSessionCache";

type SigninProps = {
  type: "student" | "admin" | "faculty";
};

const isStudentIdFormat = (value: string) => /^[A-Z]\d+/i.test(value.trim());
const isEmailFormat = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidStudentLoginId = (value: string) =>
  isStudentIdFormat(value) || isEmailFormat(value);

function normalizeLoginIdentifier(
  value: string,
  type: SigninProps["type"],
): string {
  const trimmed = value.trim().toLowerCase();
  if (type === "student") return trimmed;
  return value.trim();
}

/** Only normalize the issued default password; leave custom passwords unchanged. */
function normalizeStudentPassword(
  password: string,
  username: string,
): string {
  const trimmed = password.trim();
  if (!/^[a-z]\d+@rguktong$/i.test(trimmed)) return trimmed;
  const id = username.includes("@")
    ? trimmed.slice(0, -"@rguktong".length)
    : username.toLowerCase();
  return `${id.toLowerCase()}@rguktong`;
}

function validateLoginIdentifier(
  value: string,
  type: SigninProps["type"],
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Please enter your email/ID";

  if (type === "student") {
    if (!isValidStudentLoginId(trimmed)) {
      return "Enter a valid university ID or email (e.g., o210001 or o210001@rguktong.ac.in)";
    }
    return null;
  }

  if (isStudentIdFormat(trimmed)) {
    return `Students are not allowed to access the ${type === "admin" ? "Admin" : "Faculty"} Portal`;
  }
  if (trimmed.includes("@") && !isEmailFormat(trimmed)) {
    return "Enter a valid staff ID or university email address";
  }
  return null;
}

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

const CAPTCHA_WAIT_MS = 6_000;

function warmTurnstile(
  turnstileRef: React.RefObject<{ execute?: () => void } | null>,
  captchaTokenRef: React.MutableRefObject<string | null>,
) {
  if (!requiresCaptcha() || captchaTokenRef.current) return;
  turnstileRef.current?.execute?.();
}

function waitForCaptchaToken(
  captchaTokenRef: React.MutableRefObject<string | null>,
  timeoutMs: number,
): Promise<string | null> {
  if (captchaTokenRef.current) {
    return Promise.resolve(captchaTokenRef.current);
  }

  return new Promise((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (captchaTokenRef.current) {
        window.clearInterval(timer);
        resolve(captchaTokenRef.current);
      } else if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 80);
  });
}

async function ensureCaptchaToken(
  captchaTokenRef: React.MutableRefObject<string | null>,
  turnstileRef: React.RefObject<{ execute?: () => void } | null>,
  onWaitingChange?: (waiting: boolean) => void,
): Promise<boolean> {
  if (!requiresCaptcha()) {
    return true;
  }

  if (captchaTokenRef.current) {
    return true;
  }

  turnstileRef.current?.execute?.();
  onWaitingChange?.(true);
  const token = await waitForCaptchaToken(captchaTokenRef, CAPTCHA_WAIT_MS);
  onWaitingChange?.(false);

  if (!token) {
    turnstileRef.current?.execute?.();
    toast.error(
      "Security check is still loading. Wait a moment and try again.",
    );
    return false;
  }

  return true;
}

/** Visible compact Turnstile — faster on mobile than invisible (no background hang). */
function TurnstileWidget({
  turnstileRef,
  captchaTokenRef,
  onTokenChange,
  onStatusChange,
}: {
  turnstileRef: React.RefObject<any>;
  captchaTokenRef: React.MutableRefObject<string | null>;
  onTokenChange: (token: string | null) => void;
  onStatusChange: (status: "loading" | "ready" | "error") => void;
}) {
  if (!turnstileEnabled()) {
    return import.meta.env.DEV ? (
      <p className="text-center text-[11px] text-amber-600 font-medium py-1">
        Turnstile not configured (no site key)
      </p>
    ) : null;
  }

  return (
    <div className="flex min-h-[65px] items-center justify-center">
      <Turnstile
        ref={turnstileRef}
        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
        scriptOptions={{ async: true, defer: true, appendTo: "head" }}
        options={{
          theme: "light",
          size: "normal",
          action: "login",
          retry: "auto",
          "refresh-expired": "auto",
        }}
        onSuccess={(token) => {
          captchaTokenRef.current = token;
          onTokenChange(token);
          onStatusChange("ready");
        }}
        onExpire={() => {
          captchaTokenRef.current = null;
          onTokenChange(null);
          onStatusChange("loading");
          turnstileRef.current?.reset();
        }}
        onError={() => {
          captchaTokenRef.current = null;
          onTokenChange(null);
          onStatusChange("error");
        }}
        onLoad={() => {
          onStatusChange("loading");
        }}
      />
    </div>
  );
}

function CaptchaStatus({
  status,
  hasToken,
  waitingOnSubmit,
}: {
  status: "loading" | "ready" | "error";
  hasToken: boolean;
  waitingOnSubmit?: boolean;
}) {
  if (!requiresCaptcha()) {
    return null;
  }

  // Submit button already shows progress — avoid duplicate spinners.
  if (waitingOnSubmit) {
    return null;
  }

  if (status === "error") {
    return (
      <div
        className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-center"
        role="alert"
      >
        <p className="text-[11px] font-medium text-amber-800">
          Security check could not load. Refresh the page or check your connection.
        </p>
      </div>
    );
  }

  if (hasToken || status === "ready") {
    return (
      <div
        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5"
        role="status"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <p className="text-[11px] font-medium text-emerald-700">
          Security check complete
        </p>
      </div>
    );
  }

  return null;
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
  const [captchaStatus, setCaptchaStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [waitingForCaptcha, setWaitingForCaptcha] = useState(false);
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
    setWaitingForCaptcha(false);
  }, [type]);

  const captchaReady = !requiresCaptcha() || !!captchaToken;

  const sendDataToBackend = useCallback(async () => {
    if (username.trim() === "" || password.trim() === "") {
      toast.error("Username and password are required");
      return;
    }

    const idError = validateLoginIdentifier(username, type);
    if (idError) {
      toast.error(idError);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      if (requiresCaptcha() && !captchaTokenRef.current) {
        toast.error("Complete the security checkbox above, then try again.");
        return;
      }

      setIsLoading(true);

      const data = await apiClient<SigninResponse>(SIGNIN(type), {
        method: "POST",
        body: JSON.stringify({
          username: normalizeLoginIdentifier(username, type),
          password:
            type === "student"
              ? normalizeStudentPassword(password, normalizeLoginIdentifier(username, type))
              : password.trim(),
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
      setWaitingForCaptcha(false);
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

    const idError = validateLoginIdentifier(username, type);
    if (idError) {
      toast.error(idError);
      return;
    }

    try {
      if (
        !(await ensureCaptchaToken(
          captchaTokenRef,
          turnstileRef,
          setWaitingForCaptcha,
        ))
      ) {
        return;
      }

      setIsLoading(true);

      const data = await apiClient<{
        success: boolean;
        message?: string;
        deliveryMethod?: "push" | "email";
        email?: string;
      }>(FORGOT_PASS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          username: normalizeLoginIdentifier(username, type),
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
        turnstileRef.current?.reset?.();
        syncCaptchaToken(null);
        setCaptchaStatus("loading");
        setStep("verifyOtp");
      }
    } finally {
      setIsLoading(false);
      setWaitingForCaptcha(false);
    }
  }, [username, type, syncCaptchaToken]);

  const requestEmailOtp = useCallback(async () => {
    const idError = validateLoginIdentifier(username, type);
    if (idError) {
      toast.error(idError);
      return;
    }

    try {
      setIsLoading(true);

      const data = await apiClient<{
        success: boolean;
        message?: string;
        deliveryMethod?: "email";
      }>(REQUEST_OTP_EMAIL_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          username: normalizeLoginIdentifier(username, type),
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
      setWaitingForCaptcha(false);
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
          username: normalizeLoginIdentifier(username, type),
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
  }, [otp, username, type, setResetToken]);

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
            username: normalizeLoginIdentifier(username, type),
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
  }, [newPassword, username, type, resetToken, setResetToken]);

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
        ? "Use your university ID or college email and password"
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
        bottomText={UNIZ_CAMPUS_LABEL}
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
                    ? "University ID or email"
                    : "Staff ID or email"
                }
                labelClassName={loginLabelClass}
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) =>
                  setUsername(
                    type === "student"
                      ? e.target.value.toLowerCase()
                      : e.target.value,
                  )
                }
                placeholder={
                  type === "student"
                    ? "o210001 or o210001@rguktong.ac.in"
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

              {requiresCaptcha() && (
                <TurnstileWidget
                  turnstileRef={turnstileRef}
                  captchaTokenRef={captchaTokenRef}
                  onTokenChange={syncCaptchaToken}
                  onStatusChange={setCaptchaStatus}
                />
              )}

              {requiresCaptcha() && (
                <CaptchaStatus
                  status={captchaStatus}
                  hasToken={!!captchaToken}
                  waitingOnSubmit={waitingForCaptcha}
                />
              )}

              <Button
                className={loginBtnClass}
                size="lg"
                isLoading={isLoading}
                type="submit"
                disabled={
                  !username.trim() ||
                  !password.trim() ||
                  (requiresCaptcha() && !captchaReady)
                }
              >
                <span className="relative z-10">
                  {isLoading
                    ? "Signing in…"
                    : requiresCaptcha() && !captchaReady
                      ? "Complete security check"
                      : "Continue"}
                </span>
                <span className={loginBtnShimmer} />
              </Button>
            </div>
          )}

          {/* ─── Forgot Password Step ─────────────────── */}
          {step === "forgot" && (
            <div className="space-y-4">
              <Input
                label={
                  type === "student"
                    ? "University ID or email"
                    : "Staff ID or email"
                }
                labelClassName={loginLabelClass}
                icon={<User className="w-4 h-4" />}
                value={username}
                onChange={(e) =>
                  setUsername(
                    type === "student"
                      ? e.target.value.toLowerCase()
                      : e.target.value,
                  )
                }
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                placeholder={
                  type === "student"
                    ? "o210001 or o210001@rguktong.ac.in"
                    : "username or email@rguktong.ac.in"
                }
                className={loginInputWithIconClass}
              />

              {requiresCaptcha() && (
                <TurnstileWidget
                  turnstileRef={turnstileRef}
                  captchaTokenRef={captchaTokenRef}
                  onTokenChange={syncCaptchaToken}
                  onStatusChange={setCaptchaStatus}
                />
              )}

              {requiresCaptcha() && (
                <CaptchaStatus
                  status={captchaStatus}
                  hasToken={!!captchaToken}
                  waitingOnSubmit={waitingForCaptcha}
                />
              )}

              <Button
                className={loginBtnClass}
                size="lg"
                isLoading={isLoading}
                onClick={requestOtp}
                disabled={!username.trim() || (requiresCaptcha() && !captchaReady)}
              >
                <span className="relative z-10">
                  {isLoading
                    ? "Sending…"
                    : requiresCaptcha() && !captchaReady
                      ? "Complete security check"
                      : "Send code"}
                </span>
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

                  <div className="rounded-2xl border border-[#D4E8F5] bg-[#F7FAFD] p-4 space-y-3">
                    <p className="text-[12px] font-medium text-[#0F3B63] text-center leading-relaxed">
                      Didn&apos;t get a push notification? Send the code to your
                      registered college email instead.
                    </p>
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#0B2A47] bg-white px-4 py-3 text-[14px] font-bold text-[#0B2A47] shadow-sm transition-all hover:bg-[#0B2A47] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={requestEmailOtp}
                      disabled={isLoading}
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      {isLoading ? "Sending to email…" : "Resend via Email"}
                    </button>
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
