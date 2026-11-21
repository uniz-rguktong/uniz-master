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
  /** Preferred pixel width. Flexible columns use this as a minimum. */
  width?: number;
  /** Stay at `width`. Pinned columns and row-action columns are fixed. */
  fixed?: boolean;
  /** Absorb spare width. Only one column grows, and never one that sits before a pinned column. */
  grow?: boolean;
  /** Row menu column. Fixed width, one line, and repeated in the card footer. */
  actions?: boolean;
  /**
   * Clip to one line with an ellipsis. Multi-line cells (name + email, badges
   * with a second line) set this false and wrap inside the column.
   */
  clip?: boolean;
  /** Tooltip for the full value. Shown on the cell. */
  title?: (row: T) => string | undefined;
  cell: (row: T) => ReactNode;
  /** Title line in the stacked list. One column should set this. */
  primary?: boolean;
  /** Meta line in the compact list. Up to two columns. */
  meta?: boolean;
};

function preferredWidth<T>(column: TableColumn<T>) {
  if (column.actions && column.width == null) return 72;
  return column.width ?? (column.pin ? 120 : 160);
}

function isFixedColumn<T>(column: TableColumn<T>) {
  return Boolean(column.fixed || column.actions || column.pin);
}

function pickGrowId<T>(columns: TableColumn<T>[]) {
  const pinnedAfter = (index: number) => columns.slice(index + 1).some((column) => column.pin);
  const usable = (column: TableColumn<T>, index: number) =>
    !isFixedColumn(column) && !pinnedAfter(index);

  const explicit = columns.findIndex((column) => column.grow);
  if (explicit >= 0 && usable(columns[explicit], explicit)) return columns[explicit].id;

  const primary = columns.findIndex((column) => column.primary);
  if (primary >= 0 && usable(columns[primary], primary)) return columns[primary].id;

  for (let index = columns.length - 1; index >= 0; index -= 1) {
    if (usable(columns[index], index)) return columns[index].id;
  }

  const last = columns.length - 1;
  if (last >= 0 && !pinnedAfter(last)) return columns[last].id;
  return undefined;
}

