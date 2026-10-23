import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  totalItems?: number;
  pageSize?: number;
}

const navBtnClass =
  "inline-flex items-center justify-center gap-1.5 h-9 min-w-[2.25rem] px-2.5 rounded-[2px] border border-[#EEEEEE] bg-white text-[12px] font-semibold text-[#5A7A94] transition-colors hover:border-[#9bb0c4] hover:bg-[#FAFAFA] hover:text-[#0A2540] disabled:opacity-35 disabled:pointer-events-none disabled:hover:bg-white disabled:hover:border-[#EEEEEE]";

const pageBtnClass = (active: boolean) =>
  cn(
    "inline-flex items-center justify-center h-9 min-w-[2.25rem] px-2 rounded-[2px] text-[12px] font-semibold tabular-nums transition-colors font-form",
    active
      ? "bg-[#34495e] text-white border border-[#34495e]"
      : "bg-white text-[#5A7A94] border border-[#EEEEEE] hover:border-[#9bb0c4] hover:bg-[#FAFAFA] hover:text-[#0A2540]",
  );

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const rangeStart =
    totalItems != null && pageSize
      ? (currentPage - 1) * pageSize + 1
      : null;
  const rangeEnd =
    totalItems != null && pageSize
      ? Math.min(currentPage * pageSize, totalItems)
      : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3.5 bg-[#FAFAFA] border-t border-[#EEEEEE]",
        className,
      )}
    >
      <p className="text-[12px] font-medium text-navy-500 tabular-nums">
        Page{" "}
        <span className="text-navy-900 font-semibold">{currentPage}</span>
        {" of "}
        <span className="text-navy-900 font-semibold">{totalPages}</span>
        {rangeStart != null && rangeEnd != null && totalItems != null && (
          <span className="text-navy-400">
            {" · "}
            {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
            {totalItems.toLocaleString()}
          </span>
        )}
      </p>

      <nav
        className="flex items-center justify-center sm:justify-end gap-1"
        aria-label="Pagination"
      >
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className={navBtnClass}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-1 px-0.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
            )
            .map((p, i, arr) => (
              <div key={p} className="flex items-center gap-1">
                {i > 0 && arr[i - 1] !== p - 1 && (
                  <span className="w-6 text-center text-[11px] font-semibold text-navy-300 select-none">
                    …
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={pageBtnClass(currentPage === p)}
                  aria-label={`Page ${p}`}
                  aria-current={currentPage === p ? "page" : undefined}
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
          className={navBtnClass}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </nav>
    </div>
  );
}
