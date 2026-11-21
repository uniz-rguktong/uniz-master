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
        "flex max-w-2xl flex-col",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-left",
        className
      )}
      {...props}
    >
      {pillText && (
        <p className="mb-3 text-[15px] leading-6 text-text-2">{pillText}</p>
      )}
      <h2 className="u-section text-head">
        {heading}
      </h2>
      {subtitle && (
        <p className="mt-4 max-w-[65ch] text-[17px] leading-[26px] text-text-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
