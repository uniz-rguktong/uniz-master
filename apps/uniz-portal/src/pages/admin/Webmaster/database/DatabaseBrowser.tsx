import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { adminInputClass } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/utils/toast-ref";
import { ConfirmDialog } from "./ConfirmDialog";
import { DataGrid } from "./DataGrid";
import { HistoryDrawer } from "./HistoryDrawer";
import { RowDrawer } from "./RowDrawer";
import { SqlPanel, type SqlResult } from "./SqlPanel";
import { TableSidebar } from "./TableSidebar";
import {
  DbAdminError,
  deleteRow,
  insertRow,
  listRows,
  listSchemas,
  listTables,
  updateRow,
  type ColumnInfo,
  type FilterOp,
  type TableSummary,
} from "./databaseApi";
import {
  buildDisplayRows,
  dirtyKeys,
  filterLabel,
  newId,
  valuesEqual,
  type DisplayRow,
  type DraftRow,
  type GridFilter,
} from "./model";

function errorText(err: unknown, fallback: string): string {
  return err instanceof DbAdminError ? err.message : fallback;
}

function sqlColumns(result: SqlResult): ColumnInfo[] {
  return result.columns.map((name) => ({
    name,
    dataType: "text",
    udtName: "text",
    nullable: true,
    isPrimaryKey: false,
    enumValues: null,
    input: "text",
  }));
}

