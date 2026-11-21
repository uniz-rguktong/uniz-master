import { BASE_URL } from "@/api/endpoints";

export class DbAdminError extends Error {
  status: number;
  confirmText?: string;

  constructor(message: string, status: number, confirmText?: string) {
    super(message);
    this.name = "DbAdminError";
    this.status = status;
    this.confirmText = confirmText;
  }
}

export type InputKind =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "json"
  | "enum"
  | "binary";

export interface ColumnInfo {
  name: string;
  dataType: string;
  udtName: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  enumValues: string[] | null;
  input: InputKind;
}

export interface HistoryEntry {
  id: string;
  at: string;
  actorUsername: string;
  schema: string;
  table: string;
  action: string;
  primaryKey: Record<string, unknown> | null;
  summary: string;
  sql?: string;
  undoable: boolean;
  undone: boolean;
}

async function dbFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
  const response = await fetch(`${BASE_URL}/dbadmin${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    confirmText?: string;
  } & T;
  if (!response.ok) {
    throw new DbAdminError(body.message || "Something went wrong.", response.status, body.confirmText);
  }
  return body;
}

export function listDatabases(): Promise<{ databases: { id: string; label: string }[] }> {
  return dbFetch("/databases");
}

export function listSchemas(databaseId: string): Promise<{ schemas: string[] }> {
  return dbFetch(`/databases/${databaseId}/schemas`);
}

export function listTables(databaseId: string, schema: string): Promise<{ tables: string[] }> {
  return dbFetch(`/databases/${databaseId}/tables?schema=${encodeURIComponent(schema)}`);
}

export function listRows(
  databaseId: string,
  query: {
    schema: string;
    table: string;
    limit: number;
    offset: number;
    search?: string;
    sort?: string;
    direction?: "asc" | "desc";
    filterColumn?: string;
    filterOp?: "eq" | "contains";
    filterValue?: string;
  },
): Promise<{ columns: ColumnInfo[]; rows: Record<string, unknown>[]; total: number }> {
  const params = new URLSearchParams({
    schema: query.schema,
    table: query.table,
    limit: String(query.limit),
    offset: String(query.offset),
  });
  if (query.search) params.set("search", query.search);
  if (query.sort) params.set("sort", query.sort);
  if (query.direction) params.set("direction", query.direction);
  if (query.filterColumn && query.filterValue) {
    params.set("filterColumn", query.filterColumn);
    params.set("filterOp", query.filterOp || "contains");
    params.set("filterValue", query.filterValue);
  }
  return dbFetch(`/databases/${databaseId}/rows?${params.toString()}`);
}

export function insertRow(
  databaseId: string,
  body: { schema: string; table: string; values: Record<string, unknown> },
): Promise<{ message: string }> {
  return dbFetch(`/databases/${databaseId}/rows`, { method: "POST", body: JSON.stringify(body) });
}

export function updateRow(
  databaseId: string,
  body: {
    schema: string;
    table: string;
    primaryKey: Record<string, unknown>;
    values: Record<string, unknown>;
  },
): Promise<{ message: string }> {
  return dbFetch(`/databases/${databaseId}/rows`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteRow(
  databaseId: string,
  body: {
    schema: string;
    table: string;
    primaryKey: Record<string, unknown>;
    confirm: string;
  },
): Promise<{ message: string }> {
  return dbFetch(`/databases/${databaseId}/rows`, { method: "DELETE", body: JSON.stringify(body) });
}

export function runSql(
  databaseId: string,
  body: { sql: string; confirm?: string },
): Promise<{ kind: "read" | "write"; columns: string[]; rows: Record<string, unknown>[]; rowCount: number; message: string }> {
  return dbFetch(`/databases/${databaseId}/sql`, { method: "POST", body: JSON.stringify(body) });
}

export function listHistory(
  databaseId: string,
  offset: number,
): Promise<{ entries: HistoryEntry[]; total: number }> {
  return dbFetch(`/databases/${databaseId}/history?limit=30&offset=${offset}`);
}

export function undoChange(databaseId: string, changeId: string): Promise<{ message: string }> {
  return dbFetch(`/databases/${databaseId}/history/${changeId}/undo`, { method: "POST", body: "{}" });
}
