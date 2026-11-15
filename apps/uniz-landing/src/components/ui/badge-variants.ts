import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-navy text-white",
        secondary: "border-transparent bg-ink text-white",
        pill: "border-transparent bg-paper text-ink",
        date: "border-transparent bg-crimson text-white",
        outline: "text-ink border-line",
      },
      size: {
        default: "px-3 py-1 text-sm",
        sm: "px-2.5 py-0.5 text-xs",
        lg: "px-4 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
