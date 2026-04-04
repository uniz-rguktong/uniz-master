import * as React from "react";
import { cn } from "../../lib/utils";
import { Badge } from "./Badge";

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
  align = "center",
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 max-w-3xl",
        align === "center" ? "mx-auto text-center items-center" : "text-left items-start",
        className
      )}
      {...props}
    >
      {pillText && (
        <Badge variant="pill" size="lg">
          {pillText}
        </Badge>
      )}
      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
        {heading}
      </h2>
      {subtitle && (
        <p className="text-lg text-slate-600 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
