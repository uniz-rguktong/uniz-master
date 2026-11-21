import { cn } from "@/lib/utils";

const DEFAULT_PATHS = (
  <>
    <path d="M9.000 15.600V39.500A12.500 12.500 0 0 0 34.000 39.500V15.600H26.600V39.500A5.100 5.100 0 0 1 16.400 39.500V15.600Z" fill="currentColor" />
    <rect x="6.480" y="12.000" width="11.180" height="3.600" fill="currentColor" />
    <rect x="25.340" y="12.000" width="11.180" height="3.600" fill="currentColor" />
    <path d="M39.000 12.000H55.000V19.400H39.000Z M39.000 44.600H55.000V52.000H39.000Z M51.678 14.070L58.322 17.330L42.322 49.930L35.678 46.670Z" fill="currentColor" />
  </>
);

const SMALL_PATHS = (
  <>
    <path d="M9.000 11.000V35.500A12.000 12.000 0 0 0 33.000 35.500V11.000H24.000V35.500A3.000 3.000 0 0 1 18.000 35.500V11.000Z" fill="currentColor" />
    <path d="M38.000 11.000H55.000V20.000H38.000Z M38.000 44.000H55.000V53.000H38.000Z M51.000 13.439L59.000 17.561L42.000 50.561L34.000 46.439Z" fill="currentColor" />
  </>
);

const TINY_PATHS = (
  <>
    <path d="M12.000 12.000V36.000A10.000 10.000 0 0 0 32.000 36.000V12.000H24.000V36.000A2.000 2.000 0 0 1 20.000 36.000V12.000Z" fill="currentColor" />
    <path d="M36.000 12.000H52.000V20.000H36.000Z M36.000 44.000H52.000V52.000H36.000Z M48.422 14.211L55.578 17.789L39.578 49.789L32.422 46.211Z" fill="currentColor" />
  </>
);

export function O3Mark({ size = 32, className }: { size?: number; className?: string }) {
  const paths = size <= 16 ? TINY_PATHS : size <= 32 ? SMALL_PATHS : DEFAULT_PATHS;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {paths}
    </svg>
  );
}

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
