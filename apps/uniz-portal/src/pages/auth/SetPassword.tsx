import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHANGE_PASS_ENDPOINT } from "@/api/endpoints";
import { apiClient } from "@/api/apiClient";
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
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getStoredAuthToken()) {
      setMustChangePassword(false);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const issued = username ? issuedPassword(username) : "";
  const longEnough = password.length >= MIN_LENGTH;
  const notIssued = Boolean(password) && password.trim().toLowerCase() !== issued;
  const matches = password.length > 0 && password === confirm;
  const canSave = longEnough && notIssued && matches && !saving;

  const save = async () => {
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
    const data = await apiClient<{
      success?: boolean;
      token?: string;
      role?: string;
    }>(
      CHANGE_PASS_ENDPOINT,
      {
        method: "POST",
        body: JSON.stringify({
          newPassword: password,
          confirmPassword: confirm,
        }),
      },
      false,
    );
    setSaving(false);
    if (!data?.token) {
      setError("The password was not updated. Try again.");
      return;
    }
    storeReplacementToken(data.token);
    setMustChangePassword(false);
    const role = String(parseJwt(data.token)?.role || data.role || "").toLowerCase();
    if (role === "student" || localStorage.getItem("student_token") === data.token) {
      navigate("/student", { replace: true });
      return;
    }
    if (role === "teacher" || role === "faculty" || localStorage.getItem("faculty_token") === data.token) {
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
          The password you signed in with was issued for you. Choose a new one
          before continuing.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
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
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>

          <ul className={`${portalMutedClass} space-y-1`}>
            <li>At least 8 characters</li>
            <li>Not the password you were issued</li>
            <li>Both fields match</li>
          </ul>

          {error ? (
            <Alert tone="error" title="Could not save">
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
