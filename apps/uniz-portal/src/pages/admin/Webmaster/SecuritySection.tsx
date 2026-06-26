import { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "@/utils/toast-ref";
import { ADMIN_RESET_PASS } from "../../../api/endpoints";
import { cn } from "../../../utils/cn";
import { SectionHeader } from "../../../components/admin/SectionHeader";
import {
  adminPageWrapClass,
  adminCardClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from "../../../components/admin/admin-ui";

function validateStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ["", "Weak", "Moderate", "Strong"];
  const colors = ["", "bg-red-500", "bg-amber-500", "bg-emerald-500"];
  const texts = ["", "text-red-500", "text-amber-600", "text-emerald-600"];
  return {
    score,
    label: labels[score],
    barColor: colors[score],
    textColor: texts[score],
  };
}

export default function SecuritySection({ username }: { username: string }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const strength = validateStrength(newPw);

  const handleSubmit = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match.");
      return;
    }
    if (strength.score < 3) {
      toast.error(
        "Password must be 8+ chars with a number and special character.",
      );
      return;
    }
    const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
    try {
      setLoading(true);
      const res = await fetch(ADMIN_RESET_PASS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          password: oldPw,
          new_password: newPw,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.msg || "Password changed! Signing you out…");
        localStorage.removeItem("admin_token");
        setTimeout(() => (window.location.href = "/admin/signin"), 2000);
      } else {
        toast.error(data.msg || "Failed to change password.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(adminPageWrapClass, "animate-in fade-in duration-700 pb-20")}>
      <SectionHeader
        icon={<Lock size={18} />}
        eyebrow="Management"
        title="Security & Authentication"
        subtitle="Update your access credentials to maintain account integrity."
      />

      <div className={cn(adminCardClass, "max-w-lg p-8 space-y-8")}>
        <div className="space-y-6">
          <PasswordInput
            label="Current Access Key"
            value={oldPw}
            show={showOld}
            onToggle={() => setShowOld(!showOld)}
            onChange={setOldPw}
          />

          <div className="space-y-4">
            <PasswordInput
              label="New Security Password"
              value={newPw}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              onChange={setNewPw}
            />

            {/* Refined Strength Meter */}
            {newPw && (
              <div className="px-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={cn(
                          "h-1 w-8 rounded-full transition-all duration-300",
                          step <= strength.score
                            ? strength.barColor
                            : "bg-zinc-100",
                        )}
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium tracking-tight",
                      strength.textColor,
                    )}
                  >
                    {strength.label} Profile
                  </span>
                </div>
              </div>
            )}
          </div>

          <PasswordInput
            label="Verify New Password"
            value={confirmPw}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
            onChange={setConfirmPw}
          />

          {newPw && confirmPw && (
            <div className="flex items-center gap-2 px-1 text-[12px] font-medium">
              {newPw === confirmPw ? (
                <>
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span className="text-emerald-600">Passwords match</span>
                </>
              ) : (
                <>
                  <XCircle size={14} className="text-rose-500" />
                  <span className="text-rose-500">Mismatch detected</span>
                </>
              )}
            </div>
          )}

          <div className="pt-2 space-y-5">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={cn(adminPrimaryButtonClass, "h-12 w-full")}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              Update Credentials
            </button>

            <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100 flex gap-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <p className="text-[12px] text-amber-700 leading-relaxed">
                You will be automatically signed out of the current session upon
                a successful password update.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  show,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className={adminLabelClass}>{label}</label>
      <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3.5 h-11 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/5 transition-all">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="flex-1 text-[13px] font-medium text-zinc-900 bg-transparent focus:outline-none"
        />
        <button
          onClick={onToggle}
          className="text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}
