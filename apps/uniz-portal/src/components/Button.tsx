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
        "bg-zinc-900 text-white hover:bg-zinc-900/95 shadow-none ring-zinc-900",
      secondary:
        "bg-zinc-100 text-zinc-900 hover:bg-zinc-200/95 shadow-none ring-zinc-200",
      outline:
        "border border-zinc-300 bg-transparent hover:bg-zinc-50 text-zinc-700 ring-zinc-300",
      danger: "bg-black text-white hover:bg-black/95 shadow-none ring-black",
      ghost:
        "bg-transparent hover:bg-zinc-100/95 text-zinc-700 ring-zinc-100",
    };

    const sizes = {
      sm: "h-8 px-4 text-[13px]",
      md: "h-10 px-5 text-[14px]",
      lg: "h-12 px-6 text-[16px]",
    };

    const finalIsLoading = isLoading || loading;
    const finalOnClick = onClick || onclickFunction;

    return (
      <button
        ref={ref}
        onClick={finalOnClick}
        disabled={disabled || finalIsLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 ease-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-[1px]",
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
