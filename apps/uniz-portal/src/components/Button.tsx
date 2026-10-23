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
        "bg-[#34495e] text-white hover:bg-[#2c3e50] shadow-examcell uppercase tracking-[2px] font-form",
      secondary:
        "bg-[#FAFAFA] text-[#0A2540] hover:bg-[#EEEEEE] shadow-none border border-[#EEEEEE] font-form uppercase tracking-[1px]",
      outline:
        "border border-[#0A2540] bg-transparent hover:bg-[#0A2540] hover:text-white text-[#0A2540] font-form uppercase tracking-[1px]",
      danger:
        "bg-[#EA2027] text-white hover:bg-[#c41b21] shadow-none uppercase tracking-[1px] font-form",
      ghost:
        "bg-transparent hover:bg-[#FAFAFA] text-[#5A7A94] hover:text-[#0A2540] font-button",
    };

    const sizes = {
      sm: "h-9 min-h-9 px-4 text-[12px] rounded-[1px]",
      md: "min-h-9 px-5 text-[13px] rounded-[1px]",
      lg: "min-h-[35px] px-8 text-[13px] rounded-[1px]",
    };

    const finalIsLoading = isLoading || loading;
    const finalOnClick = onClick || onclickFunction;

    return (
      <button
        ref={ref}
        onClick={finalOnClick}
        disabled={disabled || finalIsLoading}
        className={cn(
          "inline-flex items-center justify-center font-bold transition-colors duration-150 ease-smooth focus:outline-none focus:ring-2 focus:ring-[#34495e]/30 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:opacity-95",
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
