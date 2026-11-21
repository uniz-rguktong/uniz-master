import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One tinted container. Do not put a panel inside a panel.
 * A tile may sit inside a panel.
 */
export function Panel({
  children,
  title,
  lede,
  size = "default",
  className,
}: {
  children?: ReactNode;
  title?: ReactNode;
  lede?: ReactNode;
  /** `large` is 48px padding on desktop. Default is 32px. Mobile is 16px. */
  size?: "default" | "large";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-panel text-text",
        size === "large" ? "p-4 min-[821px]:p-12" : "p-4 min-[821px]:p-8",
        className,
      )}
    >
      {title ? (
        <h2 className="font-serif text-[24px] font-normal leading-8 tracking-[-0.01em] text-head min-[821px]:text-h2 min-[821px]:leading-9">
          {title}
        </h2>
      ) : null}
      {lede ? <p className={cn("text-body text-text-2", title && "mt-2")}>{lede}</p> : null}
      {children ? <div className={cn(title || lede ? "mt-6" : undefined)}>{children}</div> : null}
    </section>
  );
}
