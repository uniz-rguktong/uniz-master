import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/utils/toast-ref";
import { DbAdminError, listHistory, undoChange, type HistoryEntry } from "./databaseApi";
import { formatCell } from "./model";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function diffFields(entry: HistoryEntry): { name: string; before: unknown; after: unknown }[] {
  const before = asRecord(entry.before);
  const after = asRecord(entry.after);
  if (before?._truncated || after?._truncated) return [];
  const left = before || {};
  const right = after || {};
  const names = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
  return names
    .filter((name) => JSON.stringify(left[name]) !== JSON.stringify(right[name]))
    .map((name) => ({ name, before: name in left ? left[name] : null, after: name in right ? right[name] : null }));
}

export function HistoryDrawer({
  databaseId,
  onClose,
  onUndone,
}: {
  databaseId: string;
  onClose: () => void;
  onUndone: () => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [openId, setOpenId] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await listHistory(databaseId, offset);
      setEntries(result.entries);
      setTotal(result.total);
    } catch (err: unknown) {
      const message = err instanceof DbAdminError ? err.message : "History could not be loaded.";
      setError(message);
      toast.error(message);
    }
  }, [databaseId, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function undo(entry: HistoryEntry) {
    setBusyId(entry.id);
    try {
      const result = await undoChange(databaseId, entry.id);
      toast.success(result.message);
      onUndone();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof DbAdminError ? err.message : "That change could not be undone.");
    } finally {
      setBusyId("");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-overlay" aria-label="Close history" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-labelledby="history-title" className="relative flex h-full w-full max-w-[460px] flex-col border-l border-border bg-surface shadow-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
          <div>
            <h2 id="history-title" className="font-serif text-[22px] font-normal text-head">
              History
            </h2>
            <p className="mt-1 text-small text-text-2">Every saved change can be reviewed. Row edits can be undone.</p>
          </div>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full text-text-2 hover:bg-tint" aria-label="Close" onClick={onClose}>
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {error ? (
            <p role="alert" className="mb-3 text-small text-error">
              {error}
            </p>
          ) : null}
          {entries.length === 0 && !error ? <EmptyState title="No changes yet" body="Saved row edits will show up here." /> : null}
          <ol className="space-y-3">
            {entries.map((entry) => {
              const fields = diffFields(entry);
              const open = openId === entry.id;
              const truncated = Boolean(asRecord(entry.before)?._truncated || asRecord(entry.after)?._truncated);
              return (
                <li key={entry.id} className="rounded-lg border border-border bg-panel p-4">
                  <p className="text-dense font-medium text-head">{entry.summary}</p>
                  <p className="mt-1 text-caption text-text-2">
                    {new Date(entry.at).toLocaleString()} · {entry.actorUsername}
                    {entry.schema && entry.table !== "(command)" ? ` · ${entry.schema}.${entry.table}` : ""}
                  </p>
                  {entry.undone ? <p className="mt-2 text-small text-text-2">Already undone.</p> : null}
                  {entry.action === "sql" ? <p className="mt-2 text-small text-text-2">This command cannot be undone with one click.</p> : null}
                  {entry.sql ? <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap text-caption text-text">{entry.sql}</pre> : null}
                  {truncated ? <p className="mt-2 text-small text-text-2">The saved copy was too large to show a diff.</p> : null}
                  {fields.length > 0 ? (
                    <div className="mt-3">
                      <button type="button" className="text-caption font-medium text-text-2 hover:text-head" onClick={() => setOpenId(open ? "" : entry.id)}>
                        {open ? "Hide changes" : `Show changes (${fields.length})`}
                      </button>
                      {open ? (
                        <ul className="mt-2 space-y-2">
                          {fields.map((field) => (
                            <li key={field.name} className="rounded-sm bg-surface px-2 py-2">
                              <p className="text-caption font-medium text-text-2">{field.name}</p>
                              <p className="mt-1 text-caption text-text-3">
                                <span className="line-through">{formatCell(field.before).text}</span>
                              </p>
                              <p className="text-caption text-text">{formatCell(field.after).text}</p>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                  {entry.undoable ? (
                    <div className="mt-3">
                      <Button type="button" size="compact" disabled={busyId === entry.id} isLoading={busyId === entry.id} onClick={() => void undo(entry)}>
                        Undo
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex gap-2 border-t border-border px-4 py-3">
          <Button type="button" variant="outline" size="compact" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 30))}>
            Previous
          </Button>
          <Button type="button" variant="outline" size="compact" disabled={offset + 30 >= total} onClick={() => setOffset(offset + 30)}>
            Next
          </Button>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