/**
 * Open table. No wrapper border. It fills the container: one column grows,
 * the rest keep their widths, and the row scrolls sideways when the minimum
 * is wider than the container.
 *
 * Under the stack breakpoint it becomes cards (wide) or a hairline list (sm).
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
  loading = false,
  skeletonRows = 6,
  sticky = false,
  stack = "sm",
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
  loading?: boolean;
  skeletonRows?: number;
  /** Stick the header inside the table when the body scrolls. */
  sticky?: boolean;
  /** `wide` stacks into cards below 900px. `sm` keeps the list below 640px. */
  stack?: "sm" | "wide";
}) {
  const primary = columns.find((column) => column.primary) ?? columns[0];
  const meta = columns.filter((column) => column.meta).slice(0, 2);
  const actionColumns = columns.filter((column) => column.actions);
  const columnLabel = (column: TableColumn<T>) =>
    column.label ?? (typeof column.header === "string" ? column.header : column.id);
  const growId = pickGrowId(columns);

  let pinCursor = 0;
  const pinLayout: { pinned: boolean; left: number; width: number; last: boolean }[] = columns.map(
    (column) => {
      const width = preferredWidth(column);
      if (!column.pin) return { pinned: false, left: 0, width, last: false };
      const left = pinCursor;
      pinCursor += width;
      return { pinned: true, left, width, last: false };
    },
  );
  const lastPinned = pinLayout.map((item) => item.pinned).lastIndexOf(true);
  if (lastPinned >= 0) pinLayout[lastPinned].last = true;
  const tableWidth = columns.reduce((sum, column) => sum + preferredWidth(column), 0);

  const desktopClass = stack === "wide" ? "hidden min-[900px]:block" : "hidden sm:block";
  const mobileClass = stack === "wide" ? "min-[900px]:hidden" : "sm:hidden";

  const toolbarNode = toolbar ? (
    <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{toolbar}</div>
  ) : null;

  if (loading) {
    return (
      <div className={cn("min-w-0 max-w-full", className)} aria-busy="true">
        {toolbarNode}
        <div className={desktopClass}>
          <div className="space-y-px">
            <div className="h-11 animate-pulse border-b border-border-strong bg-tint" />
            {Array.from({ length: skeletonRows }, (_, index) => (
              <div key={index} className="h-16 animate-pulse border-b border-border bg-surface-2/70" />
            ))}
          </div>
        </div>
        <div className={cn("space-y-3", mobileClass)}>
          {Array.from({ length: Math.min(skeletonRows, 4) }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-surface-2/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 max-w-full", className)}>
      {toolbarNode}
      {rows.length === 0 && empty ? (
        empty
      ) : (
        <>
          <div
            className={cn(
              "w-full min-w-0 max-w-full overscroll-x-contain",
              desktopClass,
              sticky
                ? "max-h-[min(70vh,calc(100dvh-12rem))] overflow-auto"
                : "overflow-x-auto",
            )}
          >
            <table
              className="table-fixed border-separate border-spacing-0 text-left"
              style={{ width: "100%", minWidth: tableWidth }}
            >
              <colgroup>
                {columns.map((column) => (
                  <col
                    key={column.id}
                    style={
                      column.id === growId
                        ? { minWidth: preferredWidth(column) }
                        : { width: preferredWidth(column) }
                    }
                  />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-30 bg-bg">
                <tr>
                  {columns.map((column, index) => {
                    const pin = pinLayout[index];
                    const grow = column.id === growId;
                    const headerTitle =
                      column.label ?? (typeof column.header === "string" ? column.header : undefined);
                    return (
                      <th
                        key={column.id}
                        scope="col"
                        title={headerTitle}
                        style={{
                          left: pin.pinned ? pin.left : undefined,
                          width: grow ? undefined : pin.width,
                          minWidth: pin.width,
                          maxWidth: grow ? undefined : pin.width,
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
                            "min-w-0 truncate",
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
                        "group h-16 text-dense text-text transition-colors duration-150",
                        onRowClick && "cursor-pointer",
                        selected ? "bg-selected" : "hover:bg-tint",
                      )}
                    >
                      {columns.map((column, index) => {
                        const pin = pinLayout[index];
                        const grow = column.id === growId;
                        const tip = column.title?.(row);
                        return (
                          <td
                            key={column.id}
                            title={tip}
                            style={{
                              left: pin.pinned ? pin.left : undefined,
                              width: grow ? undefined : pin.width,
                              minWidth: pin.width,
                              maxWidth: grow ? undefined : pin.width,
                            }}
                            className={cn(
                              "border-b border-border bg-bg px-3 py-2 align-middle",
                              column.clip === false ? "overflow-visible" : "overflow-hidden",
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
                                column.clip === false
                                  ? "overflow-visible"
                                  : "truncate whitespace-nowrap",
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
          <div className={mobileClass}>
            {stack === "wide"
              ? rows.map((row) => {
                  const id = getRowId(row);
                  const details = columns.filter(
                    (column) => column !== primary && !column.actions,
                  );
                  return (
                    <article
                      key={id}
                      className={cn(
                        "mb-3 rounded-lg border border-border bg-surface p-4",
                        onRowClick && "cursor-pointer",
                        selectedId === id && "bg-selected",
                      )}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
                    >
                      <div className="min-w-0 text-[15px] font-semibold leading-6 text-head">
                        {primary?.cell(row)}
                      </div>
                      {details.length > 0 ? (
                        <dl className="mt-3 space-y-2">
                          {details.map((column) => (
                            <div key={column.id} className="flex items-start justify-between gap-3">
                              <dt className="shrink-0 text-small text-text-2">{columnLabel(column)}</dt>
                              <dd
                                className="min-w-0 text-right text-dense text-text"
                                title={column.title?.(row)}
                              >
                                {column.cell(row)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                      {actionColumns.length > 0 ? (
                        <div className="mt-3 flex justify-end gap-2">
                          {actionColumns.map((column) => (
                            <div key={column.id} onClick={(event) => event.stopPropagation()}>
                              {column.cell(row)}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              : rows.map((row) => {
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
      {footer && rows.length > 0 ? <div className="mt-4 flex justify-end">{footer}</div> : null}
    </div>
  );
}
