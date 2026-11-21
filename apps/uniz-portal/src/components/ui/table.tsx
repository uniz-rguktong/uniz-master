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
  /** Pixel width used to place pinned columns and to stop cells overlapping. */
  width?: number;
  /**
   * Clip to one line with an ellipsis. Multi-line cells (name + email, badges
   * with a second line, action buttons) set this false and wrap inside `width`.
   */
  clip?: boolean;
  /** Tooltip for the full value. Shown on the cell. */
  title?: (row: T) => string | undefined;
  cell: (row: T) => ReactNode;
  /** Title line in the stacked list under 640px. One column should set this. */
  primary?: boolean;
  /** Meta line in the stacked list. Up to two columns. */
  meta?: boolean;
};

function columnWidth<T>(column: TableColumn<T>) {
  return column.width ?? (column.pin ? 120 : 160);
}

/**
 * Open table. No wrapper border. Under 640px it becomes a hairline list.
 * From 640px the table scrolls sideways inside its own box. Every column has
 * a fixed width so cells cannot paint over their neighbours.
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
  const pinLayout: { pinned: boolean; left: number; width: number; last: boolean }[] = columns.map(
    (column) => {
      const width = columnWidth(column);
      if (!column.pin) return { pinned: false, left: 0, width, last: false };
      const left = pinCursor;
      pinCursor += width;
      return { pinned: true, left, width, last: false };
    },
  );
  const lastPinned = pinLayout.map((item) => item.pinned).lastIndexOf(true);
  if (lastPinned >= 0) pinLayout[lastPinned].last = true;
  const tableWidth = columns.reduce((sum, column) => sum + columnWidth(column), 0);

  return (
    <div className={cn("min-w-0 max-w-full", className)}>
      {toolbar ? <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{toolbar}</div> : null}
      {rows.length === 0 && empty ? (
        empty
      ) : (
        <>
          <div className="hidden w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain sm:block">
            <table
              className="table-fixed border-separate border-spacing-0 text-left"
              style={{ width: tableWidth, minWidth: tableWidth }}
            >
              <colgroup>
                {columns.map((column) => (
                  <col key={column.id} style={{ width: columnWidth(column) }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-30 bg-bg">
                <tr>
                  {columns.map((column, index) => {
                    const pin = pinLayout[index];
                    const headerTitle =
                      column.label ?? (typeof column.header === "string" ? column.header : undefined);
                    return (
                      <th
                        key={column.id}
                        scope="col"
                        title={headerTitle}
                        style={{
                          left: pin.pinned ? pin.left : undefined,
                          width: pin.width,
                          minWidth: pin.width,
                          maxWidth: pin.width,
                        }}
                        className={cn(
                          "h-11 overflow-hidden border-b border-border-strong bg-bg px-3 text-left align-middle text-small font-semibold text-text-2",
                          column.numeric && "pl-3 pr-5 text-right tabular-nums",
                          pin.pinned && "sticky z-40 bg-bg",
                          pin.last && "shadow-[1px_0_0_var(--border)]",
                        )}
                      >
                        <div
                          className={cn(
                            "min-w-0",
                            column.clip === false ? "whitespace-normal" : "truncate",
                            column.numeric && "text-right",
                          )}
                        >
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
                        "group h-14 text-dense text-text transition-colors duration-150",
                        onRowClick && "cursor-pointer",
                        selected ? "bg-selected" : "hover:bg-tint",
                      )}
                    >
                      {columns.map((column, index) => {
                        const pin = pinLayout[index];
                        const tip = column.title?.(row);
                        return (
                          <td
                            key={column.id}
                            title={tip}
                            style={{
                              left: pin.pinned ? pin.left : undefined,
                              width: pin.width,
                              minWidth: pin.width,
                              maxWidth: pin.width,
                            }}
                            className={cn(
                              "overflow-hidden border-b border-border bg-bg px-3 align-middle",
                              column.numeric && "pl-3 pr-5 text-right tabular-nums",
                              !pin.pinned && (selected ? "bg-selected" : "group-hover:bg-tint"),
                              pin.pinned && "sticky z-20 bg-bg group-hover:bg-tint",
                              pin.pinned && selected && "bg-selected group-hover:bg-selected",
                              pin.last && "shadow-[1px_0_0_var(--border)]",
                            )}
                          >
                            <div
                              className={cn(
                                "min-w-0",
                                column.clip === false ? "whitespace-normal" : "truncate whitespace-nowrap",
                                column.numeric && "text-right",
                              )}
                            >
                              {column.cell(row)}
                            </div>
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
