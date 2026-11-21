import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one header of a portal screen. Serif title, one meta line,
 * and at most one action (a primary pill).
 */
export function PageHeader({
  title,
  meta,
  action,
  className,
}: {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 min-[821px]:flex-row min-[821px]:items-end min-[821px]:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="break-words font-serif text-[26px] font-normal leading-[34px] tracking-[-0.01em] text-head min-[821px]:text-[32px] min-[821px]:leading-10">
          {title}
        </h1>
        {meta ? <p className="mt-2 text-body leading-6 text-text-2">{meta}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
