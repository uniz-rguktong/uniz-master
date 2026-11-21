import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariantsInner = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans font-semibold transition-[background-color,color,border-color,opacity,transform] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-[0.45] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary active:bg-primary-active active:text-on-primary disabled:text-on-primary",
        outline: "border border-head bg-transparent text-head hover:bg-tint",
        ghost: "bg-transparent text-text-2 hover:bg-tint",
        destructive: "bg-error text-on-error hover:text-on-error hover:opacity-90 active:text-on-error disabled:text-on-error",
        link: "h-auto min-h-0 rounded-none px-0 font-medium text-link underline-offset-[1px] hover:underline max-[639px]:min-h-0",
      },
      size: {
        hero: "h-[52px] px-7 text-[16px] leading-6",
        default: "h-11 px-6 text-[15px] leading-[22px]",
        compact:
          "h-9 px-4 text-dense leading-5 max-[639px]:h-11 max-[639px]:px-4",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link"
  | "default"
  | "secondary"
  | "danger"
  | "portal"
  | "portalSecondary"
  | "portalGhost";

export type ButtonSize = "hero" | "default" | "compact" | "icon" | "sm" | "md" | "lg";

const variantAlias: Record<ButtonVariant, NonNullable<VariantProps<typeof buttonVariantsInner>["variant"]>> = {
  primary: "primary",
  default: "primary",
  portal: "primary",
  outline: "outline",
  secondary: "outline",
  portalSecondary: "outline",
  ghost: "ghost",
  portalGhost: "ghost",
  destructive: "destructive",
  danger: "destructive",
  link: "link",
};

const sizeAlias: Record<ButtonSize, NonNullable<VariantProps<typeof buttonVariantsInner>["size"]>> = {
  hero: "hero",
  lg: "hero",
  default: "default",
  md: "default",
  compact: "compact",
  sm: "compact",
  icon: "icon",
};

export function buttonVariants({
  variant = "primary",
  size = "default",
  className,
}: {
  variant?: ButtonVariant | null;
  size?: ButtonSize | null;
  className?: string;
} = {}) {
  return buttonVariantsInner({
    variant: variantAlias[variant ?? "primary"],
    size: sizeAlias[size ?? "default"],
    className,
  });
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  isLoading?: boolean;
  loading?: boolean;
  /** @deprecated Use children. */
  value?: string;
  /** @deprecated Use onClick. */
  onclickFunction?: () => void;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      asChild = false,
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
    const Comp = asChild ? Slot : "button";
    const finalIsLoading = Boolean(isLoading || loading);
    const widthRef = React.useRef<number | undefined>(undefined);
    const innerRef = React.useRef<HTMLButtonElement | null>(null);

    const setRefs = (node: HTMLButtonElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    React.useLayoutEffect(() => {
      if (!finalIsLoading && innerRef.current) {
        widthRef.current = innerRef.current.offsetWidth;
      }
    });

    return (
      <Comp
        ref={setRefs}
        onClick={onClick || onclickFunction}
        disabled={disabled || finalIsLoading}
        aria-busy={finalIsLoading || undefined}
        style={
          finalIsLoading && widthRef.current
            ? { width: widthRef.current }
            : undefined
        }
        className={cn(
          buttonVariants({ variant, size }),
          finalIsLoading && "[&_svg]:hidden",
          className,
        )}
        {...props}
      >
        {finalIsLoading && !asChild ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden />
        ) : null}
        {children || value}
      </Comp>
    );
  },
);

Button.displayName = "Button";
