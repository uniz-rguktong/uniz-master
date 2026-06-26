import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { adminLabelClass, adminInputClass } from "./admin/admin-ui";
import { cn } from "../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  labelClassName?: string;
  onchangeFunction?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      icon,
      labelClassName,
      onchangeFunction,
      onChange,
      placeholder,
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === "password";
    const finalType = isPassword
      ? isPasswordVisible
        ? "text"
        : "password"
      : type;

    const finalOnChange = onChange || onchangeFunction;

    return (
      <div className="w-full space-y-1.5 group">
        {label && (
          <label className={cn(adminLabelClass, labelClassName)}>{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-zinc-400 group-focus-within:text-zinc-600 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={finalType}
            className={cn(
              adminInputClass,
              error &&
                "border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-500/10",
              icon && "pl-10",
              isPassword && "pr-10",
              className,
            )}
            placeholder={placeholder}
            onChange={finalOnChange}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 focus:outline-none transition-colors"
            >
              {isPasswordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-[11px] text-rose-600 font-medium mt-1">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
