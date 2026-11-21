import { cn } from "@/lib/utils";

type Cut = "default" | "small" | "tiny" | "maskable";

/**
 * O3 UZ monogram. Cut follows the CSS size:
 * default above 32px, small at 17–32px, tiny at 16px.
 * Colour is `currentColor`.
 */
export function Mark({
  size = 32,
  cut,
  className,
  title,
}: {
  size?: number;
  /** Override the size-based cut. `maskable` is the PWA safe-zone glyph. */
  cut?: Cut;
  className?: string;
  title?: string;
}) {
  const resolved: Cut =
    cut ?? (size <= 16 ? "tiny" : size <= 32 ? "small" : "default");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {resolved === "default" && <DefaultGlyph />}
      {resolved === "small" && <SmallGlyph />}
      {resolved === "tiny" && <TinyGlyph />}
      {resolved === "maskable" && <MaskableGlyph />}
    </svg>
  );
}

function DefaultGlyph() {
  return (
    <>
      <path
        d="M9.000 15.600V39.500A12.500 12.500 0 0 0 34.000 39.500V15.600H26.600V39.500A5.100 5.100 0 0 1 16.400 39.500V15.600Z"
        fill="currentColor"
      />
      <rect x="6.480" y="12.000" width="11.180" height="3.600" fill="currentColor" />
      <rect x="25.340" y="12.000" width="11.180" height="3.600" fill="currentColor" />
      <path
        d="M39.000 12.000H55.000V19.400H39.000Z M39.000 44.600H55.000V52.000H39.000Z M51.678 14.070L58.322 17.330L42.322 49.930L35.678 46.670Z"
        fill="currentColor"
      />
    </>
  );
}

function SmallGlyph() {
  return (
    <>
      <path
        d="M9.000 11.000V35.500A12.000 12.000 0 0 0 33.000 35.500V11.000H24.000V35.500A3.000 3.000 0 0 1 18.000 35.500V11.000Z"
        fill="currentColor"
      />
      <path
        d="M38.000 11.000H55.000V20.000H38.000Z M38.000 44.000H55.000V53.000H38.000Z M51.000 13.439L59.000 17.561L42.000 50.561L34.000 46.439Z"
        fill="currentColor"
      />
    </>
  );
}

function TinyGlyph() {
  return (
    <>
      <path
        d="M12.000 12.000V36.000A10.000 10.000 0 0 0 32.000 36.000V12.000H24.000V36.000A2.000 2.000 0 0 1 20.000 36.000V12.000Z"
        fill="currentColor"
      />
      <path
        d="M36.000 12.000H52.000V20.000H36.000Z M36.000 44.000H52.000V52.000H36.000Z M48.422 14.211L55.578 17.789L39.578 49.789L32.422 46.211Z"
        fill="currentColor"
      />
    </>
  );
}

function MaskableGlyph() {
  return (
    <>
      <path
        d="M12.000 19.000V39.500A10.500 10.500 0 0 0 33.000 39.500V19.000H26.000V39.500A3.500 3.500 0 0 1 19.000 39.500V19.000Z"
        fill="currentColor"
      />
      <rect x="9.900" y="16.000" width="10.150" height="3.000" fill="currentColor" />
      <rect x="24.950" y="16.000" width="10.150" height="3.000" fill="currentColor" />
      <path
        d="M38.000 16.000H52.000V23.000H38.000Z M38.000 43.000H52.000V50.000H38.000Z M48.893 17.889L55.107 21.111L41.107 48.111L34.893 44.889Z"
        fill="currentColor"
      />
    </>
  );
}

export type LockupTone = "ink" | "chrome";

/**
 * Horizontal O3 lockup. Compact is the mark plus “UniZ”.
 * Official adds “RGUKT Ongole · Campus Portal”.
 * `ink` is navy on light. `chrome` is white on navy.
 * `mono` paints the descriptor in the same ink as the word.
 */
export function Lockup({
  mark = 32,
  word = 20,
  tone = "ink",
  descriptor = false,
  mono = false,
  className,
}: {
  mark?: number;
  word?: number;
  tone?: LockupTone;
  descriptor?: boolean;
  mono?: boolean;
  className?: string;
}) {
  const ink = tone === "chrome" ? "text-white" : "text-navy-900";
  const descriptorInk = mono
    ? ink
    : tone === "chrome"
      ? "text-navy-300"
      : "text-navy-600";
  const gap = Math.max(8, Math.round(mark * 0.26));

  return (
    <span
      className={cn("inline-flex min-w-0 items-center", ink, className)}
      style={{ gap }}
    >
      <Mark size={mark} />
      <span className="flex min-w-0 flex-col justify-center">
        <span
          className="font-serif font-semibold leading-none tracking-[-0.01em]"
          style={{ fontSize: word }}
        >
          UniZ
        </span>
        {descriptor ? (
          <span
            className={cn("mt-1 font-sans font-medium leading-none", descriptorInk)}
            style={{ fontSize: Math.max(12, Math.round(word * 0.42)) }}
          >
            RGUKT Ongole · Campus Portal
          </span>
        ) : null}
      </span>
    </span>
  );
}
