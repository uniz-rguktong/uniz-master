import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex h-6 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium leading-[18px]",
  {
    variants: {
      variant: {
        neutral: "bg-tint-2 text-text-2",
        success: "bg-[color-mix(in_srgb,var(--success)_8%,var(--surface))] text-success",
        warning: "bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] text-warning",
        error: "bg-[color-mix(in_srgb,var(--error)_8%,var(--surface))] text-error",
      },
      size: {
        default: "h-6 px-2.5 text-[13px]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  },
);
