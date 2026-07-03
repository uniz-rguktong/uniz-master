import { useState, useCallback, useMemo } from "react";
import { Check, Lock, Shield, Loader2 } from "lucide-react";
import { toast } from "@/utils/toast-ref";
import { ADMIN_RESET_PASS } from "../../../api/endpoints";
import { cn } from "@/lib/utils";
import { Input } from "../../../components/Input";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "../../../components/admin/admin-ui";

type Strength = { score: number; label: string; barClass: string };

function validatePassword(pwd: string): Strength {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (!pwd) return { score: 0, label: "", barClass: "bg-zinc-100" };
  if (score <= 1) return { score, label: "Weak", barClass: "bg-rose-500" };
  if (score === 2) return { score, label: "Fair", barClass: "bg-amber-500" };
  return { score, label: "Strong", barClass: "bg-emerald-600" };
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

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-500 pb-20")}>
      <SectionHeader
        icon={<Lock size={18} />}
        eyebrow="Management"
        title="Security & Authentication"
        subtitle="Update your access credentials to maintain account integrity."
      />

      <div className="bg-transparent md:overflow-hidden md:rounded-xl md:border md:border-zinc-100 md:bg-white md:shadow-sm">
        <div className="md:flex">
          <div className="space-y-5 border-zinc-50 px-0 py-2 md:w-2/3 md:border-r md:space-y-6 md:p-10 md:py-6">
            <Input
              label="Current password"
              type="password"
              onchangeFunction={handleInputChange(setCurrentPassword)}
              placeholder="Enter current password"
              labelClassName={adminLabelClass}
              icon={<Lock className="h-4 w-4 text-navy-400" strokeWidth={2} />}
            />

            <div className="space-y-3">
              <Input
                label="New password"
                type="password"
                onchangeFunction={handleInputChange(setPassword)}
                placeholder="Create a new password"
                labelClassName={adminLabelClass}
                icon={<Lock className="h-4 w-4 text-navy-400" strokeWidth={2} />}
              />

              {password && (
                <div className="space-y-2 px-0.5">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          passwordStrength.barClass,
                        )}
                        style={{
                          width: `${Math.max(12, (passwordStrength.score / 3) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {passwordStrength.label}
                    </span>
                  </div>

                  <ul className="grid gap-1.5">
                    {REQUIREMENTS.map((req) => {
                      const met = req.test(password);
                      return (
                        <li
                          key={req.id}
                          className={cn(
                            "flex items-center gap-2 text-[12px] font-medium transition-colors",
                            met ? "text-zinc-800" : "text-zinc-400",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              met
                                ? "border-navy-900 bg-navy-900 text-white"
                                : "border-zinc-200 bg-white",
                            )}
                          >
                            {met && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Input
                label="Confirm new password"
                type="password"
                onchangeFunction={handleInputChange(setRePassword)}
                placeholder="Repeat new password"
                labelClassName={adminLabelClass}
                icon={<Lock className="h-4 w-4 text-navy-400" strokeWidth={2} />}
                error={
                  passwordsMismatch ? "Passwords do not match" : undefined
                }
              />
              {passwordsMatch && (
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Passwords match
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={cn(
                adminPrimaryButtonClass,
                "w-full min-h-12 py-3.5 text-[15px] md:py-4",
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isLoading ? "Updating…" : "Update password"}
            </button>

            <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm md:hidden">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-zinc-900" strokeWidth={2} />
                <p className="text-[11px] font-medium leading-relaxed text-zinc-500">
                  You will be signed out of this session after a successful
                  password update. Sign in again with your new password.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden flex-col justify-between bg-zinc-50/30 p-8 md:flex md:w-1/3">
            <div>
              <h3 className="mb-6 flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-zinc-400">
                Password guidelines
              </h3>

              <div className="space-y-3 md:space-y-6">
                {GUIDELINES.map((text, index) => (
                  <div key={text} className="flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-zinc-100 bg-white text-[10px] font-bold text-zinc-900 shadow-sm">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <p className="text-[13px] font-medium leading-relaxed text-zinc-500">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Shield size={16} className="mt-0.5 text-zinc-900" />
                <p className="text-[11px] font-medium leading-relaxed text-zinc-500">
                  For your security, all active sessions are ended after a
                  password change. Sign in again with your new password on every
                  device.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
