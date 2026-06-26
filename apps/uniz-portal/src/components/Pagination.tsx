import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn("flex items-center justify-center gap-2 mt-6", className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-xl border border-zinc-200 enabled:hover:bg-zinc-50 disabled:opacity-40 transition-all"
      >
        <ChevronLeft className="w-4 h-4 text-zinc-600" />
      </button>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (p) =>
              p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
          )
          .map((p, i, arr) => (
            <div key={p} className="flex items-center">
              {i > 0 && arr[i - 1] !== p - 1 && (
                <span className="px-2 text-zinc-300 font-medium">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  "w-9 h-9 rounded-xl text-[13px] font-semibold transition-all",
                  currentPage === p
                    ? "bg-zinc-900 text-white shadow-[0_1px_2px_rgba(10,10,10,0.16)]"
                    : "border border-zinc-200 hover:bg-zinc-50 text-zinc-600",
                )}
              >
                {p}
              </button>
            </div>
          ))}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl border border-zinc-200 enabled:hover:bg-zinc-50 disabled:opacity-40 transition-all"
      >
        <ChevronRight className="w-4 h-4 text-zinc-600" />
      </button>
    </div>
  );
}
