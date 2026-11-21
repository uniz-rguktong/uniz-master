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
  /** Stable id so loading → success/error can replace the same toast. */
  id?: string;
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
  default: "border-border",
  success: "border-success",
  error: "border-error",
  warning: "border-warning",
};

const variantIconBg: Record<Variant, string> = {
  default: "text-text-2",
  success: "text-success",
  error: "text-error",
  warning: "text-warning",
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
  id,
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
            "pointer-events-auto flex w-[min(360px,calc(100vw-2.5rem))] items-start gap-3 rounded-lg border bg-surface px-4 py-4 text-text shadow-md transition-opacity duration-200 dark:shadow-none",
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
              "flex h-6 w-6 shrink-0 items-center justify-center",
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
                  "text-body font-medium leading-[22px] text-text",
              },
              title,
            ),
          createElement(
            "p",
            {
              className: cn(
                "text-body leading-[22px] text-text",
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
                  "mt-2 text-small font-medium text-link underline-offset-[1px] hover:underline",
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
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-3 hover:bg-tint hover:text-text",
            onClick: () => {
              hotToast.dismiss(t.id);
              onDismiss?.();
            },
          },
          createElement(X, { className: "h-4 w-4" }),
        ),
      ),
    {
      id,
      duration: finalDuration,
      position: "bottom-right",
    },
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
    return showToast(props);
  },
  error: (message: string, optionsOrTitle?: string | Partial<ToastInput>) => {
    const props: ToastInput =
      typeof optionsOrTitle === "object"
        ? { message, variant: "error", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "error" };
    return showToast(props);
  },
  warning: (message: string, optionsOrTitle?: string | Partial<ToastInput>) => {
    const props: ToastInput =
      typeof optionsOrTitle === "object"
        ? { message, variant: "warning", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "warning" };
    return showToast(props);
  },
  info: (message: string, optionsOrTitle?: string | Partial<ToastInput>) => {
    const props: ToastInput =
      typeof optionsOrTitle === "object"
        ? { message, variant: "default", ...optionsOrTitle }
        : { message, title: optionsOrTitle, variant: "default" };
    return showToast(props);
  },
  /** Persistent progress toast (PDF jobs, long uploads). Pass `id` to update in place. */
  loading: (message: string, options?: Partial<ToastInput>) => {
    return showToast({
      message,
      variant: "default",
      duration: Number.POSITIVE_INFINITY,
      ...options,
    });
  },
  dismiss: (id?: string) => {
    hotToast.dismiss(id);
  },
};
