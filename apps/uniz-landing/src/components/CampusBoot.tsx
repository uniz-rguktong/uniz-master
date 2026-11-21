import { cn } from "@/lib/utils";

type CampusBootProps = {
  label?: string;
  className?: string;
};

export function CampusBoot({
  label = "Loading campus",
  className = "min-h-[50vh]",
}: CampusBootProps) {
  return (
    <div
      className={cn("w-full", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      <div className="mx-auto w-full max-w-[1232px] px-5 py-12 min-[821px]:px-10">
        <div className="skeleton h-8 w-56 max-w-full" />
        <div className="skeleton mt-4 h-4 w-80 max-w-full" />
        <div className="mt-10 max-w-[65ch] space-y-3">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
