import { DbAdminError } from "../errors";
import { quoteIdent, quoteQualified } from "./idents";
import { safeCast, wherePrimaryKey, type SqlStatement } from "./undo";

export interface ColumnRef {
  name: string;
  dataType: string;
}

export type FilterOp = "eq" | "contains" | "isnull" | "gt" | "lt";

export interface ColumnFilter {
  column: string;
  op: FilterOp;
  value?: string;
}

export interface RowQuery {
  schema: string;
  table: string;
  columns: ColumnRef[];
  search?: string;
  filters?: ColumnFilter[];
  sort?: { column: string; direction: "asc" | "desc" };
  limit: number;
  offset: number;
}

const FILTER_OPS = new Set<FilterOp>(["eq", "contains", "isnull", "gt", "lt"]);
const MAX_FILTERS = 8;
const MAX_FILTER_VALUE = 500;

function isFilterOp(value: string): value is FilterOp {
  return FILTER_OPS.has(value as FilterOp);
}

function pushFilter(out: ColumnFilter[], columnRaw: unknown, opRaw: unknown, valueRaw: unknown): void {
  const column = String(columnRaw || "").trim();
  if (!column) throw new DbAdminError(400, "Choose a column to filter.");
  const opText = String(opRaw || "contains");
  if (!isFilterOp(opText)) throw new DbAdminError(400, "That filter is not supported.");
  const value = valueRaw == null ? "" : String(valueRaw);
  if (value.length > MAX_FILTER_VALUE) throw new DbAdminError(400, "That filter is too long.");
  if (opText !== "isnull" && !value.trim()) return;
  out.push({ column, op: opText, value: value.trim() });
}

export function collectFilters(input: {
  filters?: unknown;
  filterColumn?: unknown;
  filterOp?: unknown;
  filterValue?: unknown;
}): ColumnFilter[] {
  const out: ColumnFilter[] = [];
  const raw = input.filters;
  if (typeof raw === "string" && raw.length > 4000) {
    throw new DbAdminError(400, "Those filters were not sent correctly.");
  }
  if (raw !== undefined && raw !== null && raw !== "") {
    let parsed: unknown = raw;
    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new DbAdminError(400, "Those filters were not sent correctly.");
      }
    }
    if (!Array.isArray(parsed)) throw new DbAdminError(400, "Those filters were not sent correctly.");
    for (const item of parsed) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new DbAdminError(400, "Those filters were not sent correctly.");
      }
      const record = item as Record<string, unknown>;
      pushFilter(out, record.column, record.op, record.value);
    }
  }
  if (String(input.filterColumn || "").trim()) {
    pushFilter(out, input.filterColumn, input.filterOp || "contains", input.filterValue);
  }
  if (out.length > MAX_FILTERS) throw new DbAdminError(400, "Use at most 8 column filters.");
  return out;
}

function known(columns: ColumnRef[], name: string): ColumnRef {
  const column = columns.find((item) => item.name === name);
  if (!column) throw new DbAdminError(400, "That column was not found.");
  return column;
}

function searchable(column: ColumnRef): boolean {
  return column.dataType.toLowerCase() !== "bytea";
}

function compareCast(dataType: string): string | undefined {
  const type = dataType.toLowerCase();
  if (["smallint", "integer", "bigint", "decimal", "numeric", "real", "double precision", "money"].includes(type)) {
    return "numeric";
  }
  if (type === "date") return "date";
  if (type === "timestamp with time zone") return "timestamptz";
  if (type === "timestamp without time zone") return "timestamp";
  return undefined;
}

function predicate(column: ColumnRef, filter: ColumnFilter, values: unknown[]): string {
  if (!isFilterOp(filter.op)) throw new DbAdminError(400, "That filter is not supported.");
  if ((filter.value?.length ?? 0) > MAX_FILTER_VALUE) throw new DbAdminError(400, "That filter is too long.");
  const ident = quoteIdent(column.name);
  if (filter.op === "isnull") return `${ident} IS NULL`;
  const value = filter.value ?? "";
  if (filter.op === "contains") {
    values.push(`%${value}%`);
    return `${ident}::text ILIKE $${values.length}`;
  }
  if (filter.op === "eq") {
    values.push(value);
    return `${ident}::text = $${values.length}`;
  }
  const cast = safeCast(compareCast(column.dataType));
  values.push(value);
  const param = cast ? `$${values.length}::${cast}` : `$${values.length}`;
  const left = cast ? ident : `${ident}::text`;
  const operator = filter.op === "gt" ? ">" : "<";
  return `${left} ${operator} ${param}`;
}

