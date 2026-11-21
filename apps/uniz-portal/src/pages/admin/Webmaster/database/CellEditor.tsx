import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ColumnInfo } from "./databaseApi";
import { commitEditor, editorDraft } from "./model";

export function CellEditor({
  anchor,
  column,
  value,
  onCommit,
  onCancel,
}: {
  anchor: HTMLElement;
  column: ColumnInfo;
  value: unknown;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closed = useRef(false);
  const [draft, setDraft] = useState(() => editorDraft(column, value));
  const [error, setError] = useState("");
  const [box, setBox] = useState(() => anchor.getBoundingClientRect());
  const onCommitRef = useRef(onCommit);
  const onCancelRef = useRef(onCancel);
  onCommitRef.current = onCommit;
  onCancelRef.current = onCancel;

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
    const node = panelRef.current?.querySelector<HTMLElement>("input, textarea, select, button");
    node?.focus();
  }, []);

  function finish(next: unknown) {
    if (closed.current) return;
    closed.current = true;
    onCommitRef.current(next);
  }

  function cancel() {
    if (closed.current) return;
    closed.current = true;
    onCancelRef.current();
  }

  function applyDraft() {
    try {
      finish(commitEditor(column, draft));
    } catch {
      setError("That value is not valid JSON.");
    }
  }

  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        try {
          finish(commitEditor(column, draftRef.current));
        } catch {
          setError("That value is not valid JSON.");
        }
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [column]);

  const width = Math.max(240, Math.min(420, box.width));
  const left = Math.min(box.left, window.innerWidth - width - 12);
  const below = box.bottom + 4;
  const top = below + 220 > window.innerHeight ? Math.max(8, box.top - 220) : below;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby={titleId}
      className="fixed z-50 rounded-md border border-border-strong bg-surface p-3 shadow-md"
      style={{ top, left: Math.max(8, left), width }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (column.input !== "json" || event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          applyDraft();
        }
      }}
    >
      <p id={titleId} className="mb-2 text-caption font-medium text-text-2">
        {column.name}
        <span className="ml-2 font-normal">{column.nullable ? "Null allowed" : "Required"}</span>
      </p>
      {column.input === "binary" ? <p className="text-small text-text-2">This field is a file and is left unchanged.</p> : null}
      {column.input === "boolean" ? (
        <div className="flex gap-2">
          <Button type="button" size="compact" variant={draft === "true" ? "primary" : "outline"} onClick={() => setDraft("true")}>
            Yes
          </Button>
          <Button type="button" size="compact" variant={draft === "false" ? "primary" : "outline"} onClick={() => setDraft("false")}>
            No
          </Button>
        </div>
      ) : null}
      {column.input === "enum" ? (
        <select className={cn(adminSelectClass, "h-9 min-h-9 text-small")} value={draft} onChange={(event) => setDraft(event.target.value)}>
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
          className={cn(adminTextareaClass, "min-h-[120px] font-mono text-small")}
          value={draft}
          spellCheck={false}
          aria-label={`${column.name} JSON`}
          onChange={(event) => {
            setDraft(event.target.value);
            setError("");
          }}
        />
      ) : null}
      {column.input !== "boolean" && column.input !== "enum" && column.input !== "json" && column.input !== "binary" ? (
        <input
          className={cn(adminInputClass, "h-9 min-h-9 text-small")}
          type={column.input === "date" ? "date" : column.input === "datetime" ? "datetime-local" : "text"}
          inputMode={column.input === "number" ? "decimal" : undefined}
          value={draft}
          aria-label={column.name}
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-caption text-error">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {column.input !== "binary" ? (
          <Button type="button" size="compact" onClick={applyDraft}>
            Apply
          </Button>
        ) : (
          <Button type="button" size="compact" variant="ghost" onClick={cancel}>
            Close
          </Button>
        )}
        {column.nullable && column.input !== "binary" ? (
          <Button type="button" size="compact" variant="outline" onClick={() => finish(null)}>
            Set NULL
          </Button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
