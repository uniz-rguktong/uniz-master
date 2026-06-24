import hotToast from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { createElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "error" | "warning";

export interface ToastInput {
  title?: string;
  message: string;
  variant?: Variant;
  duration?: number;
  autoClose?: number;
  icon?: ReactNode;
  position?: string;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: string;
  };
  onDismiss?: () => void;
  highlightTitle?: boolean;
}

const variantBorder: Record<Variant, string> = {
  default: "border-zinc-200",
  success: "border-emerald-200",
  error: "border-red-200",
  warning: "border-amber-200",
};

const variantIconBg: Record<Variant, string> = {
  default: "bg-zinc-100 text-zinc-600",
  success: "bg-emerald-50 text-emerald-600",
  error: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-600",
};

const variantIcons: Record<
  Variant,
  React.ComponentType<{ className?: string }>
> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
};

export function showToast({
  title,
  message,
  variant = "default",
  duration = 4000,
  autoClose,
  icon,
  actions,
  onDismiss,
}: ToastInput) {
  const finalDuration = autoClose ?? duration;
  const Icon = variantIcons[variant];

  return hotToast.custom(
    (t) =>
      createElement(
        "div",
        {
          className: cn(
            "pointer-events-auto flex w-[min(360px,calc(100vw-2.5rem))] items-start gap-3 rounded-xl border bg-white px-3.5 py-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] transition-all duration-300",
            variantBorder[variant],
            t.visible
              ? "translate-x-0 opacity-100"
              : "translate-x-[110%] opacity-0",
          ),
        },
        createElement(
          "div",
          {
            className: cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              variantIconBg[variant],
            ),
          },
          icon ?? createElement(Icon, { className: "h-3.5 w-3.5" }),
        ),
        createElement(
          "div",
          { className: "min-w-0 flex-1" },
          title &&
            createElement(
              "p",
              {
                className:
                  "text-[13px] font-semibold text-zinc-950 leading-snug",
              },
              title,
            ),
          createElement(
            "p",
            {
              className: cn(
                "text-[13px] font-medium text-zinc-500 leading-relaxed",
                title && "mt-0.5",
              ),
            },
            message,
          ),
          actions?.label &&
            createElement(
              "button",
              {
                type: "button",
                className:
                  "mt-2 text-[12px] font-semibold text-zinc-900 hover:text-zinc-600",
                onClick: () => {
                  actions.onClick();
                  hotToast.dismiss(t.id);
                },
              },
              actions.label,
            ),
        ),
        createElement(
          "button",
          {
            type: "button",
            "aria-label": "Dismiss",
            className:
              "shrink-0 rounded-md p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700",
            onClick: () => {
              hotToast.dismiss(t.id);
              onDismiss?.();
            },
          },
          createElement(X, { className: "h-4 w-4" }),
        ),
      ),
    { duration: finalDuration, position: "bottom-right" },
  );
}

/** Legacy ref — App mounts Toaster but calls go through here directly */
export const toasterRef = { current: null as { show: typeof showToast } | null };

export const toast = {
  show: (props: ToastInput) => showToast(props),
  success: (message: string, optionsOrTitle?: string | Partial<ToastInput>) => {
    const props: ToastInput =
      typeof optionsOrTitle === "object"
        ? { message, variant: "success", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "success" };
    showToast(props);
  },
  error: (message: string, optionsOrTitle?: string | Partial<ToastInput>) => {
    const props: ToastInput =
      typeof optionsOrTitle === "object"
        ? { message, variant: "error", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "error" };
    showToast(props);
  },
  warning: (message: string, optionsOrTitle?: string | Partial<ToastInput>) => {
    const props: ToastInput =
      typeof optionsOrTitle === "object"
        ? { message, variant: "warning", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "warning" };
    showToast(props);
  },
  info: (message: string, optionsOrTitle?: string | Partial<ToastInput>) => {
    const props: ToastInput =
      typeof optionsOrTitle === "object"
        ? { message, variant: "default", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "default" };
    showToast(props);
  },
};
