import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type TableColumn<T> = {
  id: string;
  header: ReactNode;
  /** Plain label for the stacked list when `header` is not a string. */
  label?: string;
  /** Right-align and use tabular figures. */
  numeric?: boolean;
  /** Keep this column visible while the table scrolls sideways. */
  pin?: boolean;
  /** Pixel width used to place pinned columns. */
  width?: number;
  cell: (row: T) => ReactNode;
  /** Title line in the stacked list under 640px. One column should set this. */
  primary?: boolean;
  /** Meta line in the stacked list. Up to two columns. */
  meta?: boolean;
};

/**
 * Open table. No wrapper border. Under 640px it becomes a hairline list.
 */
export function Table<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  onRowDoubleClick,
  selectedId,
  toolbar,
  footer,
  empty,
  className,
}: {
  columns: TableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  selectedId?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  const primary = columns.find((column) => column.primary) ?? columns[0];
  const meta = columns.filter((column) => column.meta).slice(0, 2);
  const columnLabel = (column: TableColumn<T>) =>
    column.label ?? (typeof column.header === "string" ? column.header : column.id);

  let pinCursor = 0;
  const pinLayout: { pinned: boolean; left: number; width?: number; last: boolean }[] = columns.map(
    (column) => {
      if (!column.pin) return { pinned: false, left: 0, width: column.width, last: false };
      const width = column.width ?? 120;
      const left = pinCursor;
      pinCursor += width;
      return { pinned: true, left, width, last: false };
    },
  );
  const lastPinned = pinLayout.map((item) => item.pinned).lastIndexOf(true);
  if (lastPinned >= 0) pinLayout[lastPinned].last = true;
  const pinned = pinCursor > 0;
  const tableWidth = columns.reduce(
    (sum, column) => sum + (column.width ?? (column.pin ? 120 : 160)),
    0,
  );

  return (
    <div className={className}>
      {toolbar ? <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{toolbar}</div> : null}
      {rows.length === 0 && empty ? (
        empty
      ) : (
        <>
          <div className="hidden max-w-full overflow-x-auto sm:block">
            <table
              className={cn(
                "border-collapse text-left",
                pinned ? "table-fixed" : "w-max min-w-full",
              )}
              style={pinned ? { width: tableWidth, minWidth: "100%" } : undefined}
            >
              <thead className="sticky top-0 bg-bg">
                <tr>
                  {columns.map((column, index) => {
                    const pin = pinLayout[index];
                    return (
                      <th
                        key={column.id}
                        scope="col"
                        style={
                          pin.pinned
                            ? { left: pin.left, minWidth: pin.width, width: pin.width }
                            : column.width
                              ? { minWidth: column.width }
                              : undefined
                        }
                        className={cn(
                          "h-11 whitespace-nowrap border-b border-border-strong px-3 text-small font-semibold text-text-2",
                          column.numeric && "text-right tabular-nums",
                          pin.pinned && "sticky z-30 overflow-hidden bg-bg",
                          pin.last && "border-r border-border",
                        )}
                      >
                        <div className={cn("flex items-center gap-1", column.numeric && "justify-end")}>
                          {column.header}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const id = getRowId(row);
                  const selected = selectedId === id;
                  return (
                    <tr
                      key={id}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
                      className={cn(
                        "group h-14 border-b border-border text-dense text-text transition-colors duration-150",
                        onRowClick && "cursor-pointer",
                        selected ? "bg-selected" : "hover:bg-tint",
                      )}
                    >
                      {columns.map((column, index) => {
                        const pin = pinLayout[index];
                        return (
                          <td
                            key={column.id}
                            style={
                              pin.pinned
                                ? { left: pin.left, minWidth: pin.width, width: pin.width }
                                : column.width
                                  ? { minWidth: column.width }
                                  : undefined
                            }
                            className={cn(
                              "px-3 align-middle",
                              column.numeric && "text-right tabular-nums",
                              pin.pinned && "sticky z-10 overflow-hidden bg-bg group-hover:bg-tint",
                              pin.pinned && selected && "bg-selected group-hover:bg-selected",
                              pin.last && "border-r border-border",
                            )}
                          >
                            {column.cell(row)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden">
            {rows.map((row) => {
              const id = getRowId(row);
              const body = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-6 text-head">
                      {primary?.cell(row)}
                    </span>
                    {meta.map((column) => (
                      <span key={column.id} className="mt-0.5 block text-small leading-[18px] text-text-2">
                        {columnLabel(column)}: {column.cell(row)}
                      </span>
                    ))}
                  </span>
                  {onRowClick ? (
                    <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-text-3" aria-hidden />
                  ) : null}
                </>
              );
              const classes = "flex w-full items-center gap-3 border-b border-border py-3 text-left";
              if (onRowClick) {
                return (
                  <button key={id} type="button" onClick={() => onRowClick(row)} className={classes}>
                    {body}
                  </button>
                );
              }
              return (
                <div key={id} className={classes}>
                  {body}
                </div>
              );
            })}
          </div>
        </>
      )}
      {footer ? <div className="mt-4 flex justify-end">{footer}</div> : null}
    </div>
  );
}
