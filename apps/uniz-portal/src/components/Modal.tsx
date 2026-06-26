import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "../utils/cn";
import {
  adminModalShellClass,
  adminModalTitleClass,
  adminModalDescClass,
  adminModalCloseClass,
} from "./admin/admin-ui";

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export function Modal({
  children,
  isOpen,
  onClose,
  title,
  description,
  className,
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative w-full max-w-lg",
          adminModalShellClass,
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-6 pb-4 border-b border-zinc-200/70">
            <div className="pr-10">
              {title && <h3 className={adminModalTitleClass}>{title}</h3>}
              {description && (
                <p className={cn(adminModalDescClass, "mt-1.5")}>{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(adminModalCloseClass, "static")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
