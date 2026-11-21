import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Wrap({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1232px] px-5 min-[821px]:px-10", className)}>
      {children}
    </div>
  );
}
