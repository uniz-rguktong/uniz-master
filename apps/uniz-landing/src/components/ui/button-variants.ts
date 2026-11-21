import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,opacity,border-color] duration-150 ease-out disabled:pointer-events-none disabled:opacity-[0.45]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active",
        outline: "border border-head bg-transparent text-head hover:bg-tint-2",
        ghost: "text-text-2 hover:bg-tint-2",
        destructive: "bg-error text-on-error",
      },
      size: {
        hero: "h-[52px] px-7 text-[16px] leading-6",
        default: "h-11 px-6 text-[15px] leading-[22px]",
        compact: "h-9 px-4 text-[14px] leading-5 max-[640px]:h-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);
