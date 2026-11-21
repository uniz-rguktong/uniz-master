import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CHANGE_PASS_ENDPOINT,
  CHANGE_PASS_OTP_ENDPOINT,
} from "@/api/endpoints";
import { apiRequest } from "@/api/apiClient";
import { Button } from "@/components/Button";
import { Alert } from "@/components/ui/alert";
import {
  portalCardClass,
  portalEyebrowClass,
  portalInputClass,
  portalLabelClass,
  portalMutedClass,
  portalPageClass,
  portalSubtitleClass,
  portalTitleClass,
} from "@/lib/portal-ui";
import { clearSession, getStoredAuthToken, parseJwt } from "@/utils/security";
import { setMustChangePassword } from "@/utils/portalSession";

const MIN_LENGTH = 8;

function issuedPassword(username: string): string {
  return `${username.trim().toLowerCase()}@rguktong`;
}

function storeReplacementToken(token: string) {
  if (localStorage.getItem("student_token")) {
    localStorage.setItem("student_token", token);
    return;
  }
  if (localStorage.getItem("faculty_token")) {
    localStorage.setItem("faculty_token", token);
    return;
  }
  localStorage.setItem("admin_token", token);
}

export default function SetPassword() {
  const navigate = useNavigate();
  const username = (localStorage.getItem("username") || "").replace(/"/g, "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [error, setError] = useState("");
  const [emailMissing, setEmailMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!getStoredAuthToken()) {
      setMustChangePassword(false);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async () => {
    setSending(true);
    setError("");
    const result = await apiRequest<{
      maskedEmail?: string;
      retryAfterSeconds?: number;
      message?: string;
    }>(CHANGE_PASS_OTP_ENDPOINT, { method: "POST", body: JSON.stringify({}) });
    setSending(false);
    if (result.ok) {
      setMaskedEmail(result.data.maskedEmail || "");
      setEmailMissing(false);
      setCooldown(result.data.retryAfterSeconds ?? 60);
      return;
    }
    if (result.maskedEmail) setMaskedEmail(result.maskedEmail);
    if (result.code === "OTP_EMAIL_MISSING") {
      setEmailMissing(true);
      setError(
        result.message ||
          "No email address is on file for this account. Contact webadmin to add one before you can set a password.",
      );
      return;
    }
    if (result.retryAfterSeconds) setCooldown(result.retryAfterSeconds);
    setError(result.message || "Could not send the email code.");
  };

  useEffect(() => {
    if (!getStoredAuthToken()) return;
    void requestCode();
    // The code is requested once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issued = username ? issuedPassword(username) : "";
  const longEnough = password.length >= MIN_LENGTH;
  const notIssued = Boolean(password) && password.trim().toLowerCase() !== issued;
  const matches = password.length > 0 && password === confirm;
  const codeReady = /^\d{6}$/.test(otp);
  const canSave =
    !emailMissing && codeReady && longEnough && notIssued && matches && !saving;

  const save = async () => {
    if (!codeReady) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (!longEnough) {
      setError("Use at least 8 characters.");
      return;
    }
    if (!notIssued) {
      setError("Choose a password that is not the one you were issued.");
      return;
    }
    if (!matches) {
      setError("The confirmation does not match.");
      return;
    }
    setError("");
    setSaving(true);
    const result = await apiRequest<{
      success?: boolean;
      token?: string;
      role?: string;
    }>(CHANGE_PASS_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({
        otp,
        newPassword: password,
        confirmPassword: confirm,
      }),
    });
    setSaving(false);
    if (!result.ok || !result.data.token) {
      setError(result.ok ? "The password was not updated. Try again." : result.message);
      return;
    }
    storeReplacementToken(result.data.token);
    setMustChangePassword(false);
    const role = String(
      parseJwt(result.data.token)?.role || result.data.role || "",
    ).toLowerCase();
    if (role === "student" || localStorage.getItem("student_token") === result.data.token) {
      navigate("/student", { replace: true });
      return;
    }
    if (
      role === "teacher" ||
      role === "faculty" ||
      localStorage.getItem("faculty_token") === result.data.token
    ) {
      navigate("/faculty", { replace: true });
      return;
    }
    navigate("/admin", { replace: true });
  };

  return (
    <main className={`${portalPageClass} flex items-center justify-center px-4 py-10`}>
      <section className={`${portalCardClass} w-full max-w-md p-6 min-[821px]:p-8`}>
        <p className={portalEyebrowClass}>Account security</p>
        <h1 className={`${portalTitleClass} mt-2`}>Set a new password</h1>
        <p className={`${portalSubtitleClass} mt-3`}>
          {maskedEmail
            ? `Enter the code sent to ${maskedEmail}, then choose a password.`
            : "We email a code to the address on your account before the password can change."}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div>
            <label className={portalLabelClass} htmlFor="email-code">
              Email code
            </label>
            <input
              id="email-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className={portalInputClass}
              value={otp}
              disabled={emailMissing}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <button
              type="button"
              className="mt-2 text-caption text-text-2 underline-offset-2 hover:underline disabled:no-underline disabled:opacity-60"
              disabled={emailMissing || sending || cooldown > 0}
              onClick={() => void requestCode()}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className={portalInputClass}
              value={password}
              disabled={emailMissing}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className={portalInputClass}
              value={confirm}
              disabled={emailMissing}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>

          <ul className={`${portalMutedClass} space-y-1`}>
            <li>6-digit code from your email</li>
            <li>At least 8 characters</li>
            <li>Not the password you were issued</li>
            <li>Both fields match</li>
          </ul>

          {error ? (
            <Alert tone="error" title="Could not continue">
              {error}
            </Alert>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={!canSave}
            isLoading={saving}
          >
            Save password
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-caption text-text-2 underline-offset-2 hover:underline"
          onClick={() => {
            clearSession();
            window.location.assign("/login");
          }}
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
