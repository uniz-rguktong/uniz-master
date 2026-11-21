import React, { useId, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { portalInputClass, portalLabelClass, portalTextareaClass } from "@/lib/portal-ui";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
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
      helper,
      icon,
      labelClassName,
      onchangeFunction,
      onChange,
      placeholder,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === "password";
    const finalType = isPassword ? (isPasswordVisible ? "text" : "password") : type;
    const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-help` : undefined;

    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className={cn(portalLabelClass, labelClassName)}>
            {label}
          </label>
        ) : null}
        <div className="relative">
          {icon ? (
            <div className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-text-3">
              {icon}
            </div>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            type={finalType}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              portalInputClass,
              error && "border-error focus:border-error",
              icon && "pl-11",
              isPassword && "pr-12",
              className,
            )}
            placeholder={placeholder}
            onChange={onChange || onchangeFunction}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setIsPasswordVisible((value) => !value)}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-text-3 hover:bg-tint hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              ) : (
                <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-2 flex items-center gap-1.5 text-small text-error">
            <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        ) : helper ? (
          <p id={`${inputId}-help`} className="mt-2 text-small text-text-3">
            {helper}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className={portalLabelClass}>
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(portalTextareaClass, error && "border-error", className)}
          {...props}
        />
        {error ? (
          <p className="mt-2 flex items-center gap-1.5 text-small text-error">
            <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            {error}
          </p>
        ) : helper ? (
          <p className="mt-2 text-small text-text-3">{helper}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

const controlClass =
  "h-5 w-5 shrink-0 border border-border-strong bg-surface text-navy-600 accent-navy-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-[0.45]";

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="inline-flex min-h-11 items-center gap-3 text-dense text-text">
      <input type="checkbox" className={cn(controlClass, "rounded-[6px]", className)} {...props} />
      {label}
    </label>
  );
}

export function Radio({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="inline-flex min-h-11 items-center gap-3 text-dense text-text">
      <input type="radio" className={cn(controlClass, "rounded-full", className)} {...props} />
      {label}
    </label>
  );
}

export function Switch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-[0.45]",
        checked ? "bg-navy-600" : "bg-border-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-150",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
