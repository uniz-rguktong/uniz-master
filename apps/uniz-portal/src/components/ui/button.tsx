import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  portalGhostButtonClass,
  portalPrimaryButtonClass,
  portalSecondaryButtonClass,
} from "@/lib/portal-ui";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-tight ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "rounded-portal-xl bg-primary text-primary-foreground shadow-whisper-navy hover:bg-navy-800",
        destructive:
          "rounded-portal-xl bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "rounded-portal-xl border border-navy-200 bg-background text-navy-700 hover:bg-navy-50 hover:text-navy-900",
        secondary:
          "rounded-portal-xl bg-navy-50 text-navy-900 hover:bg-navy-100",
        ghost:
          "rounded-portal-xl text-navy-600 hover:bg-navy-50 hover:text-navy-900",
        link: "text-navy-900 underline-offset-4 hover:underline",
        portal: portalPrimaryButtonClass,
        portalSecondary: portalSecondaryButtonClass,
        portalGhost: portalGhostButtonClass,
      },
      size: {
        default: "min-h-11 px-5 py-2",
        sm: "min-h-9 rounded-portal-lg px-3 text-xs",
        lg: "min-h-12 rounded-portal-xl px-8 text-[15px]",
        icon: "h-11 w-11 rounded-portal-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
