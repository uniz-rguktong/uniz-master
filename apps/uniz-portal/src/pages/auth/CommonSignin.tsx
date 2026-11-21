/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useRecoilState, useSetRecoilState } from "recoil";
import { adminUsername, is_authenticated, resetTokenState } from "../../store";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { User, Lock, ArrowLeft, Mail } from "lucide-react";
import LoginScreen from "../../components/ui/login-1";
import { UNIZ_CAMPUS_LABEL } from "@/constants/branding";
import { Turnstile } from "@marsidev/react-turnstile";
import { motion } from "framer-motion";
import { prepareStudentSession } from "../../utils/studentSessionCache";
import { cn } from "@/lib/utils";
import { getSafeReturnUrl } from "@/utils/returnUrl";
import { TurnstileLoadingPlaceholder } from "../../components/ui/TurnstileLoadingPlaceholder";
import { prefetchTurnstile } from "../../utils/prefetchTurnstile";
import { Alert } from "@/components/ui/alert";
import {
  portalGhostButtonClass,
  portalInputClass,
  portalLabelClass,
  portalSecondaryButtonClass,
} from "@/lib/portal-ui";

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
function normalizeStudentPassword(password: string, username: string): string {
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
  username?: string;
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
      <label className={portalLabelClass}>Verification code</label>
      <div className="flex justify-center gap-2">
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
            className="h-14 w-12 rounded-md border border-border-strong bg-surface text-center font-sans text-2xl font-semibold text-head focus:border-navy-600 focus:shadow-[0_0_0_3px_var(--ring-soft)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring disabled:cursor-not-allowed disabled:opacity-[0.45] dark:focus:border-navy-300"
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
        color: "bg-border",
        width: "0%",
      };
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;

    const levels = [
      { label: "Very weak", color: "bg-error", width: "20%" },
      { label: "Weak", color: "bg-error", width: "40%" },
      { label: "Fair", color: "bg-warning", width: "60%" },
      { label: "Strong", color: "bg-success", width: "80%" },
      { label: "Excellent", color: "bg-success", width: "100%" },
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
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-caption font-medium text-text-3">
          Password strength
        </span>
        <span
          className={`text-caption font-medium ${
            score <= 2 ? "text-error" : score <= 3 ? "text-warning" : "text-success"
          }`}
        >
          {label}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Shared login styles (portal navy) ────────────────────────
const loginLabelClass = portalLabelClass;

const loginInputClass = cn(portalInputClass, "h-12 min-h-12");

const loginInputWithIconClass = cn(loginInputClass, "pl-11");

const loginInputPasswordClass = cn(loginInputClass, "pl-11 pr-12");

const loginBtnClass = "w-full";

const loginSecondaryBtnClass = cn(portalSecondaryButtonClass, "w-full");

const loginLinkBtnClass =
  "inline-flex min-h-11 items-center justify-center text-small font-medium text-link underline-offset-[1px] hover:underline";

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

const CAPTCHA_WAIT_MS = 4_000;

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

/** Turnstile — script prefetched at boot; placeholder until iframe ready. */
function TurnstileWidget({
  turnstileRef,
  captchaTokenRef,
  onTokenChange,
  onStatusChange,
  status,
}: {
  turnstileRef: React.RefObject<any>;
  captchaTokenRef: React.MutableRefObject<string | null>;
  onTokenChange: (token: string | null) => void;
  onStatusChange: (status: "loading" | "ready" | "error") => void;
  status: "loading" | "ready" | "error";
}) {
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    prefetchTurnstile();
  }, []);

  if (!turnstileEnabled()) {
    return import.meta.env.DEV ? (
      <p className="py-1 text-center text-caption font-medium text-warning">
        Turnstile not configured (no site key)
      </p>
    ) : null;
  }

  const showPlaceholder =
    !iframeReady && status !== "ready" && status !== "error";

  return (
    <div className="relative flex min-h-[65px] w-full items-center justify-center">
      {showPlaceholder && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center">
          <TurnstileLoadingPlaceholder />
        </div>
      )}
      <div
        className={cn(
          "flex w-full justify-center transition-opacity duration-150",
          showPlaceholder ? "opacity-0" : "opacity-100",
        )}
      >
        <Turnstile
          ref={turnstileRef}
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          scriptOptions={{
            id: "cf-turnstile-script",
            async: true,
            defer: true,
            appendTo: "head",
          }}
          options={{
            theme: "light",
            size: "flexible",
            action: "login",
            retry: "auto",
            retryInterval: 2000,
            refreshExpired: "auto",
            appearance: "always",
            execution: "render",
          }}
          onLoadScript={() => onStatusChange("loading")}
          onWidgetLoad={() => {
            setIframeReady(true);
            onStatusChange("loading");
          }}
          onBeforeInteractive={() => setIframeReady(true)}
          onSuccess={(token) => {
            captchaTokenRef.current = token;
            onTokenChange(token);
            setIframeReady(true);
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
            setIframeReady(true);
            onStatusChange("error");
          }}
        />
      </div>
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
      <Alert tone="warning">
        Security check could not load. Refresh the page or check your connection.
      </Alert>
    );
  }

  // "ready" without a token is a spent check (widget reset, callback not back yet).
  if (hasToken) {
    return <Alert tone="success">Security check complete</Alert>;
  }

  return null;
}

