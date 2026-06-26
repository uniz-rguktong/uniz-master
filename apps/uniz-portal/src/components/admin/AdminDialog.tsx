import { type ReactNode } from "react";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  adminModalShellClass,
  adminModalTitleClass,
  adminModalDescClass,
  adminModalCloseClass,
} from "./admin-ui";
import { cn } from "@/lib/utils";

/**
 * Standard admin modal shell — same structure as Campus Updates broadcast dialog.
 */
/** Drawer overlays use z-[100]/z-[101]; elevated dialogs sit above them. */
const ADMIN_DIALOG_ELEVATED_Z = "z-[110]";

export function AdminDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = "max-w-xl",
  className,
  elevated = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  className?: string;
  /** Render above admin drawers (z-[100]+). */
  elevated?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        overlayClassName={cn(
          elevated && ADMIN_DIALOG_ELEVATED_Z,
          elevated && "bg-zinc-900/40 backdrop-blur-sm",
        )}
        className={cn(
          maxWidth,
          adminModalShellClass,
          elevated && ADMIN_DIALOG_ELEVATED_Z,
          className,
        )}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={adminModalCloseClass}
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <AlertDialogHeader className="p-8 pb-3 flex flex-col items-start text-left gap-1.5">
            <AlertDialogTitle className={adminModalTitleClass}>
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription className={adminModalDescClass}>
                {description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {children && <div className="px-8 pb-8">{children}</div>}
          {footer && (
            <div className="px-8 py-5 border-t border-zinc-200/70 bg-zinc-50/50 flex flex-wrap items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AdminDialog;
