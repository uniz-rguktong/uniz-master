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
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        {icon && (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-[0_1px_2px_rgba(10,10,10,0.16)]">
            {icon}
          </div>
        )}
        <div className="space-y-1.5">
          {eyebrow && <span className={adminEyebrowClass}>{eyebrow}</span>}
          <h1 className={adminTitleClass}>{title}</h1>
          {subtitle && <p className={adminSubtitleClass}>{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}

export default SectionHeader;