// ─── Main Signin Component ────────────────────────────────────
export default function Signin({ type }: SigninProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"signin" | "forgot" | "verifyOtp">("signin");
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

  const resetCaptchaAfterFailure = useCallback(() => {
    // Clear before reset(). reset() can invoke onSuccess in the same turn
    // (test keys, cached passes). Nulling the token afterwards drops that
    // fresh token and the button stays on "Waiting for security check…".
    syncCaptchaToken(null);
    setCaptchaStatus("loading");
    const widget = turnstileRef.current;
    if (!widget) return;
    if (typeof widget.reset === "function") {
      widget.reset();
      return;
    }
    // Older handles only expose remove + render. A fresh render is what
    // actually mints the next token and re-enables the submit button.
    widget.remove?.();
    widget.render?.();
  }, [syncCaptchaToken]);
  const [authState] = useRecoilState(is_authenticated);
  const setAdmin = useSetRecoilState<any>(adminUsername);
  const setAuth = useSetRecoilState(is_authenticated);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const postLoginPath = useCallback(
    (portal: "student" | "admin" | "faculty") => {
      const fromQuery = getSafeReturnUrl(searchParams.get("returnUrl"));
      if (fromQuery) return fromQuery;
      const pending = sessionStorage.getItem("uniz_pending_notification");
      if (pending) {
        sessionStorage.removeItem("uniz_pending_notification");
        const safe = getSafeReturnUrl(pending);
        if (safe) return safe;
      }
      if (portal === "student") return "/student";
      if (portal === "admin") return "/admin";
      return "/faculty";
    },
    [searchParams],
  );

  // Redirect if already authenticated
  useEffect(() => {
    const hasToken =
      localStorage.getItem("student_token") ||
      localStorage.getItem("admin_token") ||
      localStorage.getItem("faculty_token");

    if (authState.is_authenticated && hasToken) {
      const redirectPath =
        authState.type === "student"
          ? postLoginPath("student")
          : authState.type === "admin"
            ? postLoginPath("admin")
            : postLoginPath("faculty");
      navigate(redirectPath, { replace: true });
    }
  }, [authState, navigate, type, postLoginPath]);

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
              ? normalizeStudentPassword(
                  password,
                  normalizeLoginIdentifier(username, type),
                )
              : password.trim(),
          captchaToken: captchaTokenRef.current,
        }),
      });

      if (!data) {
        resetCaptchaAfterFailure();
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
        (data.role === "admin" || data.role === "webadmin")
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
        navigate(postLoginPath("student"), { replace: true });
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
        navigate(postLoginPath("faculty"), { replace: true });
      } else if (type === "admin" && (token || data.success)) {
        localStorage.removeItem("student_token");
        localStorage.removeItem("faculty_token");
        localStorage.setItem("admin_token", token);
        localStorage.setItem("username", resolvedUsername);
        const jwtRole = token ? parseJwt(token)?.role : null;
        const jwtDept = token ? parseJwt(token)?.department : null;
        const rawAdminRole = (jwtRole || (data as any).role || "admin")
          .toString()
          .toLowerCase();
        localStorage.setItem("admin_role", rawAdminRole);
        if (jwtDept) {
          localStorage.setItem("department", jwtDept);
        }

        setAuth({ is_authenticated: true, type: "admin" });
        setAdmin(resolvedUsername);
        toast.success("Your admin session is ready.", {
          title: "Signed in",
        });
        setTimeout(
          () => navigate(postLoginPath("admin"), { replace: true }),
          100,
        );
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
        navigate(postLoginPath("faculty"), { replace: true });
      } else {
        toast.error("Access denied: Invalid credentials for this portal.");
      }
    } catch (error: any) {
      console.error("Signin failed:", error);
      resetCaptchaAfterFailure();
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
    postLoginPath,
    resetCaptchaAfterFailure,
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

      if (data?.success) {
        const channel =
          data.deliveryMethod === "push"
            ? "your registered device"
            : "your registered email";
        toast.success(`Check ${channel} for your security code.`, {
          title: "Code sent",
          autoClose: 6000,
        });
        turnstileRef.current?.reset?.();
        syncCaptchaToken(null);
        setCaptchaStatus("loading");
        setStep("verifyOtp");
      } else {
        // Single-use token is spent even when the request failed.
        resetCaptchaAfterFailure();
      }
    } finally {
      setIsLoading(false);
      setWaitingForCaptcha(false);
    }
  }, [username, type, syncCaptchaToken, resetCaptchaAfterFailure]);

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

      if (data?.success) {
        toast.success("Check your email for the security code.", {
          title: "Code sent",
          autoClose: 6000,
        });
      } else {
        resetCaptchaAfterFailure();
      }
    } finally {
      setIsLoading(false);
      setWaitingForCaptcha(false);
    }
  }, [username, type, resetCaptchaAfterFailure]);

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

  const stepSubtitle =
    step === "signin"
      ? type === "student"
        ? "Use your university ID or college email."
        : "Use your staff ID or email."
      : step === "forgot"
        ? "We'll send a code to your registered email"
        : "Check your mail or notifications";

  const stepTitle =
    step === "signin"
      ? "Sign in"
      : step === "forgot"
        ? "Reset password"
        : "New password";

  return (
    <div className="min-h-screen bg-bg">
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
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    className={loginLinkBtnClass}
                    onClick={() => {
                      // Keep Turnstile mounted across sign-in → forgot (see shared
                      // widget below). Only clear token if widget will remount.
                      setStep("forgot");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
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
            </div>
          )}

          {/* Turnstile must stay mounted on sign-in AND forgot — previously the
              widget lived only inside the sign-in block, so Reset password was
              stuck on “Waiting for security check…” with no widget to complete. */}
          {(step === "signin" || step === "forgot") && requiresCaptcha() && (
            <div className="space-y-3">
              <TurnstileWidget
                turnstileRef={turnstileRef}
                captchaTokenRef={captchaTokenRef}
                onTokenChange={syncCaptchaToken}
                onStatusChange={setCaptchaStatus}
                status={captchaStatus}
              />
              <CaptchaStatus
                status={captchaStatus}
                hasToken={!!captchaToken}
                waitingOnSubmit={waitingForCaptcha}
              />
            </div>
          )}

          {step === "signin" && (
            <Button
              className={loginBtnClass}
              size="hero"
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
                    ? "Waiting for security check…"
                    : "Sign in"}
              </span>
            </Button>
          )}

          {step === "forgot" && (
            <>
              <Button
                className={loginBtnClass}
                size="lg"
                isLoading={isLoading}
                onClick={requestOtp}
                disabled={
                  !username.trim() || (requiresCaptcha() && !captchaReady)
                }
              >
                <span className="relative z-10">
                  {isLoading
                    ? "Sending…"
                    : requiresCaptcha() && !captchaReady
                      ? "Waiting for security check…"
                      : "Send code"}
                </span>
              </Button>
              <div className="text-center pt-1">
                <button
                  type="button"
                  className={cn(portalGhostButtonClass, "w-full sm:w-auto")}
                  onClick={() => setStep("signin")}
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  Back to sign in
                </button>
              </div>
            </>
          )}

          {/* ─── Verify OTP / Reset Password Step ─────── */}
          {step === "verifyOtp" && (
            <div className="space-y-4">
              <OtpInput value={otp} onChange={setOtp} disabled={!!resetToken} />

              {!resetToken && (
                <div className="space-y-4">
                  <Button
                    className={loginBtnClass}
                    size="lg"
                    isLoading={isLoading}
                    onClick={handleVerifyOtp}
                  >
                    <span className="relative z-10">Verify code</span>
                  </Button>

                  <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
                    <p className="text-center text-small leading-relaxed text-text-2">
                      Didn&apos;t get a push notification? Send the code to your
                      registered college email instead.
                    </p>
                    <button
                      type="button"
                      className={loginSecondaryBtnClass}
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
                  <Alert tone="success">Code verified</Alert>

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
