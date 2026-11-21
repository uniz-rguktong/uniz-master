import { useEffect } from "react";
import { Button } from "@/components/Button";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  message,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-overlay" aria-label="Close" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-[480px] rounded-t-xl border border-border bg-surface p-6 shadow-lg duration-200 dark:border-border-strong dark:shadow-none sm:rounded-xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border-strong sm:hidden" />
        <h3 id="confirm-title" className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head">
          Confirm action
        </h3>
        <p className="mt-3 text-body leading-6 text-text-2">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
