type CampusBootProps = {
  label?: string;
  className?: string;
};

export function CampusBoot({
  label = "Loading campus",
  className = "min-h-screen",
}: CampusBootProps) {
  return (
    <div
 className={`relative flex w-full flex-col items-center justify-center bg-white text-ink ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <img src="/rgukt-logo.png" alt="" className="h-11 w-11 object-contain" />
        <div className="flex flex-col">
 <span className="font-serif text-[1.5rem] font-semibold leading-none tracking-tight text-navy-900">
            uniZ
          </span>
 <span className="mt-1 text-xs font-medium text-ink-muted">
            Ongole campus portal
          </span>
        </div>
      </div>
      <div
 className="mt-8 h-10 w-10 animate-spin rounded-full border-2 border-navy border-t-transparent motion-reduce:animate-none"
        aria-hidden="true"
      />
 <p className="mt-4 text-sm text-ink-muted">{label}</p>
 <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-red" aria-hidden="true" />
    </div>
  );
}
