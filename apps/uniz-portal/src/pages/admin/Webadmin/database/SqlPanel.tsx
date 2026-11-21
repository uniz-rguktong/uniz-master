import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { PostgreSQL, sql } from "@codemirror/lang-sql";
import { adminInputClass, adminLabelClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { toast } from "@/utils/toast-ref";
import { DbAdminError, runSql, type ColumnInfo } from "./databaseApi";

const RECENT_KEY = "uniz.dbadmin.sqlRecent";

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string").slice(0, 15);
  } catch {
    return [];
  }
}

function remember(statement: string) {
  const trimmed = statement.trim();
  if (!trimmed) return;
  const next = [trimmed, ...readRecent().filter((item) => item !== trimmed)].slice(0, 15);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* a full browser store should not block the query */
  }
}

export interface SqlResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  message: string;
}

export function SqlPanel({
  databaseId,
  table,
  columns,
  open,
  onResult,
}: {
  databaseId: string;
  table: string;
  columns: ColumnInfo[];
  open: boolean;
  onResult: (result: SqlResult) => void;
}) {
  const editorText = useRef("");
  const [recent, setRecent] = useState<string[]>(() => readRecent());
  const [confirmText, setConfirmText] = useState("");
  const [typed, setTyped] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const viewText = useRef<(value: string) => void>(() => {});

  function rememberView(value: string) {
    editorText.current = value;
  }

  async function run(sqlText: string, confirm?: string) {
    const statement = sqlText.trim();
    if (!statement || running) return;
    editorText.current = statement;
    setRunning(true);
    setError("");
    try {
      const result = await runSql(databaseId, { sql: statement, confirm });
      setConfirmText("");
      setTyped("");
      remember(statement);
      setRecent(readRecent());
      if (result.columns.length > 0) {
        onResult({
          columns: result.columns,
          rows: result.rows,
          rowCount: result.rowCount,
          message: result.message,
        });
      }
      toast.success(result.message);
    } catch (err: unknown) {
      if (err instanceof DbAdminError && err.confirmText) {
        setConfirmText(err.confirmText);
        setError(err.message);
      } else {
        const message = err instanceof DbAdminError ? err.message : "The command could not be run.";
        setError(message);
        toast.error(message);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className={open ? "flex h-64 shrink-0 flex-col border-b border-border bg-surface" : "hidden"} aria-hidden={open ? undefined : true}>
      <div className="flex items-center gap-3 border-b border-border px-3 py-2">
        <p className="text-small font-medium text-head">SQL</p>
        <p className="hidden min-w-0 flex-1 truncate text-caption text-text-3 min-[821px]:block">Ctrl or Cmd + Enter to run. A change still asks you to type its first word.</p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {recent.length > 0 ? (
            <select
              className="h-8 max-w-[220px] rounded-md border border-border bg-surface px-2 text-caption text-text"
              aria-label="Recent queries"
              value=""
              onChange={(event) => {
                const next = event.target.value;
                if (!next) return;
                editorText.current = next;
                viewText.current(next);
                setConfirmText("");
              }}
            >
              <option value="">Recent queries</option>
              {recent.map((item) => (
                <option key={item} value={item}>
                  {item.replace(/\s+/g, " ").slice(0, 80)}
                </option>
              ))}
            </select>
          ) : null}
          <Button type="button" size="compact" disabled={running} isLoading={running} onClick={() => void run(editorText.current, confirmText ? typed : undefined)}>
            Run
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <SqlEditorBridge
          table={table}
          columns={columns}
          open={open}
          onText={rememberView}
          onRun={(sqlText) => void run(sqlText, confirmText ? typed.trim() : undefined)}
          replaceRef={viewText}
        />
      </div>
      {confirmText ? (
        <div className="flex flex-wrap items-end gap-3 border-t border-border px-3 py-3">
          <label className="block min-w-[200px] flex-1">
            <span className={adminLabelClass}>Type {confirmText} to continue</span>
            <input className={adminInputClass} value={typed} onChange={(event) => setTyped(event.target.value)} />
          </label>
          <Button
            type="button"
            size="compact"
            disabled={running || typed.trim() !== confirmText}
            onClick={() => void run(editorText.current, typed.trim())}
          >
            Confirm and run
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="px-3 pb-3 text-small text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SqlEditorBridge({
  table,
  columns,
  open,
  onText,
  onRun,
  replaceRef,
}: {
  table: string;
  columns: ColumnInfo[];
  open: boolean;
  onText: (value: string) => void;
  onRun: (sqlText: string) => void;
  replaceRef: MutableRefObject<(value: string) => void>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const language = useRef(new Compartment());
  const onRunRef = useRef(onRun);
  const onTextRef = useRef(onText);
  onRunRef.current = onRun;
  onTextRef.current = onText;

  useEffect(() => {
    replaceRef.current = (value: string) => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
      onTextRef.current(value);
    };
  }, [replaceRef]);

  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: "",
        extensions: [
          lineNumbers(),
          history(),
          bracketMatching(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          language.current.of(sql({ dialect: PostgreSQL, upperCaseKeywords: true })),
          keymap.of([
            {
              key: "Mod-Enter",
              run: (current) => {
                onRunRef.current(current.state.doc.toString());
                return true;
              },
            },
            ...historyKeymap,
            ...defaultKeymap,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onTextRef.current(update.state.doc.toString());
          }),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": "SQL editor" }),
          EditorView.theme({
            "&": {
              height: "100%",
              backgroundColor: "var(--surface)",
              color: "var(--text)",
            },
            ".cm-scroller": { overflow: "auto" },
            ".cm-content": {
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              fontSize: "13px",
              padding: "8px 0",
            },
            ".cm-gutters": {
              backgroundColor: "var(--surface-2)",
              color: "var(--text-3)",
              borderRight: "1px solid var(--border)",
            },
            ".cm-activeLine, .cm-activeLineGutter": {
              backgroundColor: "var(--tint-2)",
            },
            "&.cm-focused": {
              outline: "2px solid var(--ring)",
              outlineOffset: "-2px",
            },
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (open) viewRef.current?.requestMeasure();
  }, [open]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const schema = table && columns.length > 0 ? { [table]: columns.map((column) => column.name) } : undefined;
    view.dispatch({
      effects: language.current.reconfigure(sql({ dialect: PostgreSQL, upperCaseKeywords: true, schema })),
    });
  }, [columns, table]);

  return <div ref={hostRef} className="h-full min-h-[140px]" />;
}
