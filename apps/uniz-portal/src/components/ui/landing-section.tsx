import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  landingContainerClass,
  landingEyebrowClass,
  landingLeadClass,
  landingSectionYClass,
} from "@/lib/landing-ui";

/** Quiet card shell for marketing sections */
export const landingCardClass =
  "rounded-xl border border-navy-200/80 bg-white overflow-hidden transition-[border-color,box-shadow] duration-150";

export const landingCardHoverClass =
  "hover:border-navy-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]";

export function LandingMeshBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white",
        className,
      )}
      aria-hidden
    />
  );
}

export function LandingSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative w-full", landingSectionYClass, className)}>
      <div className={landingContainerClass}>{children}</div>
    </section>
  );
}

export function LandingDivider() {
  return (
    <div className="max-w-[1280px] mx-auto px-6">
      <div className="h-px w-full bg-navy-200/80" />
    </div>
  );
}

export function LandingSectionHeader({
  eyebrow,
  title,
  titleMuted,
  description,
  className,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  titleMuted?: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "mb-10 md:mb-14",
        align === "center" && "text-center flex flex-col items-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 mb-4",
          align === "center" && "justify-center",
        )}
      >
        <span className={landingEyebrowClass}>{eyebrow}</span>
      </div>
      <h2
        className={cn(
          "text-[clamp(1.85rem,4.5vw,3.25rem)] md:text-[clamp(2.25rem,5vw,3.75rem)] font-semibold text-navy-900 tracking-[-0.03em] leading-[1.05] max-w-4xl",
          align === "center" && "max-w-5xl",
        )}
      >
        {title}
        {titleMuted && (
          <span className="text-navy-400 font-normal"> {titleMuted}</span>
        )}
      </h2>
      {description && (
        <p className={cn(landingLeadClass, "mt-5", align === "center" && "max-w-2xl")}>
          {description}
        </p>
      )}
    </div>
  );
}

const PILL_ACCENTS: Record<string, string> = {
  default: "bg-zinc-50 text-zinc-600 border-zinc-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  slate: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const PILL_DOTS: Record<string, string> = {
  default: "bg-zinc-400",
  emerald: "bg-emerald-500",
  amber: "bg-amber-400",
  blue: "bg-blue-500",
  slate: "bg-zinc-400",
};

export function LandingPill({
  label,
  accent = "default",
  className,
}: {
  label: string;
  accent?: keyof typeof PILL_ACCENTS;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium",
        PILL_ACCENTS[accent],
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", PILL_DOTS[accent])} />
      {label}
    </span>
  );
}

export function LandingCard({
  children,
  className,
  hover = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "section";
}) {
  return (
    <Tag
      className={cn(
        landingCardClass,
        hover && landingCardHoverClass,
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function LandingCTA({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-navy-900 px-7 text-[14px] font-medium text-white hover:bg-navy-800 active:scale-[0.98] transition-[color,background-color,transform] duration-150",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