function bind(index: number, value: unknown, cast?: string): { sql: string; value: unknown } {
  const checked = safeCast(cast);
  if (checked) {
    const stored = value !== null && typeof value === "object" ? JSON.stringify(value) : value;
    return { sql: `$${index}::${checked}`, value: stored };
  }
  if (value !== null && typeof value === "object") {
    return { sql: `$${index}::jsonb`, value: JSON.stringify(value) };
  }
  return { sql: `$${index}`, value };
}

export function buildRowWhere(query: Pick<RowQuery, "columns" | "search" | "filters">): SqlStatement {
  const parts: string[] = [];
  const values: unknown[] = [];

  const search = query.search?.trim();
  if (search) {
    const columns = query.columns.filter(searchable);
    if (columns.length > 0) {
      values.push(`%${search}%`);
      const param = `$${values.length}`;
      parts.push(`(${columns.map((column) => `${quoteIdent(column.name)}::text ILIKE ${param}`).join(" OR ")})`);
    }
  }

  const filters = query.filters ?? [];
  if (filters.length > MAX_FILTERS) throw new DbAdminError(400, "Use at most 8 column filters.");
  for (const filter of filters) {
    const column = known(query.columns, filter.column);
    parts.push(predicate(column, filter, values));
  }

  return { text: parts.length ? parts.join(" AND ") : "TRUE", values };
}

export function buildRowSelect(query: RowQuery): { rows: SqlStatement; count: SqlStatement } {
  if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100) {
    throw new DbAdminError(400, "Ask for between 1 and 100 rows.");
  }
  if (!Number.isInteger(query.offset) || query.offset < 0 || query.offset > 100_000) {
    throw new DbAdminError(400, "That page is too far into the table.");
  }
  const where = buildRowWhere(query);
  const target = quoteQualified(query.schema, query.table);
  let order = "";
  if (query.sort) {
    known(query.columns, query.sort.column);
    const direction = query.sort.direction === "desc" ? "DESC" : "ASC";
    order = ` ORDER BY ${quoteIdent(query.sort.column)} ${direction}`;
  }
  const limit = where.values.length + 1;
  const offset = where.values.length + 2;
  return {
    rows: {
      text: `SELECT * FROM ${target} WHERE ${where.text}${order} LIMIT $${limit} OFFSET $${offset}`,
      values: [...where.values, query.limit, query.offset],
    },
    count: {
      text: `SELECT count(*)::int AS total FROM ${target} WHERE ${where.text}`,
      values: where.values,
    },
  };
}

export function buildInsert(
  schema: string,
  table: string,
  values: Record<string, unknown>,
  casts: Record<string, string> = {},
): SqlStatement {
  const keys = Object.keys(values).filter((key) => values[key] !== undefined);
  if (keys.length === 0) {
    throw new DbAdminError(400, "Enter at least one field.");
  }
  const params: string[] = [];
  const bound: unknown[] = [];
  keys.forEach((key) => {
    const item = bind(bound.length + 1, values[key], casts[key]);
    params.push(item.sql);
    bound.push(item.value);
  });
  return {
    text: `INSERT INTO ${quoteQualified(schema, table)} (${keys.map(quoteIdent).join(", ")}) VALUES (${params.join(", ")}) RETURNING *`,
    values: bound,
  };
}

export function buildUpdate(
  schema: string,
  table: string,
  values: Record<string, unknown>,
  primaryKey: Record<string, unknown>,
  casts: Record<string, string> = {},
): SqlStatement {
  const keys = Object.keys(values).filter((key) => values[key] !== undefined);
  if (keys.length === 0) {
    throw new DbAdminError(400, "Change at least one field.");
  }
  const bound: unknown[] = [];
  const sets = keys.map((key) => {
    const item = bind(bound.length + 1, values[key], casts[key]);
    bound.push(item.value);
    return `${quoteIdent(key)} = ${item.sql}`;
  });
  const where = wherePrimaryKey(primaryKey, bound.length + 1);
  return {
    text: `UPDATE ${quoteQualified(schema, table)} SET ${sets.join(", ")} WHERE ${where.text} RETURNING *`,
    values: [...bound, ...where.values],
  };
}

export function buildDelete(
  schema: string,
  table: string,
  primaryKey: Record<string, unknown>,
): SqlStatement {
  const where = wherePrimaryKey(primaryKey);
  return {
    text: `DELETE FROM ${quoteQualified(schema, table)} WHERE ${where.text}`,
    values: where.values,
  };
}

export function buildSelectForUpdate(
  schema: string,
  table: string,
  primaryKey: Record<string, unknown>,
): SqlStatement {
  const where = wherePrimaryKey(primaryKey);
  return {
    text: `SELECT * FROM ${quoteQualified(schema, table)} WHERE ${where.text} FOR UPDATE`,
    values: where.values,
  };
}
