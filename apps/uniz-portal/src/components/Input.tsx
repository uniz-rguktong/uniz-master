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
      id,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const accessibleName =
      ariaLabel ?? (typeof label === "string" ? label : undefined);
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
          <label htmlFor={inputId} className={cn(adminLabelClass, labelClassName)}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-[#5A7A94] transition-colors group-focus-within:text-[#0A2540]">
              {icon}
            </div>
          )}
          <input
            {...props}
            ref={ref}
            id={inputId}
            type={finalType}
            aria-label={accessibleName}
            className={cn(
              adminInputClass,
              "min-h-[44px]",
              error &&
                "border-rose-300 bg-rose-50/50 focus:border-rose-400 focus:ring-rose-500/10",
              icon ? "pl-10" : false,
              isPassword && "pr-10",
              className,
            )}
            placeholder={placeholder}
            onChange={finalOnChange}
          />
          {isPassword && (
            <button
              type="button"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-0.5 top-1/2 flex h-11 min-h-[44px] w-11 min-w-[44px] -translate-y-1/2 items-center justify-center text-navy-400 hover:text-navy-700 focus:outline-none transition-colors"
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
