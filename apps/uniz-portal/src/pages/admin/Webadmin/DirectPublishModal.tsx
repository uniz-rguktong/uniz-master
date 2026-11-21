/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../../../api/apiClient";
import {
  CONFIRM_DIRECT_PUBLISH,
  REQUEST_DIRECT_PUBLISH_CODE,
  RESEND_DIRECT_PUBLISH_CODE,
} from "../../../api/endpoints";
import { toast } from "@/utils/toast-ref";
import { cn } from "@/utils/cn";
import {
  adminInputClass,
  adminLabelClass,
} from "../../../components/admin/admin-ui";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <AdminDialog
      open
      elevated
      onOpenChange={(open) => !open && onClose()}
      maxWidth="max-w-[640px]"
      title="Publish to students"
      description={semester.name}
      footer={
        step === "intro" ? (
          <Button type="button" disabled={loading} isLoading={loading} onClick={() => sendCode(false)}>
            Send verification code
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={loading || resendIn > 0}
              onClick={() => sendCode(true)}
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </Button>
            <Button
              type="button"
              disabled={loading || code.length !== 6}
              isLoading={loading}
              onClick={confirmPublish}
            >
              Confirm and publish
            </Button>
          </>
        )
      }
    >
      <div className="space-y-6">
        <Alert tone="warning" title="Skips the approval chain">
          Skips Dean and HOD approval and opens course registration for all
          students immediately. A verification code is sent to your registered
          email before this action runs.
        </Alert>

        {step === "code" && (
          <div className="space-y-4">
            {maskedEmail && (
              <p className="text-dense text-text-2">
                Code sent to <span className="font-medium text-text">{maskedEmail}</span>
              </p>
            )}
            <div>
              <label className={adminLabelClass}>6-digit verification code</label>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={cn(adminInputClass, "text-center tracking-[0.3em]")}
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            <p className="text-caption text-text-3">
              Rate limited: 2 codes per minute, 10 per hour
            </p>
          </div>
        )}
      </div>
    </AdminDialog>
  );
}
