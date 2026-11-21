import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ListFilter, PanelRightOpen } from "lucide-react";
import { adminInputClass, adminSelectClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { ColumnInfo, FilterOp } from "./databaseApi";
import { CellEditor } from "./CellEditor";
import { defaultColumnWidth, formatCell, type DisplayRow, typeLabel } from "./model";

const FILTER_OPTIONS: { id: FilterOp; label: string }[] = [
  { id: "eq", label: "equals" },
  { id: "contains", label: "contains" },
  { id: "isnull", label: "is null" },
  { id: "gt", label: "greater than" },
  { id: "lt", label: "less than" },
];

function FilterPopover({
  anchor,
  column,
  onApply,
  onClose,
}: {
  anchor: HTMLElement;
  column: string;
  onApply: (op: FilterOp, value: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLFormElement>(null);
  const [op, setOp] = useState<FilterOp>("contains");
  const [value, setValue] = useState("");
  const [box, setBox] = useState(() => anchor.getBoundingClientRect());

  useEffect(() => {
    function place() {
      setBox(anchor.getBoundingClientRect());
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [anchor]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const left = Math.min(box.left, window.innerWidth - 280);

  return createPortal(
    <form
      ref={panelRef}
      role="dialog"
      aria-label={`Filter ${column}`}
      className="fixed z-50 w-64 rounded-md border border-border-strong bg-surface p-3 shadow-md"
      style={{ top: box.bottom + 4, left: Math.max(8, left) }}
      onSubmit={(event) => {
        event.preventDefault();
        if (op !== "isnull" && !value.trim()) return;
        onApply(op, value.trim());
      }}
    >
      <p className="mb-2 text-caption font-medium text-text-2">{column}</p>
      <label className="block">
        <span className="mb-1 block text-caption text-text-2">Operator</span>
        <select
          className={cn(adminSelectClass, "h-9 min-h-9 text-small")}
          value={op}
          aria-label="Filter operator"
          onChange={(event) => setOp(event.target.value as FilterOp)}
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {op === "isnull" ? null : (
        <label className="mt-2 block">
          <span className="mb-1 block text-caption text-text-2">Value</span>
          <input
            className={cn(adminInputClass, "h-9 min-h-9 text-small")}
            value={value}
            aria-label="Filter value"
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
      )}
      <div className="mt-3">
        <Button type="submit" size="compact">
          Apply filter
        </Button>
      </div>
    </form>,
    document.body,
  );
}

export function DataGrid({
  columns,
  rows,
  loading,
  editable,
  sort,
  onSort,
  filteredColumns,
  onApplyFilter,
  selected,
  onToggleRow,
  onToggleAll,
  dirty,
  onEdit,
  onOpen,
  emptyTitle,
  emptyBody,
}: {
  columns: ColumnInfo[];
  rows: DisplayRow[];
  loading: boolean;
  editable: boolean;
  sort: { column: string; direction: "asc" | "desc" } | null;
  onSort: (column: string) => void;
  filteredColumns: Set<string>;
  onApplyFilter: (column: string, op: FilterOp, value: string) => void;
  selected: Set<string>;
  onToggleRow: (key: string) => void;
  onToggleAll: (keys: string[], on: boolean) => void;
  dirty: Set<string>;
  onEdit: (row: DisplayRow, column: string, value: unknown) => void;
  onOpen: (row: DisplayRow) => void;
  emptyTitle: string;
  emptyBody: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [focus, setFocus] = useState<{ row: number; col: number } | null>(null);
  const [editing, setEditing] = useState<{ row: number; col: number; anchor: HTMLElement } | null>(null);
  const [filterFor, setFilterFor] = useState<{ column: string; anchor: HTMLElement } | null>(null);

  const selectable = rows.filter((row) => row.kind === "draft" || row.primaryKey);
  const allSelected = selectable.length > 0 && selectable.every((row) => selected.has(row.key));

  function beginEdit(rowIndex: number, colIndex: number, anchor: HTMLElement) {
    const row = rows[rowIndex];
    const column = columns[colIndex];
    if (!row || !column || !editable) return;
    if (row.kind === "row" && !row.primaryKey) return;
    setFocus({ row: rowIndex, col: colIndex });
    setEditing({ row: rowIndex, col: colIndex, anchor });
  }

  function moveFocus(next: { row: number; col: number }) {
    setFocus(next);
    const cell = scrollRef.current?.querySelector<HTMLElement>(`[data-cell="${next.row}-${next.col}"]`);
    cell?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function onGridKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (editing || columns.length === 0 || rows.length === 0) return;
    const current = focus ?? { row: 0, col: 0 };
    const rowCount = rows.length;
    const colCount = columns.length;
    let next = current;
    if (event.key === "ArrowDown") next = { row: Math.min(rowCount - 1, current.row + 1), col: current.col };
    else if (event.key === "ArrowUp") next = { row: Math.max(0, current.row - 1), col: current.col };
    else if (event.key === "ArrowRight") next = { row: current.row, col: Math.min(colCount - 1, current.col + 1) };
    else if (event.key === "ArrowLeft") next = { row: current.row, col: Math.max(0, current.col - 1) };
    else if (event.key === "Home") next = { row: event.ctrlKey || event.metaKey ? 0 : current.row, col: 0 };
    else if (event.key === "End") next = { row: event.ctrlKey || event.metaKey ? rowCount - 1 : current.row, col: colCount - 1 };
    else if (event.key === "PageDown") next = { row: Math.min(rowCount - 1, current.row + 10), col: current.col };
    else if (event.key === "PageUp") next = { row: Math.max(0, current.row - 10), col: current.col };
    else if (event.key === "Tab") {
      event.preventDefault();
      if (event.shiftKey) {
        if (current.col === 0) next = { row: Math.max(0, current.row - 1), col: colCount - 1 };
        else next = { row: current.row, col: current.col - 1 };
      } else if (current.col === colCount - 1) next = { row: Math.min(rowCount - 1, current.row + 1), col: 0 };
      else next = { row: current.row, col: current.col + 1 };
    } else if (event.key === "Enter" || event.key === "F2") {
      const cell = scrollRef.current?.querySelector<HTMLElement>(`[data-cell="${current.row}-${current.col}"]`);
      if (!cell) return;
      event.preventDefault();
      beginEdit(current.row, current.col, cell);
      return;
    } else if (event.key === " " && event.target === event.currentTarget) {
      const row = rows[current.row];
      if (row && (row.kind === "draft" || row.primaryKey)) onToggleRow(row.key);
      event.preventDefault();
      return;
    } else return;
    event.preventDefault();
    moveFocus(next);
  }

  function startResize(event: React.PointerEvent, column: ColumnInfo) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = widths[column.name] ?? defaultColumnWidth(column);
    function move(ev: PointerEvent) {
      const next = Math.min(520, Math.max(72, startWidth + ev.clientX - startX));
      setWidths((prev) => ({ ...prev, [column.name]: next }));
    }
    function up() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const editingRow = editing ? rows[editing.row] : null;
  const editingColumn = editing ? columns[editing.col] : null;

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      aria-label="Table rows"
      className="min-h-0 flex-1 overflow-auto outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
      onKeyDown={onGridKeyDown}
    >
      {loading && rows.length === 0 ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      ) : null}
      {!loading && rows.length === 0 ? <EmptyState title={emptyTitle} body={emptyBody} /> : null}
      {rows.length > 0 ? (
        <table
          className={cn("table-fixed border-separate border-spacing-0 text-left", loading && "opacity-60")}
          style={{
            width:
              84 +
              columns.reduce((sum, column) => sum + (widths[column.name] ?? defaultColumnWidth(column)), 0),
          }}
          aria-busy={loading || undefined}
        >
          <thead className="sticky top-0 z-20 bg-surface">
            <tr>
              <th className="sticky left-0 z-30 w-11 border-b border-r border-border bg-surface px-2 py-2">
                <input
                  type="checkbox"
                  aria-label="Select all rows on this page"
                  checked={allSelected}
                  disabled={!editable || selectable.length === 0}
                  onChange={(event) => onToggleAll(selectable.map((row) => row.key), event.target.checked)}
                />
              </th>
              <th className="sticky left-11 z-30 w-10 border-b border-r border-border bg-surface" />
              {columns.map((column) => {
                const width = widths[column.name] ?? defaultColumnWidth(column);
                const activeSort = sort?.column === column.name ? sort.direction : null;
                return (
                  <th
                    key={column.name}
                    scope="col"
                    aria-sort={activeSort === "asc" ? "ascending" : activeSort === "desc" ? "descending" : "none"}
                    className="relative border-b border-r border-border bg-surface px-2 py-1.5 align-bottom"
                    style={{ width, minWidth: width, maxWidth: width }}
                  >
                    <button type="button" className="block w-full pr-6 text-left" onClick={() => onSort(column.name)}>
                      <span className="block truncate whitespace-nowrap text-small font-medium text-head">{column.name}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-caption text-text-3">
                        <span className="truncate">{typeLabel(column)}</span>
                        {column.isPrimaryKey ? <span className="font-medium text-text-2">pk</span> : null}
                        {column.nullable ? <span>null</span> : null}
                        {activeSort ? <span className="text-head">{activeSort === "asc" ? "↑" : "↓"}</span> : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm hover:bg-tint",
                        filteredColumns.has(column.name) ? "text-head" : "text-text-3",
                      )}
                      aria-label={`Filter ${column.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setFilterFor({ column: column.name, anchor: event.currentTarget });
                      }}
                    >
                      <ListFilter size={14} strokeWidth={1.75} aria-hidden />
                    </button>
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${column.name}`}
                      className="absolute inset-y-0 right-0 w-1.5 cursor-col-resize"
                      onPointerDown={(event) => startResize(event, column)}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const isSelected = selected.has(row.key);
              const canSelect = editable && (row.kind === "draft" || Boolean(row.primaryKey));
              const rowBg = isSelected
                ? "bg-tint"
                : row.kind === "draft"
                  ? "bg-[color-mix(in_srgb,var(--success)_10%,var(--surface))]"
                  : "bg-surface";
              return (
                <tr key={row.key}>
                  <td className={cn("sticky left-0 z-10 border-b border-r border-border px-2 py-1", rowBg)}>
                    <input
                      type="checkbox"
                      aria-label={`Select row ${rowIndex + 1}`}
                      checked={isSelected}
                      disabled={!canSelect}
                      onChange={() => onToggleRow(row.key)}
                    />
                  </td>
                  <td className={cn("sticky left-11 z-10 border-b border-r border-border px-1 py-1", rowBg)}>
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-sm text-text-3 hover:bg-tint hover:text-head"
                      aria-label="Open row"
                      onClick={() => onOpen(row)}
                    >
                      <PanelRightOpen size={14} strokeWidth={1.75} aria-hidden />
                    </button>
                  </td>
                  {columns.map((column, colIndex) => {
                    const shown = formatCell(row.values[column.name]);
                    const width = widths[column.name] ?? defaultColumnWidth(column);
                    const isFocus = focus?.row === rowIndex && focus.col === colIndex;
                    const isDirty = dirty.has(`${row.key}\u0000${column.name}`);
                    return (
                      <td
                        key={column.name}
                        data-cell={`${rowIndex}-${colIndex}`}
                        className={cn(
                          "border-b border-r border-border px-2 py-1.5 text-small",
                          rowBg,
                          isDirty && "bg-[color-mix(in_srgb,var(--warning)_18%,var(--surface))]",
                          isFocus && "shadow-[inset_0_0_0_2px_var(--ring)]",
                        )}
                        style={{ width, minWidth: width, maxWidth: width }}
                        onClick={(event) => {
                          setFocus({ row: rowIndex, col: colIndex });
                          scrollRef.current?.focus();
                          event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
                        }}
                        onDoubleClick={(event) => beginEdit(rowIndex, colIndex, event.currentTarget)}
                      >
                        <span className={cn("block truncate", shown.muted && "italic text-text-3")} title={shown.text.length > 80 ? shown.text.slice(0, 300) : undefined}>
                          {shown.text || " "}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
      {editing && editingRow && editingColumn ? (
        <CellEditor
          anchor={editing.anchor}
          column={editingColumn}
          value={editingRow.values[editingColumn.name]}
          onCommit={(value) => {
            if (editingColumn.input !== "binary") onEdit(editingRow, editingColumn.name, value);
            setEditing(null);
            scrollRef.current?.focus();
          }}
          onCancel={() => {
            setEditing(null);
            scrollRef.current?.focus();
          }}
        />
      ) : null}
      {filterFor ? (
        <FilterPopover
          anchor={filterFor.anchor}
          column={filterFor.column}
          onClose={() => setFilterFor(null)}
          onApply={(op, value) => {
            onApplyFilter(filterFor.column, op, value);
            setFilterFor(null);
          }}
        />
      ) : null}
    </div>
  );
}
