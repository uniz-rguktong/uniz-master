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
      primary:
        "bg-navy-900 text-white hover:bg-navy-800 shadow-whisper-navy ring-navy-900",
      secondary:
        "bg-navy-50 text-navy-900 hover:bg-navy-100 shadow-none ring-navy-200",
      outline:
        "border border-navy-200 bg-transparent hover:bg-navy-50 text-navy-700 ring-navy-200",
      danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-none ring-rose-600",
      ghost:
        "bg-transparent hover:bg-navy-50 text-navy-600 ring-navy-100",
    };

    const sizes = {
      sm: "h-9 min-h-9 px-4 text-[13px] rounded-portal-lg",
      md: "min-h-11 px-5 text-[14px] rounded-portal-xl",
      lg: "min-h-12 px-6 text-[16px] rounded-portal-xl",
    };

    const finalIsLoading = isLoading || loading;
    const finalOnClick = onClick || onclickFunction;

    return (
      <button
        ref={ref}
        onClick={finalOnClick}
        disabled={disabled || finalIsLoading}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-smooth focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {finalIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {/* Legacy 'value' prop or children */}
        {children || value}
      </button>
    );
  },
);

Button.displayName = "Button";
