import { cn } from "@/lib/utils";

interface SubjectCodeProps {
  code?: string | null;
  /** Official academic code when available (preferred over internal SEMREG ids). */
  academicCode?: string | null;
  className?: string;
}

/** SEMREG-…-{academicCode}-{hash} → academicCode (e.g. 23CS3104). */
function extractAcademicCode(code?: string | null): string | null {
  const raw = String(code || "").trim();
  if (!raw) return null;
  if (!/^SEMREG-/i.test(raw)) return raw.toUpperCase();
  const parts = raw.split("-");
  if (parts.length < 3) return null;
  const candidate = parts[parts.length - 2]?.trim();
  return candidate ? candidate.toUpperCase() : null;
}

/**
 * Presentation-only subject code renderer.
 * Prefers academicCode, then parses SEMREG catalog ids, else shows the raw code.
 */
export function SubjectCode({ code, academicCode, className }: SubjectCodeProps) {
  const displayCode =
    academicCode?.trim().toUpperCase() ||
    extractAcademicCode(code) ||
    code?.trim() ||
    "Code unavailable";

  return (
    <code
      title={displayCode}
      aria-label={`Subject code: ${displayCode}`}
      className={cn(
        "block w-fit max-w-full rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1",
        "font-mono text-[10px] font-semibold leading-4 tracking-normal text-zinc-600",
        "whitespace-nowrap overflow-hidden text-ellipsis",
        className,
      )}
    >
      {displayCode}
    </code>
  );
}
