import { useState, useCallback, useMemo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { toast } from "@/utils/toast-ref";
import { ADMIN_RESET_PASS } from "../../../api/endpoints";
import { cn } from "@/lib/utils";
import { Input } from "../../../components/Input";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  adminPageWrapClass,
  adminLabelClass,
} from "../../../components/admin/admin-ui";

type Strength = { score: number; label: string; barClass: string };

function validatePassword(pwd: string): Strength {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (!pwd) return { score: 0, label: "", barClass: "bg-surface-2" };
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

const GUIDELINES = [
  "Use at least 8 characters with numbers and symbols.",
  "Choose a password you do not use on other sites.",
  "Avoid your staff ID, email, or other easy-to-guess details.",
] as const;

export default function SecuritySection({ username }: { username: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = useMemo(() => validatePassword(password), [password]);

  const handleInputChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setter(event.target.value);
      },
    [],
  );

  const handleSubmit = async () => {
    if (!currentPassword || !password || !repassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password !== repassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordStrength.score < 3) {
      toast.error("New password does not meet all requirements.");
      return;
    }

    const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
    setIsLoading(true);
    try {
      const res = await fetch(ADMIN_RESET_PASS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password: currentPassword,
          new_password: password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.msg || "Password updated — signing you out…");
        localStorage.removeItem("admin_token");
        setTimeout(() => {
          window.location.href = "/admin/signin";
        }, 2000);
      } else {
        toast.error(data.msg || "Failed to change password.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch =
    repassword.length > 0 && password === repassword;
  const passwordsMismatch =
    repassword.length > 0 && password !== repassword;

  const strengthTone =
    passwordStrength.score >= 3
      ? "success"
      : passwordStrength.score === 2
        ? "warning"
        : "error";

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-500 pb-20")}>
      <div className="mx-auto max-w-[640px]">
        <PageHeader
          title="Security"
          meta="Update your access credentials to maintain account integrity."
        />

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
              Password
            </h2>
            <Input
              label="Current password"
              type="password"
              onchangeFunction={handleInputChange(setCurrentPassword)}
              placeholder="Enter current password"
              labelClassName={adminLabelClass}
            />
            <div className="space-y-3">
              <Input
                label="New password"
                type="password"
                onchangeFunction={handleInputChange(setPassword)}
                placeholder="Create a new password"
                labelClassName={adminLabelClass}
              />
              {password && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-dense font-medium text-text-2">Strength</span>
                    {passwordStrength.label ? (
                      <Badge tone={strengthTone}>{passwordStrength.label}</Badge>
                    ) : null}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${Math.max(12, (passwordStrength.score / 3) * 100)}%`,
                      }}
                    />
                  </div>
                  <ul className="space-y-2">
                    {REQUIREMENTS.map((req) => {
                      const met = req.test(password);
                      return (
                        <li key={req.id} className="flex items-center gap-2 text-dense text-text">
                          {met ? (
                            <Badge tone="success" icon={Check}>Met</Badge>
                          ) : (
                            <Badge>Needed</Badge>
                          )}
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            <Input
              label="Confirm new password"
              type="password"
              onchangeFunction={handleInputChange(setRePassword)}
              placeholder="Repeat new password"
              labelClassName={adminLabelClass}
              error={passwordsMismatch ? "Passwords do not match" : undefined}
            />
            {passwordsMatch && <Badge tone="success">Passwords match</Badge>}
          </section>

          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
              Guidelines
            </h2>
            <ul className="space-y-3 text-dense leading-6 text-text-2">
              {GUIDELINES.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
            <Alert tone="warning" title="You will be signed out" icon={AlertTriangle}>
              For your security, all active sessions are ended after a password
              change. Sign in again with your new password on every device.
            </Alert>
          </section>

          <div className="flex justify-end border-t border-border pt-8">
            <Button type="button" onClick={handleSubmit} disabled={isLoading} isLoading={isLoading}>
              {isLoading ? "Updating…" : "Update password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
