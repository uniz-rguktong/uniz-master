import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  // Legacy support to be removed
  value?: string;
  onclickFunction?: () => void;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      loading,
      children,
      value,
      disabled,
      onclickFunction,
      onClick,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary: "bg-navy text-white hover:bg-navy-950",
      secondary: "border border-line bg-white text-navy-900 hover:bg-surface-2",
      outline: "border border-line bg-white text-navy-900 hover:bg-surface-2",
      danger: "bg-brand-red text-white hover:bg-[#C81A20]",
      ghost: "bg-transparent text-ink-muted hover:bg-surface-2 hover:text-navy-900",
    };

    const sizes = {
      sm: "h-9 min-h-9 px-3 text-sm rounded-lg",
      md: "h-10 min-h-10 px-4 text-sm rounded-lg",
      lg: "h-11 min-h-11 px-5 text-sm rounded-lg",
    };

    const finalIsLoading = isLoading || loading;
    const finalOnClick = onClick || onclickFunction;

    return (
      <button
        ref={ref}
        onClick={finalOnClick}
        disabled={disabled || finalIsLoading}
        className={cn(
          "inline-flex items-center justify-center text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {finalIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children || value}
      </button>
    );
  },
);

Button.displayName = "Button";
