import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DbAdminError, listHistory, undoChange, type HistoryEntry } from "./databaseApi";

export default function DatabaseHistory({ databaseId }: { databaseId: string }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const result = await listHistory(databaseId, offset);
      setEntries(result.entries);
      setTotal(result.total);
    } catch (err: unknown) {
      setError(err instanceof DbAdminError ? err.message : "History could not be loaded.");
    }
  }, [databaseId, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  async function undo(entry: HistoryEntry) {
    setBusyId(entry.id);
    setError("");
    setNotice("");
    try {
      const result = await undoChange(databaseId, entry.id);
      setNotice(result.message);
      await load();
    } catch (err: unknown) {
      setError(err instanceof DbAdminError ? err.message : "That change could not be undone.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="text-body text-error">
          {error}
        </p>
      ) : null}
      {notice ? <p className="text-body font-medium text-head">{notice}</p> : null}
      {entries.length === 0 ? <EmptyState title="No changes yet" body="Saved row edits will show up here." /> : null}
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-border bg-panel p-4">
            <p className="font-serif text-[22px] font-normal text-head">{entry.summary}</p>
            <p className="mt-2 text-body text-text-2">
              {new Date(entry.at).toLocaleString()} · {entry.actorUsername}
              {entry.schema && entry.table !== "(command)" ? ` · ${entry.schema}.${entry.table}` : ""}
            </p>
            {entry.undone ? <p className="mt-2 text-body text-text-2">Already undone.</p> : null}
            {entry.action === "sql" ? (
              <p className="mt-2 text-body text-text-2">This command cannot be undone with one click.</p>
            ) : null}
            {entry.sql ? (
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-dense text-text">{entry.sql}</pre>
            ) : null}
            {entry.undoable ? (
              <div className="mt-4">
                <Button type="button" size="hero" disabled={busyId === entry.id} onClick={() => void undo(entry)}>
                  Undo this change
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 30))}>
          Previous page
        </Button>
        <Button type="button" variant="outline" disabled={offset + 30 >= total} onClick={() => setOffset(offset + 30)}>
          Next page
        </Button>
      </div>
    </div>
  );
}
