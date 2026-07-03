import { cn } from "@/lib/utils";
import { portalInputClass } from "@/lib/portal-ui";
import * as React from "react";

export interface InputProps extends React.ComponentProps<"input"> {
  /** Apply portal navy form styling (min 44px touch target). */
  portal?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, portal = false, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          portal
            ? portalInputClass
            : "flex min-h-11 w-full rounded-portal-xl border border-navy-200 bg-background px-3.5 py-2 text-[15px] text-foreground transition-shadow placeholder:text-navy-300 focus-visible:border-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900/10 disabled:cursor-not-allowed disabled:opacity-50",
          type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
          type === "file" &&
            "p-0 pr-3 italic text-muted-foreground/70 file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-input file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
