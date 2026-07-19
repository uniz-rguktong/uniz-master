/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Rocket, ShieldCheck, X } from "lucide-react";
import { apiClient } from "../../../api/apiClient";
import {
  CONFIRM_DIRECT_PUBLISH,
  REQUEST_DIRECT_PUBLISH_CODE,
  RESEND_DIRECT_PUBLISH_CODE,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "@/utils/cn";
import {
  adminGhostButtonClass,
  adminInputClass,
  adminLabelClass,
  adminModalDescClass,
  adminModalShellClass,
  adminModalTitleClass,
  adminPrimaryButtonClass,
} from "../../../components/admin/admin-ui";

type DirectPublishModalProps = {
  semester: { id: string; name: string; status?: string };
  onClose: () => void;
  onPublished: () => void;
};

export default function DirectPublishModal({
  semester,
  onClose,
  onPublished,
}: DirectPublishModalProps) {
  const [step, setStep] = useState<"intro" | "code">("intro");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const sendCode = useCallback(
    async (resend = false) => {
      setLoading(true);
      try {
        const data = await apiClient<{
          success: boolean;
          maskedEmail?: string;
          message?: string;
          resendCooldownSeconds?: number;
        }>(resend ? RESEND_DIRECT_PUBLISH_CODE(semester.id) : REQUEST_DIRECT_PUBLISH_CODE(semester.id), {
          method: "POST",
        });
        if (!data?.success) return;
        setMaskedEmail(data.maskedEmail || "");
        setStep("code");
        setResendIn(data.resendCooldownSeconds ?? 60);
        toast.success(data.message || "Verification code sent", {
          title: resend ? "Code resent" : "Check your email",
        });
      } catch (e: any) {
        const retry = e?.retryAfterSeconds;
        if (retry) setResendIn(Number(retry) || 60);
        toast.error(e?.message || "Could not send verification code");
      } finally {
        setLoading(false);
      }
    },
    [semester.id],
  );

  const confirmPublish = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient<{ success: boolean; message?: string }>(
        CONFIRM_DIRECT_PUBLISH(semester.id),
        {
          method: "POST",
          body: JSON.stringify({ code: code.trim() }),
        },
      );
      if (!data?.success) return;
      toast.success(data.message || "Registration is now open for students", {
        title: "Published",
      });
      onPublished();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={cn(adminModalShellClass, "w-full max-w-md p-8 space-y-6")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
              Webadmin only
            </p>
            <h2 className={adminModalTitleClass}>Publish to students</h2>
            <p className={cn(adminModalDescClass, "mt-1")}>{semester.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900">
          Skips Dean and HOD approval and opens course registration for all
          students immediately. A verification code is sent to your registered
          email before this action runs.
        </div>

        {step === "intro" ? (
          <div className="space-y-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => sendCode(false)}
              className={cn(adminPrimaryButtonClass, "w-full justify-center")}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Mail size={16} />
              )}
              Send verification code
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {maskedEmail && (
              <p className="text-xs text-zinc-500">
                Code sent to <span className="font-semibold">{maskedEmail}</span>
              </p>
            )}
            <div className="space-y-2">
              <label className={adminLabelClass}>6-digit verification code</label>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={cn(adminInputClass, "text-center text-lg tracking-[0.3em]")}
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="button"
              disabled={loading || resendIn > 0}
              onClick={() => sendCode(true)}
              className={cn(adminGhostButtonClass, "w-full justify-center text-xs")}
            >
              {resendIn > 0
                ? `Resend code in ${resendIn}s`
                : "Resend verification code"}
            </button>
            <button
              type="button"
              disabled={loading || code.length !== 6}
              onClick={confirmPublish}
              className={cn(adminPrimaryButtonClass, "w-full justify-center")}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Rocket size={16} />
              )}
              Confirm &amp; publish to students
            </button>
          </div>
        )}

        <p className="flex items-center gap-2 text-[10px] text-zinc-400">
          <ShieldCheck size={12} />
          Rate limited: 2 codes per minute, 10 per hour
        </p>
      </div>
    </div>
  );
}
