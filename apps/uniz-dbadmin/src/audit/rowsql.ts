import { DbAdminError } from "../errors";
import { quoteIdent, quoteQualified } from "./idents";
import { safeCast, wherePrimaryKey, type SqlStatement } from "./undo";

export interface ColumnRef {
  name: string;
  dataType: string;
}

export interface RowQuery {
  schema: string;
  table: string;
  columns: ColumnRef[];
  search?: string;
  filter?: { column: string; op: "eq" | "contains"; value: string };
  sort?: { column: string; direction: "asc" | "desc" };
  limit: number;
  offset: number;
}

function known(columns: ColumnRef[], name: string): ColumnRef {
  const column = columns.find((item) => item.name === name);
  if (!column) throw new DbAdminError(400, "That column was not found.");
  return column;
}

function searchable(column: ColumnRef): boolean {
  return column.dataType.toLowerCase() !== "bytea";
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

export function buildRowWhere(query: Pick<RowQuery, "columns" | "search" | "filter">): SqlStatement {
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

  if (query.filter && query.filter.value.trim()) {
    const column = known(query.columns, query.filter.column);
    if (query.filter.op === "contains") {
      values.push(`%${query.filter.value.trim()}%`);
      parts.push(`${quoteIdent(column.name)}::text ILIKE $${values.length}`);
    } else {
      values.push(query.filter.value);
      parts.push(`${quoteIdent(column.name)}::text = $${values.length}`);
    }
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
