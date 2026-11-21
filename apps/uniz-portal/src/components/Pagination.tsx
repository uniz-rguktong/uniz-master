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
 "inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-full border border-head bg-transparent px-4 text-small font-semibold text-head transition-colors duration-150 hover:bg-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-[0.45] max-[639px]:h-11";

const pageBtnClass = (active: boolean) =>
 cn(
 "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-small font-medium tabular-nums transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring max-[639px]:h-11",
 active ? "bg-primary text-primary-foreground" : "text-text-2 hover:bg-tint",
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
 "flex flex-col gap-3 px-0 py-3 sm:flex-row sm:items-center sm:justify-end",
 className,
 )}
 >
 <p className="text-small font-medium text-text-2 tabular-nums">
 Page{" "}
 <span className="font-semibold text-text">{currentPage}</span>
 {" of "}
 <span className="font-semibold text-text">{totalPages}</span>
 {rangeStart != null && rangeEnd != null && totalItems != null && (
 <span className="text-text-3">
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
 <span className="w-6 select-none text-center text-caption text-text-3">
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
