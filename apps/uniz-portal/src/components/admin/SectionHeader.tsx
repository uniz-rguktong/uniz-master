import { type ReactNode } from "react";
import {
  adminEyebrowClass,
  adminTitleClass,
  adminSubtitleClass,
} from "./admin-ui";
import { cn } from "@/lib/utils";

/**
 * Standard section header used across every admin section so the eyebrow /
 * title / subtitle rhythm and the right-aligned action slot stay identical.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {icon && (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-portal-xl bg-navy-900 text-white shadow-whisper-navy [&_svg]:h-[18px] [&_svg]:w-[18px]"
            aria-hidden
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex flex-col gap-1">
          {eyebrow && (
            <div
              className={cn(
                adminEyebrowClass,
                "flex items-center gap-1.5 leading-none [&_svg]:shrink-0",
              )}
            >
              {eyebrow}
            </div>
          )}
          <h1 className={cn(adminTitleClass, "leading-[1.12]")}>{title}</h1>
          {subtitle && (
            <p className={cn(adminSubtitleClass, "max-w-3xl leading-snug")}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 lg:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;
