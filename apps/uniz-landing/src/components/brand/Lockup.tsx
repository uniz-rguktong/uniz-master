import { cn } from "@/lib/utils";

export function Lockup({
  mark = 32,
  word = 20,
  className,
}: {
  mark?: number;
  word?: number;
  className?: string;
}) {
  const gap = Math.max(8, Math.round(mark * 0.26));
  return (
    <span className={cn("inline-flex items-center text-current", className)} style={{ gap }}>
      <img src="/rgukt-logo.png" alt="" width={mark} height={mark} className="h-auto w-auto" style={{ height: mark }} />
      <span
        className="font-serif font-semibold leading-none tracking-[-0.01em]"
        style={{ fontSize: word }}
      >
        RGUKT Ongole
      </span>
    </span>
  );
}
