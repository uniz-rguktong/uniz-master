import { motion } from "framer-motion";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Frosted card shell — matches calcom-hero feature cards */
export const landingCardClass =
  "rounded-[2.5rem] border border-zinc-100/60 bg-white/60 backdrop-blur-sm overflow-hidden transition-all duration-500";

export const landingCardHoverClass =
  "hover:border-zinc-200 hover:bg-white hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)]";

export function LandingMeshBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -right-[5%] h-[60%] w-[60%] rounded-full bg-gradient-to-br from-blue-50/40 via-blue-100/10 to-transparent blur-[120px] opacity-70"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] -left-[10%] h-[50%] w-[50%] rounded-full bg-gradient-to-tr from-zinc-100/50 via-zinc-100/20 to-transparent blur-[140px] opacity-60"
      />
      <div className="absolute inset-0 opacity-[0.015] grayscale contrast-150 brightness-150 mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
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
    <section id={id} className={cn("relative w-full py-20 md:py-28", className)}>
      <div className="max-w-[1280px] mx-auto px-6">{children}</div>
    </section>
  );
}

export function LandingDivider() {
  return (
    <div className="max-w-[1280px] mx-auto px-6">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/80 to-transparent" />
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
          "flex items-center gap-2.5 mb-4",
          align === "center" && "justify-center",
        )}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
          {eyebrow}
        </span>
      </div>
      <h2
        className={cn(
          "text-[clamp(1.85rem,4.5vw,3.25rem)] md:text-[clamp(2.25rem,5vw,3.75rem)] font-black text-zinc-950 tracking-[-0.05em] leading-[1.02] max-w-4xl",
          align === "center" && "max-w-5xl",
        )}
      >
        {title}
        {titleMuted && (
          <span className="text-zinc-400 font-light"> {titleMuted}</span>
        )}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 text-[15px] md:text-[17px] text-zinc-500 font-medium leading-relaxed max-w-xl",
            align === "center" && "max-w-2xl",
          )}
        >
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
  slate: "bg-slate-100 text-slate-600 border-slate-200",
};

const PILL_DOTS: Record<string, string> = {
  default: "bg-zinc-400",
  emerald: "bg-emerald-500",
  amber: "bg-amber-400",
  blue: "bg-blue-500",
  slate: "bg-slate-400",
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
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9.5px] font-black tracking-widest uppercase",
        PILL_ACCENTS[accent],
        className,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full animate-pulse",
          PILL_DOTS[accent],
        )}
      />
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
        "group relative inline-flex h-12 items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-zinc-950 px-8 text-[14px] font-bold text-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:bg-black",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
      <span className="relative flex items-center gap-2.5">{children}</span>
    </button>
  );
}
