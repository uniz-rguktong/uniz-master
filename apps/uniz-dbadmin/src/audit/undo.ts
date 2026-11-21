import { DbAdminError } from "../errors";
import { quoteIdent } from "./idents";

export type RowAction = "insert" | "update" | "delete";

export interface UndoSource {
  action: RowAction;
  schema: string;
  table: string;
  primaryKey: Record<string, unknown> | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface SqlStatement {
  text: string;
  values: unknown[];
}

export function safeCast(cast: string | undefined): string | undefined {
  if (!cast) return undefined;
  if (/^[a-z][a-z0-9_]*$/.test(cast)) return cast;
  if (/^"[A-Za-z_][A-Za-z0-9_]*"\."[A-Za-z_][A-Za-z0-9_]*"$/.test(cast)) return cast;
  throw new DbAdminError(400, "That column type cannot be edited here.");
}

function placeholder(index: number, value: unknown, cast?: string): { sql: string; value: unknown } {
  const checked = safeCast(cast);
  if (checked) {
    const stored =
      value !== null && typeof value === "object" && !(value instanceof Date)
        ? JSON.stringify(value)
        : value instanceof Date
          ? value.toISOString()
          : value;
    return { sql: `$${index}::${checked}`, value: stored };
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return { sql: `$${index}::jsonb`, value: JSON.stringify(value) };
  }
  if (value instanceof Date) {
    return { sql: `$${index}`, value: value.toISOString() };
  }
  return { sql: `$${index}`, value };
}

export function wherePrimaryKey(primaryKey: Record<string, unknown>, startAt = 1): SqlStatement {
  const parts: string[] = [];
  const values: unknown[] = [];
  let index = startAt;
  for (const [key, value] of Object.entries(primaryKey)) {
    const ident = quoteIdent(key);
    if (value === null) {
      parts.push(`${ident} IS NULL`);
      continue;
    }
    const bound = placeholder(index, value);
    parts.push(`${ident} = ${bound.sql}`);
    values.push(bound.value);
    index++;
  }
  if (parts.length === 0) {
    throw new DbAdminError(400, "This row has no key, so it cannot be changed safely.");
  }
  return { text: parts.join(" AND "), values };
}

function qualified(schema: string, table: string): string {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

export function buildUndoStatement(source: UndoSource, casts: Record<string, string> = {}): SqlStatement {
  if (!source.primaryKey || Object.keys(source.primaryKey).length === 0) {
    throw new DbAdminError(400, "This change has no key, so it cannot be undone.");
  }
  const target = qualified(source.schema, source.table);

  if (source.action === "insert") {
    const where = wherePrimaryKey(source.primaryKey);
    return { text: `DELETE FROM ${target} WHERE ${where.text}`, values: where.values };
  }

  if (source.action === "delete") {
    if (!source.before) {
      throw new DbAdminError(400, "The original row was not saved, so it cannot be restored.");
    }
    return insertRecord(target, source.before, casts);
  }

  if (source.action === "update") {
    if (!source.before) {
      throw new DbAdminError(400, "The previous values were not saved, so this cannot be undone.");
    }
    return updateRecord(target, source.before, source.primaryKey, casts);
  }

  throw new DbAdminError(400, "Only added, changed, and removed rows can be undone.");
}

function insertRecord(
  target: string,
  record: Record<string, unknown>,
  casts: Record<string, string>,
): SqlStatement {
  const keys = Object.keys(record);
  if (keys.length === 0) {
    throw new DbAdminError(400, "The original row was empty, so it cannot be restored.");
  }
  const values: unknown[] = [];
  const cols: string[] = [];
  const params: string[] = [];
  keys.forEach((key) => {
    const bound = placeholder(values.length + 1, record[key], casts[key]);
    cols.push(quoteIdent(key));
    params.push(bound.sql);
    values.push(bound.value);
  });
  return {
    text: `INSERT INTO ${target} (${cols.join(", ")}) VALUES (${params.join(", ")})`,
    values,
  };
}

function updateRecord(
  target: string,
  record: Record<string, unknown>,
  primaryKey: Record<string, unknown>,
  casts: Record<string, string>,
): SqlStatement {
  const values: unknown[] = [];
  const sets: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    const bound = placeholder(values.length + 1, value, casts[key]);
    sets.push(`${quoteIdent(key)} = ${bound.sql}`);
    values.push(bound.value);
  }
  if (sets.length === 0) {
    throw new DbAdminError(400, "The previous values were empty, so this cannot be undone.");
  }
  const where = wherePrimaryKey(primaryKey, values.length + 1);
  return {
    text: `UPDATE ${target} SET ${sets.join(", ")} WHERE ${where.text}`,
    values: [...values, ...where.values],
  };
}

export function isChangeUndone(
  changeId: string,
  later: { reversesId: string | null }[],
): boolean {
  return later.some((row) => row.reversesId === changeId);
}

const AUDIT_JSON_LIMIT = 500_000;

export function fitAuditJson(value: unknown): { json: unknown; truncated: boolean } {
  if (value === null || value === undefined) return { json: null, truncated: false };
  const encoded = JSON.stringify(value);
  if (encoded.length <= AUDIT_JSON_LIMIT) return { json: value, truncated: false };
  return { json: { _truncated: true }, truncated: true };
}
