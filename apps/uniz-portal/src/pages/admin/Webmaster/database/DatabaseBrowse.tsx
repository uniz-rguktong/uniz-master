import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  adminInputClass,
  adminLabelClass,
  adminSelectClass,
  adminTextareaClass,
} from "@/components/admin/admin-ui";
import {
  DbAdminError,
  deleteRow,
  insertRow,
  listRows,
  listSchemas,
  listTables,
  updateRow,
  type ColumnInfo,
} from "./databaseApi";

const PAGE = 50;

function formValue(column: ColumnInfo, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (column.input === "boolean") return value === true || value === "true" ? "true" : "false";
  if (column.input === "json" && typeof value !== "string") return JSON.stringify(value, null, 2);
  if (column.input === "datetime" && typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      const pad = (part: number) => String(part).padStart(2, "0");
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function displayCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function DatabaseBrowse({ databaseId }: { databaseId: string }) {
  const [schemas, setSchemas] = useState<string[]>([]);
  const [schema, setSchema] = useState("");
  const [tables, setTables] = useState<string[]>([]);
  const [table, setTable] = useState("");
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [sort, setSort] = useState("");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [filterColumn, setFilterColumn] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [appliedFilter, setAppliedFilter] = useState({ column: "", value: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    primaryKey: Record<string, unknown> | null;
    values: Record<string, string>;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listSchemas(databaseId)
      .then((result) => {
        if (cancelled) return;
        setSchemas(result.schemas);
        setSchema(result.schemas[0] || "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof DbAdminError ? err.message : "The table groups could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [databaseId]);

  useEffect(() => {
    if (!schema) return;
    let cancelled = false;
    setTable("");
    setRows([]);
    setEditor(null);
    listTables(databaseId, schema)
      .then((result) => {
        if (cancelled) return;
        setTables(result.tables);
        setTable(result.tables[0] || "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof DbAdminError ? err.message : "The tables could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [databaseId, schema]);

  const loadRows = useCallback(async () => {
    if (!schema || !table) return;
    setLoading(true);
    setError("");
    try {
      const result = await listRows(databaseId, {
        schema,
        table,
        limit: PAGE,
        offset,
        search: appliedSearch,
        sort: sort || undefined,
        direction,
        filterColumn: appliedFilter.column,
        filterOp: "contains",
        filterValue: appliedFilter.value,
      });
      setColumns(result.columns);
      setRows(result.rows);
      setTotal(result.total);
    } catch (err: unknown) {
      setError(err instanceof DbAdminError ? err.message : "The rows could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilter.column, appliedFilter.value, appliedSearch, databaseId, direction, offset, schema, sort, table]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  function openEdit(row: Record<string, unknown>) {
    const primaryKey: Record<string, unknown> = {};
    const values: Record<string, string> = {};
    columns.forEach((column) => {
      values[column.name] = formValue(column, row[column.name]);
      if (column.isPrimaryKey) primaryKey[column.name] = row[column.name] ?? null;
    });
    setDeleteConfirm("");
    setNotice("");
    setEditor({
      mode: "edit",
      primaryKey: Object.keys(primaryKey).length ? primaryKey : null,
      values,
    });
  }

  function openCreate() {
    const values: Record<string, string> = {};
    columns.forEach((column) => {
      values[column.name] = "";
    });
    setDeleteConfirm("");
    setNotice("");
    setEditor({ mode: "create", primaryKey: null, values });
  }

  function payloadFromEditor(): Record<string, unknown> {
    if (!editor) return {};
    const values: Record<string, unknown> = {};
    columns.forEach((column) => {
      if (column.input === "binary") return;
      const text = editor.values[column.name] ?? "";
      if (editor.mode === "create" && text === "") return;
      if (column.input === "boolean") {
        values[column.name] = text === "" ? null : text === "true";
        return;
      }
      if (text === "" && column.input !== "text") {
        values[column.name] = null;
        return;
      }
      values[column.name] = text;
    });
    return values;
  }

  async function save() {
    if (!editor) return;
    setSaving(true);
    setError("");
    try {
      const values = payloadFromEditor();
      const result =
        editor.mode === "create"
          ? await insertRow(databaseId, { schema, table, values })
          : await updateRow(databaseId, {
              schema,
              table,
              primaryKey: editor.primaryKey || {},
              values,
            });
      setNotice(result.message);
      setEditor(null);
      await loadRows();
    } catch (err: unknown) {
      setError(err instanceof DbAdminError ? err.message : "The row could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editor?.primaryKey) return;
    setSaving(true);
    setError("");
    try {
      const result = await deleteRow(databaseId, {
        schema,
        table,
        primaryKey: editor.primaryKey,
        confirm: deleteConfirm,
      });
      setNotice(result.message);
      setEditor(null);
      await loadRows();
    } catch (err: unknown) {
      setError(err instanceof DbAdminError ? err.message : "The row could not be removed.");
    } finally {
      setSaving(false);
    }
  }

  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + rows.length, total);
  const keyNames = columns.filter((column) => column.isPrimaryKey).map((column) => column.name);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 min-[821px]:grid-cols-2">
        <label className="block">
          <span className={adminLabelClass}>Which group of tables?</span>
          <select className={adminSelectClass} value={schema} onChange={(event) => setSchema(event.target.value)}>
            {schemas.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={adminLabelClass}>Which table?</span>
          <select
            className={adminSelectClass}
            value={table}
            onChange={(event) => {
              setOffset(0);
              setEditor(null);
              setTable(event.target.value);
            }}
          >
            {tables.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form
        className="grid gap-4 min-[821px]:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setOffset(0);
          setAppliedSearch(search.trim());
        }}
      >
        <label className="block">
          <span className={adminLabelClass}>Find text in this table</span>
          <input className={adminInputClass} value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <div className="flex items-end">
          <Button type="submit" size="hero">
            Search
          </Button>
        </div>
      </form>

      <div className="grid gap-4 min-[821px]:grid-cols-4">
        <label className="block">
          <span className={adminLabelClass}>Sort by</span>
          <select className={adminSelectClass} value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="">Table order</option>
            {columns.map((column) => (
              <option key={column.name} value={column.name}>
                {column.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={adminLabelClass}>Direction</span>
          <select
            className={adminSelectClass}
            value={direction}
            onChange={(event) => setDirection(event.target.value === "desc" ? "desc" : "asc")}
          >
            <option value="asc">A to Z</option>
            <option value="desc">Z to A</option>
          </select>
        </label>
        <label className="block">
          <span className={adminLabelClass}>Filter a column</span>
          <select className={adminSelectClass} value={filterColumn} onChange={(event) => setFilterColumn(event.target.value)}>
            <option value="">No filter</option>
            {columns.map((column) => (
              <option key={column.name} value={column.name}>
                {column.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={adminLabelClass}>Filter text</span>
          <input className={adminInputClass} value={filterValue} onChange={(event) => setFilterValue(event.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOffset(0);
            setAppliedFilter({ column: filterColumn, value: filterValue.trim() });
          }}
        >
          Apply filter
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setFilterColumn("");
            setFilterValue("");
            setAppliedFilter({ column: "", value: "" });
            setAppliedSearch("");
            setSearch("");
            setOffset(0);
          }}
        >
          Clear search and filter
        </Button>
        <Button type="button" onClick={openCreate} disabled={!table || columns.length === 0}>
          Add a row
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-body text-error">
          {error}
        </p>
      ) : null}
      {notice ? <p className="text-body font-medium text-head">{notice}</p> : null}
      {loading ? <p className="text-body text-text-2">Loading rows…</p> : null}

      {!loading && table && rows.length === 0 ? (
        <EmptyState title="No rows" body="Nothing in this table matches the search." />
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-bg">
              <tr>
                {columns.map((column) => (
                  <th key={column.name} className="border-b border-border px-3 py-3 text-small font-medium text-text-2">
                    {column.name}
                  </th>
                ))}
                <th className="border-b border-border px-3 py-3 text-small font-medium text-text-2"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={keyNames.map((name) => String(row[name] ?? index)).join("-") || String(index)} className="border-b border-border">
                  {columns.map((column) => (
                    <td key={column.name} className="max-w-[240px] truncate px-3 py-3 text-dense text-text">
                      {displayCell(row[column.name])}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <Button type="button" variant="outline" size="compact" onClick={() => openEdit(row)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-body text-text-2">
          Showing {from}–{to} of {total}
        </p>
        <Button type="button" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
          Previous page
        </Button>
        <Button type="button" variant="outline" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>
          Next page
        </Button>
      </div>

      {editor ? (
        <form
          className="space-y-4 rounded-lg border border-border bg-panel p-4 md:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h3 className="font-serif text-[22px] font-normal text-head">
            {editor.mode === "create" ? "New row" : "Edit this row"}
          </h3>
          {!editor.primaryKey && editor.mode === "edit" ? (
            <p className="text-body text-text-2">This table has no key column, so the row cannot be saved safely.</p>
          ) : null}
          {columns.map((column) => (
            <label key={column.name} className="block">
              <span className={adminLabelClass}>
                {column.name}
                {column.isPrimaryKey ? " (key)" : ""}
              </span>
              {column.input === "binary" ? (
                <p className="text-body text-text-2">This field is a file and is left unchanged.</p>
              ) : null}
              {column.input === "boolean" ? (
                <select
                  className={adminSelectClass}
                  value={editor.values[column.name] || ""}
                  onChange={(event) =>
                    setEditor({ ...editor, values: { ...editor.values, [column.name]: event.target.value } })
                  }
                >
                  <option value="">Blank</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : null}
              {column.input === "enum" ? (
                <select
                  className={adminSelectClass}
                  value={editor.values[column.name] || ""}
                  onChange={(event) =>
                    setEditor({ ...editor, values: { ...editor.values, [column.name]: event.target.value } })
                  }
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
                  className={adminTextareaClass}
                  rows={6}
                  value={editor.values[column.name] || ""}
                  onChange={(event) =>
                    setEditor({ ...editor, values: { ...editor.values, [column.name]: event.target.value } })
                  }
                />
              ) : null}
              {column.input !== "boolean" && column.input !== "enum" && column.input !== "json" && column.input !== "binary" ? (
                <input
                  className={adminInputClass}
                  type={column.input === "number" ? "text" : column.input === "date" ? "date" : column.input === "datetime" ? "datetime-local" : "text"}
                  inputMode={column.input === "number" ? "decimal" : undefined}
                  value={editor.values[column.name] || ""}
                  onChange={(event) =>
                    setEditor({ ...editor, values: { ...editor.values, [column.name]: event.target.value } })
                  }
                />
              ) : null}
            </label>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="hero" disabled={saving || (editor.mode === "edit" && !editor.primaryKey)}>
              Save this row
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditor(null)}>
              Cancel
            </Button>
          </div>
          {editor.mode === "edit" && editor.primaryKey ? (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-body text-text-2">Removing a row cannot be taken back from this screen until you use History.</p>
              <label className="block">
                <span className={adminLabelClass}>Type DELETE to confirm</span>
                <input className={adminInputClass} value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} />
              </label>
              <Button type="button" variant="destructive" size="hero" disabled={saving || deleteConfirm !== "DELETE"} onClick={() => void remove()}>
                Remove this row
              </Button>
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
