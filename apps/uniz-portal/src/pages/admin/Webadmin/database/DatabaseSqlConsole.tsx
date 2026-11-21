import { useState } from "react";
import { Button } from "@/components/ui/button";
import { adminLabelClass, adminTextareaClass, adminInputClass } from "@/components/admin/admin-ui";
import { DbAdminError, runSql } from "./databaseApi";

export default function DatabaseSqlConsole({ databaseId }: { databaseId: string }) {
  const [sql, setSql] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [running, setRunning] = useState(false);

  async function run(confirm?: string) {
    setRunning(true);
    setError("");
    setMessage("");
    try {
      const result = await runSql(databaseId, { sql, confirm });
      setConfirmText("");
      setTyped("");
      setColumns(result.columns);
      setRows(result.rows);
      setMessage(result.message);
    } catch (err: unknown) {
      if (err instanceof DbAdminError && err.confirmText) {
        setConfirmText(err.confirmText);
        setError(err.message);
      } else {
        setError(err instanceof DbAdminError ? err.message : "The command could not be run.");
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void run(confirmText ? typed : undefined);
      }}
    >
      <label className="block">
        <span className={adminLabelClass}>Database command</span>
        <textarea
          className={adminTextareaClass}
          rows={10}
          value={sql}
          spellCheck={false}
          onChange={(event) => {
            setSql(event.target.value);
            setConfirmText("");
          }}
        />
      </label>
      <p className="text-body leading-6 text-text-2">
        A command that only reads data runs immediately. A command that changes data asks you to type its first word.
      </p>
      <Button type="submit" size="hero" disabled={running || !sql.trim()}>
        Run command
      </Button>
      {confirmText ? (
        <div className="space-y-3 rounded-lg border border-border bg-panel p-4">
          <p className="text-body text-head">This will change data. Type {confirmText} to continue.</p>
          <label className="block">
            <span className={adminLabelClass}>Confirmation</span>
            <input className={adminInputClass} value={typed} onChange={(event) => setTyped(event.target.value)} />
          </label>
          <Button type="button" size="hero" disabled={running || typed.trim() !== confirmText} onClick={() => void run(typed.trim())}>
            Confirm and run
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-body text-error">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-body font-medium text-head">{message}</p> : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} className="border-b border-border px-3 py-3 text-small font-medium text-text-2">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-border">
                  {columns.map((column) => (
                    <td key={column} className="max-w-[240px] truncate px-3 py-3 text-dense text-text">
                      {row[column] === null || row[column] === undefined
                        ? "—"
                        : typeof row[column] === "object"
                          ? JSON.stringify(row[column])
                          : String(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </form>
  );
}