export default function DatabaseBrowser({
  databaseId,
  databaseLabel,
}: {
  databaseId: string;
  databaseLabel: string;
}) {
  const [schemas, setSchemas] = useState<string[]>([]);
  const [schema, setSchema] = useState("");
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tableQuery, setTableQuery] = useState("");
  const [table, setTable] = useState("");
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" } | null>(null);
  const [filters, setFilters] = useState<GridFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [edits, setEdits] = useState<Record<string, Record<string, unknown>>>({});
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [sqlOpen, setSqlOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sqlResult, setSqlResult] = useState<SqlResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const searchReady = useRef(false);
  const rowsRequest = useRef(0);

  const resetWork = useCallback(() => {
    setEdits({});
    setDrafts([]);
    setSelected(new Set());
    setFilters([]);
    setSort(null);
    setSearch("");
    setAppliedSearch("");
    setSqlResult(null);
    setDetailKey(null);
    setLoadError("");
  }, []);

  useEffect(() => {
    let cancelled = false;
    listSchemas(databaseId)
      .then((result) => {
        if (cancelled) return;
        setSchemas(result.schemas);
        setSchema((current) => {
          if (current && result.schemas.includes(current)) return current;
          if (result.schemas.includes("public")) return "public";
          return result.schemas[0] || "";
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = errorText(err, "The schemas could not be loaded.");
        setLoadError(message);
        toast.error(message);
      });
    return () => {
      cancelled = true;
    };
  }, [databaseId]);

  useEffect(() => {
    if (!schema) return;
    let cancelled = false;
    setTablesLoading(true);
    listTables(databaseId, schema)
      .then((result) => {
        if (cancelled) return;
        setTables(result.tables);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTables([]);
        toast.error(errorText(err, "The tables could not be loaded."));
      })
      .finally(() => {
        if (!cancelled) setTablesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [databaseId, schema]);

  useEffect(() => {
    const handle = window.setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (!searchReady.current) {
      searchReady.current = true;
      return;
    }
    setOffset(0);
  }, [appliedSearch]);

  const loadRows = useCallback(async () => {
    if (!schema || !table) return;
    const requestId = ++rowsRequest.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await listRows(databaseId, {
        schema,
        table,
        limit: pageSize,
        offset,
        search: appliedSearch || undefined,
        sort: sort?.column,
        direction: sort?.direction,
        filters: filters.map((filter) => ({ column: filter.column, op: filter.op, value: filter.value })),
      });
      if (requestId !== rowsRequest.current) return;
      setColumns(result.columns);
      setRows(result.rows);
      setTotal(result.total);
    } catch (err: unknown) {
      if (requestId !== rowsRequest.current) return;
      const message = errorText(err, "The rows could not be loaded.");
      setLoadError(message);
      toast.error(message);
    } finally {
      if (requestId === rowsRequest.current) setLoading(false);
    }
  }, [appliedSearch, databaseId, filters, offset, pageSize, schema, sort, table]);

  useEffect(() => {
    void loadRows();
  }, [loadRows, reloadToken]);

  const displayRows = useMemo(() => buildDisplayRows(columns, rows, drafts, edits), [columns, drafts, edits, rows]);
  const dirty = useMemo(() => dirtyKeys(edits, drafts), [drafts, edits]);
  const detailRow = displayRows.find((row) => row.key === detailKey) ?? null;
  const hasKey = columns.some((column) => column.isPrimaryKey);
  const pending = dirty.size > 0 || drafts.length > 0;

  function chooseSchema(next: string) {
    setSchema(next);
    setTable("");
    setRows([]);
    setColumns([]);
    setTotal(0);
    setOffset(0);
    setTableQuery("");
    resetWork();
  }

  function chooseTable(next: string) {
    setTable(next);
    setOffset(0);
    setRows([]);
    setColumns([]);
    setTotal(0);
    resetWork();
  }

  function stage(row: DisplayRow, column: string, value: unknown) {
    if (row.kind === "draft") {
      setDrafts((prev) =>
        prev.map((draft) => {
          if (draft.key !== row.key) return draft;
          const values = { ...draft.values };
          if (value === undefined || value === "") delete values[column];
          else values[column] = value;
          return { ...draft, values };
        }),
      );
      return;
    }
    if (!row.primaryKey) return;
    const base = row.base[column];
    setEdits((prev) => {
      const next = { ...prev, [row.key]: { ...(prev[row.key] || {}) } };
      if (valuesEqual(value, base)) {
        delete next[row.key][column];
        if (Object.keys(next[row.key]).length === 0) delete next[row.key];
      } else {
        next[row.key][column] = value;
      }
      return next;
    });
  }

  const save = useCallback(async () => {
    if (saving || !schema || !table) return;
    const draftSnapshot = drafts.filter((draft) => Object.values(draft.values).some((value) => value !== undefined && value !== ""));
    const editSnapshot = edits;
    if (draftSnapshot.length === 0 && Object.keys(editSnapshot).length === 0) {
      if (drafts.length > 0) toast.error("Enter at least one field.");
      return;
    }
    setSaving(true);
    const currentRows = buildDisplayRows(columns, rows, drafts, edits);
    try {
      for (const draft of draftSnapshot) {
        const values: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(draft.values)) {
          if (value === undefined || value === "") continue;
          values[key] = value;
        }
        await insertRow(databaseId, { schema, table, values });
        setDrafts((prev) => prev.filter((item) => item.key !== draft.key));
      }
      for (const [key, values] of Object.entries(editSnapshot)) {
        const match = currentRows.find((item) => item.key === key);
        if (!match?.primaryKey) continue;
        await updateRow(databaseId, { schema, table, primaryKey: match.primaryKey, values });
        setEdits((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
      toast.success("The changes were saved.");
      setReloadToken((token) => token + 1);
    } catch (err: unknown) {
      toast.error(errorText(err, "The changes could not be saved."));
      setReloadToken((token) => token + 1);
    } finally {
      setSaving(false);
    }
  }, [columns, databaseId, drafts, edits, rows, saving, schema, table]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        if (!pending) return;
        event.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, save]);

  async function removeSelected() {
    if (saving) return;
    setSaving(true);
    const keys = Array.from(selected);
    try {
      for (const key of keys) {
        if (key.startsWith("new:")) {
          setDrafts((prev) => prev.filter((draft) => draft.key !== key));
          continue;
        }
        const match = displayRows.find((row) => row.key === key);
        if (!match?.primaryKey) continue;
        await deleteRow(databaseId, {
          schema,
          table,
          primaryKey: match.primaryKey,
          confirm: "DELETE",
        });
        setEdits((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
      setSelected(new Set());
      if (detailKey && keys.includes(detailKey)) setDetailKey(null);
      toast.success(keys.length === 1 ? "The record was removed." : "The selected records were removed.");
      setReloadToken((token) => token + 1);
    } catch (err: unknown) {
      toast.error(errorText(err, "The records could not be removed."));
      setReloadToken((token) => token + 1);
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  function toggleSort(column: string) {
    setOffset(0);
    setSort((current) => {
      if (!current || current.column !== column) return { column, direction: "asc" };
      if (current.direction === "asc") return { column, direction: "desc" };
      return null;
    });
  }

  function addFilter(column: string, op: FilterOp, value: string) {
    setOffset(0);
    setFilters((prev) => {
      const rest = prev.filter((filter) => !(filter.column === column && filter.op === op));
      return [...rest, { id: newId(), column, op, value }];
    });
  }

  const gridColumns = sqlResult ? sqlColumns(sqlResult) : columns;
  const gridRows: DisplayRow[] = sqlResult
    ? sqlResult.rows.map((row, index) => ({
        key: `sql:${index}`,
        kind: "row",
        primaryKey: null,
        base: row,
        values: row,
      }))
    : displayRows;
  const selectedCount = selected.size;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + rows.length, total);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <h1 className="font-serif text-[22px] font-normal leading-7 text-head">Database</h1>
        <a
          href="https://dbadmin.rguktong.in"
          target="_blank"
          rel="noreferrer"
          className="text-caption text-text-3 underline-offset-2 hover:text-text-2 hover:underline"
          title="Separate login for emergencies"
        >
          Emergency Adminer
        </a>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="compact" onClick={() => setHistoryOpen(true)}>
            History
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            aria-pressed={sqlOpen}
            className={sqlOpen ? "bg-tint text-head" : undefined}
            onClick={() => setSqlOpen((open) => !open)}
          >
            SQL
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col min-[821px]:flex-row">
        <TableSidebar
          databaseLabel={databaseLabel}
          schemas={schemas}
          schema={schema}
          onSchema={chooseSchema}
          query={tableQuery}
          onQuery={setTableQuery}
          tables={tables}
          loading={tablesLoading}
          selected={table}
          onSelect={chooseTable}
        />
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {sqlResult ? (
            <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
              <p className="text-small font-medium text-head">Query results</p>
              <p className="text-caption tabular-nums text-text-2">
                {sqlResult.rows.length < sqlResult.rowCount
                  ? `Showing ${sqlResult.rows.length} of ${sqlResult.rowCount}`
                  : `${sqlResult.rowCount} ${sqlResult.rowCount === 1 ? "row" : "rows"}`}
              </p>
              <Button type="button" variant="outline" size="compact" className="ml-auto" onClick={() => setSqlResult(null)}>
                Back to table
              </Button>
            </div>
          ) : (
            <div className="flex shrink-0 flex-col gap-2 border-b border-border px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1">
                  <input
                    className={cn(adminInputClass, "h-9 min-h-9 pr-8 text-small")}
                    value={search}
                    placeholder={table ? "Search this table" : "Choose a table"}
                    aria-label="Search this table"
                    disabled={!table}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search ? (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-text-3 hover:text-head"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X size={14} strokeWidth={1.75} aria-hidden />
                    </button>
                  ) : null}
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label="Refresh" disabled={!table || loading} onClick={() => void loadRows()}>
                  <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
                </Button>
                <Button type="button" variant="outline" size="compact" disabled={!table || columns.length === 0} onClick={() => setDrafts((prev) => [{ key: `new:${newId()}`, values: {} }, ...prev])}>
                  Add record
                </Button>
                {selectedCount > 0 ? (
                  <Button type="button" variant="destructive" size="compact" disabled={saving} onClick={() => setConfirmDelete(true)}>
                    Delete {selectedCount} {selectedCount === 1 ? "record" : "records"}
                  </Button>
                ) : null}
                <div className="ml-auto flex items-center gap-2">
                  {pending ? (
                    <Button type="button" variant="ghost" size="compact" disabled={saving} onClick={() => setConfirmDiscard(true)}>
                      Discard
                    </Button>
                  ) : null}
                  {dirty.size > 0 ? (
                    <Button type="button" size="compact" disabled={saving} isLoading={saving} onClick={() => void save()}>
                      Save {dirty.size} {dirty.size === 1 ? "change" : "changes"}
                    </Button>
                  ) : null}
                </div>
              </div>
              {filters.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-sm bg-tint px-2 py-1 text-caption text-text"
                      aria-label={`Remove filter ${filterLabel(filter)}`}
                      onClick={() => setFilters((prev) => prev.filter((item) => item.id !== filter.id))}
                    >
                      <span>{filterLabel(filter)}</span>
                      <X size={12} strokeWidth={1.75} aria-hidden />
                    </button>
                  ))}
                </div>
              ) : null}
              {table && columns.length > 0 && !hasKey ? (
                <p className="text-caption text-text-2">This table has no key column, so existing rows can be viewed but not changed.</p>
              ) : null}
              {loadError ? (
                <p role="alert" className="text-caption text-error">
                  {loadError}
                </p>
              ) : null}
            </div>
          )}

          <SqlPanel
            databaseId={databaseId}
            table={table}
            columns={columns}
            open={sqlOpen}
            onResult={(result) => {
              setSqlResult(result);
              setDetailKey(null);
            }}
          />

          {!table && !sqlResult ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-body text-text-2">Choose a table from the list.</p>
            </div>
          ) : (
            <DataGrid
              key={sqlResult ? "sql-result" : `${schema}.${table}`}
              columns={gridColumns}
              rows={gridRows}
              loading={loading && !sqlResult}
              editable={!sqlResult}
              sort={sqlResult ? null : sort}
              onSort={toggleSort}
              filteredColumns={new Set(filters.map((filter) => filter.column))}
              onApplyFilter={addFilter}
              selected={selected}
              onToggleRow={(key) => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                });
              }}
              onToggleAll={(keys, on) => {
                setSelected((prev) => {
                  const next = new Set(prev);
                  keys.forEach((key) => {
                    if (on) next.add(key);
                    else next.delete(key);
                  });
                  return next;
                });
              }}
              dirty={sqlResult ? new Set() : dirty}
              onEdit={stage}
              onOpen={(row) => setDetailKey(row.key)}
              emptyTitle={sqlResult ? "No rows" : appliedSearch || filters.length > 0 ? "Nothing matches" : "No rows"}
              emptyBody={
                sqlResult
                  ? "The query returned no rows."
                  : appliedSearch || filters.length > 0
                    ? "Nothing in this table matches the search."
                    : "This table is empty. Add a record to start."
              }
            />
          )}

          {!sqlResult && table ? (
            <footer className="flex h-12 shrink-0 flex-wrap items-center gap-3 border-t border-border px-3 text-small text-text-2">
              <span className="tabular-nums">{total === 0 ? "0 rows" : `${from}–${to} of ${total}`}</span>
              {loading ? <span className="text-caption">Loading…</span> : null}
              <label className="ml-auto flex items-center gap-2">
                <span className="text-caption">Rows per page</span>
                <select
                  className="h-8 rounded-md border border-border bg-surface px-2 text-small text-text"
                  aria-label="Rows per page"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setOffset(0);
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <Button type="button" variant="outline" size="compact" aria-label="Previous page" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - pageSize))}>
                Previous
              </Button>
              <Button type="button" variant="outline" size="compact" aria-label="Next page" disabled={offset + pageSize >= total} onClick={() => setOffset(offset + pageSize)}>
                Next
              </Button>
            </footer>
          ) : null}
        </section>
      </div>

      {detailRow && !sqlResult ? (
        <RowDrawer
          row={detailRow}
          columns={columns}
          editable={hasKey || detailRow.kind === "draft"}
          onClose={() => setDetailKey(null)}
          onEdit={stage}
        />
      ) : null}
      {historyOpen ? (
        <HistoryDrawer
          databaseId={databaseId}
          onClose={() => setHistoryOpen(false)}
          onUndone={() => setReloadToken((token) => token + 1)}
        />
      ) : null}
      {confirmDelete ? (
        <ConfirmDialog
          title={`Delete ${selectedCount} ${selectedCount === 1 ? "record" : "records"}?`}
          body="Saved rows are removed from the database. Each removal is kept in History and can be undone. New rows that are not saved yet are dropped."
          confirmLabel={`Delete ${selectedCount} ${selectedCount === 1 ? "record" : "records"}`}
          busy={saving}
          onConfirm={() => void removeSelected()}
          onClose={() => {
            if (!saving) setConfirmDelete(false);
          }}
        />
      ) : null}
      {confirmDiscard ? (
        <ConfirmDialog
          title="Discard unsaved changes?"
          body="Highlighted cells go back to the saved values. New rows that have not been saved are dropped."
          confirmLabel="Discard"
          tone="primary"
          onConfirm={() => {
            setEdits({});
            setDrafts([]);
            setConfirmDiscard(false);
          }}
          onClose={() => setConfirmDiscard(false)}
        />
      ) : null}
    </div>
  );
}
