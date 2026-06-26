import { AlertCircle } from "lucide-react";
import {
  adminPrimaryButtonClass,
  adminGhostButtonClass,
  adminCardClass,
  adminModalTitleClass,
} from "./admin/admin-ui";
import { cn } from "../utils/cn";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(adminCardClass, "w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200")}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className={cn(adminModalTitleClass, "text-center")}>
                Confirm action
              </h3>
              <p className="text-[13px] font-medium text-zinc-500 mt-2 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className={cn(adminGhostButtonClass, "flex-1")}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn(adminPrimaryButtonClass, "flex-1")}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
