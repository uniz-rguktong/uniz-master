import * as React from "react";
import { cn } from "@/lib/utils";
import { portalInputClass } from "@/lib/portal-ui";

export interface InputProps extends React.ComponentProps<"input"> {
  /** Kept so older call sites compile. Both values use the shared field. */
  portal?: boolean;
}

/** Unlabelled field. Prefer `@/components/Input` when the field has a label. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, portal, ...props }, ref) => {
    void portal;
    return (
      <input
        type={type}
        className={cn(
          portalInputClass,
          type === "search" &&
            "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
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
