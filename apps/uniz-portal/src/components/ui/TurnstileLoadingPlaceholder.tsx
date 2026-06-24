/** Branded placeholder shown while Cloudflare Turnstile iframe loads */
export function TurnstileLoadingPlaceholder() {
  return (
    <div
      className="relative flex w-full max-w-[302px] items-center justify-center overflow-hidden rounded-md border border-zinc-200/90 bg-[#fafafa] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
      role="status"
      aria-label="Loading security check"
    >
      {/* Shimmer sweep */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
        aria-hidden
      >
        <div className="cf-turnstile-shimmer absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </div>

      <div className="relative flex items-center gap-3">
        {/* Orbiting ring + cloud mark */}
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <div
            className="cf-turnstile-ring absolute inset-0 rounded-full border-2 border-transparent border-t-[#F6821F] border-r-[#F6821F]/25"
            aria-hidden
          />
          <svg
            viewBox="0 0 48 32"
            className="cf-turnstile-cloud relative h-5 w-8 text-[#F6821F]"
            fill="currentColor"
            aria-hidden
          >
            <path d="M13.2 24.5c-4.6 0-8.3-3.4-8.3-7.6 0-3.5 2.5-6.4 6-7.2-.3-3.4 2.6-6.2 6.1-6.2 2.2 0 4.1 1.1 5.2 2.8 1-.4 2.1-.6 3.2-.6 4.4 0 7.9 3.2 7.9 7.1 0 .4 0 .8-.1 1.2 2.8.9 4.8 3.4 4.8 6.4 0 3.7-3.2 6.7-7.1 6.7H13.2z" />
          </svg>
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-semibold tracking-tight text-zinc-700">
            Verifying you&apos;re human
          </span>
          <span className="text-[10px] font-medium text-zinc-400">
            Protected by{" "}
            <span className="text-[#F6821F]">Cloudflare</span>
          </span>
        </div>
      </div>
    </div>
  );
}
