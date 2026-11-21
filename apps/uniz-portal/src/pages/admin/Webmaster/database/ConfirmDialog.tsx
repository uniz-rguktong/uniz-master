import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { adminModalDescClass, adminModalShellClass, adminModalTitleClass } from "@/components/admin/admin-ui";

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  tone = "danger",
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-overlay" aria-label="Close" onClick={busy ? undefined : onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="db-confirm-title" className={`${adminModalShellClass} relative z-10 w-full max-w-md p-6`}>
        <h2 id="db-confirm-title" className={adminModalTitleClass}>
          {title}
        </h2>
        <p className={`mt-3 ${adminModalDescClass}`}>{body}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" size="compact" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant={tone === "danger" ? "destructive" : "primary"} size="compact" onClick={onConfirm} isLoading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
