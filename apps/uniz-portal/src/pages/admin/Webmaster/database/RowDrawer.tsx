import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ColumnInfo } from "./databaseApi";
import { commitEditor, editorDraft, type DisplayRow, typeLabel } from "./model";

function FieldEditor({
  column,
  value,
  disabled,
  onCommit,
}: {
  column: ColumnInfo;
  value: unknown;
  disabled: boolean;
  onCommit: (value: unknown) => void;
}) {
  const [draft, setDraft] = useState(() => editorDraft(column, value));
  const [error, setError] = useState("");
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(editorDraft(column, value));
  }, [column, value]);

  function commit(nextDraft: string) {
    try {
      onCommit(commitEditor(column, nextDraft));
      setError("");
    } catch {
      setError("That value is not valid JSON.");
    }
  }

  if (column.input === "binary") {
    return <p className="text-small text-text-2">This field is a file and is left unchanged.</p>;
  }

  if (column.input === "boolean") {
    const current = value === true ? "true" : value === false ? "false" : "";
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="compact" variant={current === "true" ? "primary" : "outline"} disabled={disabled} onClick={() => onCommit(true)}>
          Yes
        </Button>
        <Button type="button" size="compact" variant={current === "false" ? "primary" : "outline"} disabled={disabled} onClick={() => onCommit(false)}>
          No
        </Button>
        {column.nullable ? (
          <Button type="button" size="compact" variant="ghost" disabled={disabled} onClick={() => onCommit(null)}>
            Set NULL
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {column.input === "enum" ? (
        <select
          className={cn(adminSelectClass, "h-9 min-h-9 text-small")}
          value={draft}
          disabled={disabled}
          aria-label={column.name}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            commit(draft);
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            try {
              onCommit(commitEditor(column, event.target.value));
            } catch {
              setError("That value is not valid JSON.");
            }
          }}
        >
          <option value="">Blank</option>
          {(column.enumValues || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}
      {column.input === "json" ? (
        <textarea
          className={cn(adminTextareaClass, "min-h-[140px] font-mono text-small")}
          value={draft}
          disabled={disabled}
          spellCheck={false}
          aria-label={`${column.name} JSON`}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            commit(draft);
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            setError("");
          }}
        />
      ) : null}
      {column.input !== "enum" && column.input !== "json" ? (
        <input
          className={cn(adminInputClass, "h-9 min-h-9 text-small")}
          type={column.input === "date" ? "date" : column.input === "datetime" ? "datetime-local" : "text"}
          inputMode={column.input === "number" ? "decimal" : undefined}
          value={draft}
          disabled={disabled}
          aria-label={column.name}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            commit(draft);
          }}
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : null}
      {error ? <p className="mt-1 text-caption text-error">{error}</p> : null}
      {column.nullable ? (
        <button
          type="button"
          className="mt-2 text-caption font-medium text-text-2 underline-offset-2 hover:text-head hover:underline"
          disabled={disabled}
          onClick={() => onCommit(null)}
        >
          Set NULL
        </button>
      ) : null}
    </div>
  );
}

export function RowDrawer({
  row,
  columns,
  editable,
  onClose,
  onEdit,
}: {
  row: DisplayRow;
  columns: ColumnInfo[];
  editable: boolean;
  onClose: () => void;
  onEdit: (row: DisplayRow, column: string, value: unknown) => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const locked = !editable || (row.kind === "row" && !row.primaryKey);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-overlay" aria-label="Close row" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-labelledby="row-details-title" className="relative flex h-full w-full max-w-[440px] flex-col border-l border-border bg-surface shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div>
            <h2 id="row-details-title" className="font-serif text-[22px] font-normal text-head">
              {row.kind === "draft" ? "New record" : "Row details"}
            </h2>
            <p className="mt-1 text-small text-text-2">Edits stay highlighted until you save them.</p>
          </div>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-text-2 hover:bg-tint" aria-label="Close" onClick={onClose}>
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {locked && row.kind === "row" ? (
          <p className="px-4 pt-4 text-small text-text-2">This table has no key column, so the row cannot be changed.</p>
        ) : null}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {columns.map((column) => (
            <div key={column.name}>
              <p className="mb-1.5 text-caption font-medium text-text">
                {column.name}
                <span className="ml-2 font-normal text-text-3">
                  {typeLabel(column)}
                  {column.isPrimaryKey ? " · pk" : ""}
                  {column.nullable ? " · null" : ""}
                </span>
              </p>
              <FieldEditor column={column} value={row.values[column.name]} disabled={locked} onCommit={(value) => onEdit(row, column.name, value)} />
            </div>
          ))}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
