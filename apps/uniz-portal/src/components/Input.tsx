import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  labelClassName?: string;
  // Legacy support
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
          <label
            className={cn(
              "text-xs font-bold text-neutral-500 uppercase tracking-widest block ml-1 mb-1.5",
              labelClassName,
            )}
          >
            {label}
          </label>
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
              "flex w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm hover:border-neutral-300",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/50"
                : "",
              className,
              icon ? "pl-10" : "",
              isPassword ? "pr-10" : "",
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
          <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-1 ml-1">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
