import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "../../components/Input";
import { useNavigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { adminUsername } from "../../store";
import { useIsAuth } from "../../hooks/is_authenticated";
import { toast } from "@/utils/toast-ref";
import { ADMIN_RESET_PASS } from "../../api/endpoints";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

interface ResetPasswordResponse {
  success: boolean;
  msg: string;
}

const sectionTitleClass =
  "font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head";

export default function Settings() {
  useIsAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigateTo = useNavigate();
  const username = useRecoilValue(adminUsername);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });

  // Handle input change
  const handleInputChange = useCallback(
    (setter: any) => (event: any) => {
      setter(event.target.value);
    },
    [],
  );

  // Validate password strength
  const validatePassword = useCallback((pwd: any) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: "Weak", color: "bg-error" };
      case 2:
        return { score, label: "Moderate", color: "bg-warning" };
      case 3:
        return { score, label: "Strong", color: "bg-success" };
      default:
        return { score: 0, label: "", color: "" };
    }
  }, []);

  // Update password strength on new password change
  useEffect(() => {
    setPasswordStrength(validatePassword(password));
  }, [password, validatePassword]);

  // Handle form submission
  const sendDataToBackend = async () => {
    if (!oldPassword || !password || !repassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password !== repassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordStrength.score < 3) {
      toast.error(
        "Password must be at least 8 characters long, include a number, and a special character.",
      );
      return;
    }
    if (!username) {
      toast.error("User data not available. Please try again.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("admin_token");

    if (!token) {
      toast.error("Authentication token missing. Please sign in again.");
      setIsLoading(false);
      navigateTo("/admin/signin");
      return;
    }

    const bodyData = JSON.stringify({
      username,
      password: oldPassword,
      new_password: password,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(ADMIN_RESET_PASS, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(token || "").replace(/"/g, "")}`,
        },
        body: bodyData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data: ResetPasswordResponse = await res.json();

      if (res.ok && data.success) {
        toast.success(data.msg || "Password reset successfully!");
        localStorage.removeItem("admin_token");
        setTimeout(() => {
          navigateTo("/admin/signin");
        }, 2000);
      } else {
        toast.error(data.msg || "Failed to reset password.");
      }
    } catch (error: any) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const strengthTone =
    passwordStrength.score === 3
      ? "success"
      : passwordStrength.score === 2
        ? "warning"
        : "error";

  return (
    <div className="min-h-screen bg-bg px-4 py-8">
      <div className="mx-auto w-full max-w-[640px]">
        <PageHeader
          title="Reset password"
          meta="Enhance your account security with a strong password."
          action={
            <Button variant="outline" onClick={() => navigateTo("/admin")}>
              Back
            </Button>
          }
        />

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className={sectionTitleClass}>Credentials</h2>
            <Input
              label="Current password"
              type="password"
              onchangeFunction={handleInputChange(setOldPassword)}
              placeholder="Enter current password"
            />
            <div>
              <Input
                label="New password"
                type="password"
                onchangeFunction={handleInputChange(setPassword)}
                placeholder="Enter new password"
              />
              {password && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-dense font-medium text-text-2">Strength</span>
                    <Badge tone={strengthTone}>{passwordStrength.label}</Badge>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(passwordStrength.score / 3) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <Input
                label="Confirm new password"
                type="password"
                onchangeFunction={handleInputChange(setRePassword)}
                placeholder="Re-enter new password"
              />
              {password && repassword && (
                <div className="mt-3">
                  {password === repassword ? (
                    <Badge tone="success">Passwords match</Badge>
                  ) : (
                    <Badge tone="error">Passwords do not match</Badge>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-8">
            <h2 className={sectionTitleClass}>Requirements</h2>
            <ul className="space-y-3">
              <RequirementItem
                met={password.length >= 8}
                text="At least 8 characters long"
              />
              <RequirementItem
                met={/[0-9]/.test(password)}
                text="Include at least one number"
              />
              <RequirementItem
                met={/[^A-Za-z0-9]/.test(password)}
                text="Include one special character"
              />
            </ul>
            <Alert tone="warning" title="You will be signed out" icon={AlertTriangle}>
              For security reasons, you will be automatically logged out after
              successfully changing your password.
            </Alert>
          </section>

          <div className="flex justify-end border-t border-border pt-8">
            <Button
              type="button"
              loading={isLoading}
              onclickFunction={sendDataToBackend}
            >
              Reset password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <li className="flex items-center gap-3 text-dense text-text">
      {met ? (
        <Badge tone="success" icon={CheckCircle}>
          Met
        </Badge>
      ) : (
        <Badge>Needed</Badge>
      )}
      <span>{text}</span>
    </li>
  );
}
