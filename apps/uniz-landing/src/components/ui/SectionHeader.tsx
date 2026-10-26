import * as React from "react";
import { cn } from "../../lib/utils";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  pillText?: string;
  heading: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  pillText,
  heading,
  subtitle,
  align = "left",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col max-w-2xl",
        align === "center" ? "mx-auto text-center items-center" : "text-left items-start",
        className
      )}
      {...props}
    >
      {pillText && (
        <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-[#0A2540] mb-4">
          {pillText}
        </p>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#061B33] leading-tight">
        {heading}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
