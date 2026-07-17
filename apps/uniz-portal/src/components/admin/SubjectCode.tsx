import { cn } from "@/lib/utils";

interface SubjectCodeProps {
  code?: string | null;
  className?: string;
}

/**
 * Presentation-only subject code renderer.
 *
 * Subject codes are not normalized here because the current values include
 * generated registration identifiers. Keeping the source value untouched
 * makes the future canonical-code migration safe.
 */
export function SubjectCode({ code, className }: SubjectCodeProps) {
  const displayCode = code?.trim() || "Code unavailable";

  return (
    <code
      title={displayCode}
      aria-label={`Subject code: ${displayCode}`}
      className={cn(
        "block w-fit max-w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1",
        "font-mono text-[10px] font-semibold leading-4 tracking-normal text-zinc-600",
        "whitespace-normal break-all [overflow-wrap:anywhere]",
        className,
      )}
    >
      {displayCode}
    </code>
  );
}
