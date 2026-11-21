import { useState, useCallback, useMemo } from "react";
import { Input } from "../../components/Input";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { is_authenticated } from "../../store";
import { useStudentData } from "../../hooks/student_info";
import { toast } from "@/utils/toast-ref";
import { CHANGE_PASS_ENDPOINT } from "../../api/endpoints";
import { apiClient } from "../../api/apiClient";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/Button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type Strength = { score: number; label: string; barClass: string };

function validatePassword(pwd: string): Strength {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (!pwd) return { score: 0, label: "", barClass: "bg-border" };
  if (score <= 1) return { score, label: "Weak", barClass: "bg-error" };
  if (score === 2) return { score, label: "Fair", barClass: "bg-warning" };
  return { score, label: "Strong", barClass: "bg-success" };
}

const REQUIREMENTS = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "num", label: "Includes a number", test: (p: string) => /[0-9]/.test(p) },
  {
    id: "sym",
    label: "Includes a symbol",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
] as const;

export default function Resetpassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigateTo = useNavigate();
  useStudentData();
  const [_isAuth, setAuth] = useRecoilState(is_authenticated);

  const passwordStrength = useMemo(() => validatePassword(password), [password]);

  const handleInputChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setter(event.target.value);
      },
    [],
  );

  const handleResetPassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (password !== repassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordStrength.score < 3) {
      toast.error("New password does not meet all requirements");
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient<{ success: boolean; message?: string }>(
        CHANGE_PASS_ENDPOINT,
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword,
            newPassword: password,
          }),
        },
      );

      if (data?.success) {
        toast.success("Password updated — please sign in again");
        localStorage.clear();
        setAuth({ is_authenticated: false, type: "" });
        navigateTo("/student/signin", { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = repassword.length > 0 && password === repassword;
  const passwordsMismatch = repassword.length > 0 && password !== repassword;

  return (
    <div className="mx-auto max-w-[480px]">
      <PageHeader
        title="Change password"
        meta="Use a strong password you do not use elsewhere. You will be signed out on all devices after updating."
      />
      <div className="space-y-5">
        <Input
          label="Current password"
          type="password"
          onchangeFunction={handleInputChange(setCurrentPassword)}
          placeholder="Enter current password"
        />
        <div className="space-y-3">
          <Input
            label="New password"
            type="password"
            onchangeFunction={handleInputChange(setPassword)}
            placeholder="Create a new password"
          />
          {password ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn("h-full rounded-full", passwordStrength.barClass)}
                    style={{ width: `${Math.max(12, (passwordStrength.score / 3) * 100)}%` }}
                  />
                </div>
                {passwordStrength.label ? (
                  <Badge
                    tone={
                      passwordStrength.score <= 1
                        ? "error"
                        : passwordStrength.score === 2
                          ? "warning"
                          : "success"
                    }
                  >
                    {passwordStrength.label}
                  </Badge>
                ) : null}
              </div>
              <ul className="space-y-1.5">
                {REQUIREMENTS.map((req) => {
                  const met = req.test(password);
                  return (
                    <li
                      key={req.id}
                      className={cn("flex items-center gap-2 text-caption", met ? "text-text" : "text-text-3")}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          met ? "border-head bg-primary text-primary-foreground" : "border-border bg-surface",
                        )}
                      >
                        {met ? <Check className="h-3 w-3" strokeWidth={2} aria-hidden /> : null}
                      </span>
                      {req.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
        <Input
          label="Confirm new password"
          type="password"
          onchangeFunction={handleInputChange(setRePassword)}
          placeholder="Repeat new password"
          error={passwordsMismatch ? "Passwords do not match" : undefined}
        />
        {passwordsMatch ? <Alert tone="success">Passwords match</Alert> : null}
        <Button className="w-full" onClick={handleResetPassword} isLoading={isLoading} disabled={isLoading}>
          {isLoading ? "Updating…" : "Update password"}
        </Button>
        <p className="text-body leading-6 text-text-2">
          Use at least 8 characters with numbers and symbols. Choose a password you
          do not use on other sites. Avoid personal details like your name or roll
          number. For your security, all active sessions are ended after a password
          change. Sign in again with your new password.
        </p>
      </div>
    </div>
  );
}
