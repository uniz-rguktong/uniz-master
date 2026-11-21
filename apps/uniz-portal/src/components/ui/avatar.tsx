import { cn } from "@/lib/utils";

const sizes = {
  32: "h-8 w-8 text-caption",
  36: "h-9 w-9 text-small",
  56: "h-14 w-14 text-dense",
  96: "h-24 w-24 text-[18px]",
} as const;

export type AvatarSize = keyof typeof sizes;

function initials(name?: string) {
  if (!name?.trim()) return "";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

/**
 * Circle portrait. Photos keep their alt text. Empty photos show initials
 * on navy-100 (surface-2 in dark).
 */
export function Avatar({
  src,
  alt,
  name,
  size = 36,
  className,
}: {
  src?: string | null;
  alt: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const letters = initials(name || alt);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-100 font-semibold text-navy-900 dark:bg-surface-2 dark:text-text",
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden={alt ? true : undefined}>{letters}</span>
      )}
    </span>
  );
}
