import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Section header. The eyebrow and icon props stay so callers compile;
 * U2 renders the title, one meta line, and the action. Decorative icons
 * and eyebrow pills are not shown.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
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
  const meta = subtitle || eyebrow;
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 min-[900px]:flex-row min-[900px]:flex-wrap min-[900px]:items-end min-[900px]:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-[28px] min-[821px]:leading-9">
          {title}
        </h2>
        {meta ? <p className="mt-2 text-body leading-6 text-text-2">{meta}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 min-[900px]:w-auto min-[900px]:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
