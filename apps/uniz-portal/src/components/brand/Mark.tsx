import { cn } from "@/lib/utils";

const WORDMARK_W = 352.87;
const WORDMARK_H = 176.14;

export type LockupTone = "ink" | "chrome";

/**
 * M1 “uniZ” wordmark. `chrome` is white on navy.
 * `ink` is navy on light. Colour is `currentColor`.
 */
export function Lockup({
  height = 32,
  tone = "ink",
  className,
  title,
}: {
  height?: number;
  tone?: LockupTone;
  className?: string;
  title?: string;
}) {
  const width = Math.round(((height * WORDMARK_W) / WORDMARK_H) * 100) / 100;
  const ink = tone === "chrome" ? "text-white" : "text-navy-900";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${WORDMARK_W} ${WORDMARK_H}`}
      fill="none"
      className={cn("block shrink-0", ink, className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g transform="translate(12.000,33.760) scale(0.091429)">
        <g fill="currentColor">
          <path
            d="M80 1030V400H324V966Q324 1025 353 1073.5Q382 1122 430.5 1150.5Q479 1179 537 1179Q597 1179 645 1150.5Q693 1122 722 1073.5Q751 1025 751 966V400H995L996 1400H752L751 1309Q699 1363 628 1394.5Q557 1426 476 1426Q367 1426 277 1372.5Q187 1319 133.5 1229.5Q80 1140 80 1030Z"
            transform="translate(-80.00 0)"
          />
          <path
            d="M1036 768V1400H792V832Q792 773 763 724.5Q734 676 685.5 647.5Q637 619 578 619Q519 619 470.5 647.5Q422 676 393.5 724.5Q365 773 365 832V1400H121L120 400H364L365 489Q416 435 487 403.5Q558 372 640 372Q749 372 839 425.5Q929 479 982.5 568.5Q1036 658 1036 768Z"
            transform="translate(906.00 0)"
          />
          <path d="M120 400H364V1400H120Z" transform="translate(1954.00 0)" />
          <path d="M2082.00 0.00H2310.00A16.00 16.00 0 0 1 2326.00 16.00V204.00A16.00 16.00 0 0 1 2310.00 220.00H2082.00A16.00 16.00 0 0 1 2066.00 204.00V16.00A16.00 16.00 0 0 1 2082.00 0.00Z" />
          <path
            d="M0 1400.00V1156.00L612.29 244.00H0V0H1070.00L293.89 1156.00H1070.00V1400.00Z"
            transform="translate(2434.00 0)"
          />
          <path d="M3522.00 -238.00A75.00 75.00 0 1 1 3522.00 -88.00A75.00 75.00 0 1 1 3522.00 -238.00Z" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Z plus the floating dot. Used where the full M1 word does not read
 * (collapsed sidebar, narrow header). Colour is `currentColor`.
 */
export function Mark({
  size = 28,
  className,
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cn("block shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g fill="currentColor" transform="translate(-41.639,19.012) scale(0.024420)">
        <path
          d="M0 1400.00V1156.00L612.29 244.00H0V0H1070.00L293.89 1156.00H1070.00V1400.00Z"
          transform="translate(2434.00 0)"
        />
        <path d="M3522.00 -238.00A75.00 75.00 0 1 1 3522.00 -88.00A75.00 75.00 0 1 1 3522.00 -238.00Z" />
      </g>
    </svg>
  );
}
