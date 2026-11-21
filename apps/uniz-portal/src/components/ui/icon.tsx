import type { LucideIcon, LucideProps } from "lucide-react";

/** Allowed icon sizes. Stroke is 1.5 at 28px and 1.75 below that. */
export const iconSizes = [16, 18, 20, 28] as const;
export type IconSize = (typeof iconSizes)[number];

/**
 * Lucide wrapper. Decorative by default (`aria-hidden`).
 * Put the accessible name on the control, not the icon.
 */
export function Icon({
  icon: Cmp,
  size = 18,
  className,
  ...rest
}: {
  icon: LucideIcon;
  size?: IconSize;
} & Omit<LucideProps, "size" | "strokeWidth" | "ref" | "icon">) {
  return (
    <Cmp
      aria-hidden
      className={className}
      {...rest}
      size={size}
      strokeWidth={size >= 28 ? 1.5 : 1.75}
    />
  );
}
