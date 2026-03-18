import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-600 text-white hover:bg-indigo-700",
        secondary:
          "border-transparent bg-slate-900 text-white hover:bg-slate-800",
        pill: 
          "border-transparent bg-indigo-100 text-indigo-700 uppercase tracking-widest",
        date: 
          "border-transparent bg-sky-600 text-white", // specific to premium date badges
        outline: "text-slate-900 border-slate-200",
      },
      size: {
        default: "px-3 py-1 text-sm",
        sm: "px-2.5 py-0.5 text-xs",
        lg: "px-4 py-1.5 text-base tracking-widest uppercase",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
