import type { PoolClient } from "pg";
import { columnInputKind, type InputKind } from "./audit/values";
import { quoteIdent } from "./audit/idents";
import { queryRows } from "./db";
import { DbAdminError } from "./errors";

export interface ColumnInfo {
  name: string;
  dataType: string;
  udtName: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  enumValues: string[] | null;
  input: InputKind;
  sqlCast?: string;
}

interface ColumnRow {
  column_name: string;
  data_type: string;
  udt_schema: string;
  udt_name: string;
  is_nullable: string;
  is_pk: boolean;
}

export async function listSchemas(client: PoolClient): Promise<string[]> {
  const rows = await queryRows<{ nspname: string }>(
    client,
    `SELECT nspname
     FROM pg_namespace
     WHERE nspname NOT IN ('pg_catalog', 'information_schema')
       AND nspname NOT LIKE 'pg_%'
     ORDER BY nspname`,
  );
  return rows.map((row) => row.nspname);
}

export interface TableSummary {
  name: string;
  estimatedRows: number | null;
}

export const TABLE_LIST_SQL = `SELECT t.table_name,
            CASE
              WHEN c.reltuples IS NULL OR c.reltuples < 0 THEN NULL
              ELSE c.reltuples::bigint
            END AS estimated_rows
     FROM information_schema.tables t
     LEFT JOIN pg_namespace n ON n.nspname = t.table_schema
     LEFT JOIN pg_class c
       ON c.relnamespace = n.oid
      AND c.relname = t.table_name
      AND c.relkind IN ('r', 'p')
     WHERE t.table_schema = $1 AND t.table_type = 'BASE TABLE'
     ORDER BY t.table_name`;

export async function listTables(client: PoolClient, schema: string): Promise<TableSummary[]> {
  quoteIdent(schema);
  const rows = await queryRows<{ table_name: string; estimated_rows: string | number | null }>(
    client,
    TABLE_LIST_SQL,
    [schema],
  );
  return rows.map((row) => {
    if (row.estimated_rows === null || row.estimated_rows === undefined) {
      return { name: row.table_name, estimatedRows: null };
    }
    const count = Number(row.estimated_rows);
    return {
      name: row.table_name,
      estimatedRows: Number.isFinite(count) ? count : null,
    };
  });
}

async function enumLabels(client: PoolClient, schema: string, typeName: string): Promise<string[]> {
  const rows = await queryRows<{ enumlabel: string }>(
    client,
    `SELECT e.enumlabel
     FROM pg_type t
     JOIN pg_enum e ON e.enumtypid = t.oid
     JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = $1 AND t.typname = $2
     ORDER BY e.enumsortorder`,
    [schema, typeName],
  );
  return rows.map((row) => row.enumlabel);
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function columnSqlCast(row: Pick<ColumnRow, "data_type" | "udt_schema" | "udt_name">, input: InputKind): string | undefined {
  if (input === "json") return "jsonb";
  if (input === "datetime") return "timestamptz";
  if (input === "date") return "date";
  if (input === "number") return "numeric";
  if (input === "boolean") return "boolean";
  if (row.data_type === "uuid") return "uuid";
  if (input === "enum" && IDENT.test(row.udt_schema) && IDENT.test(row.udt_name)) {
    return `"${row.udt_schema}"."${row.udt_name}"`;
  }
  return undefined;
}

export async function listColumns(client: PoolClient, schema: string, table: string): Promise<ColumnInfo[]> {
  quoteIdent(schema);
  quoteIdent(table);
  const rows = await queryRows<ColumnRow>(
    client,
    `SELECT c.column_name, c.data_type, c.udt_schema, c.udt_name, c.is_nullable,
            EXISTS (
              SELECT 1
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
               AND tc.table_schema = kcu.table_schema
              WHERE tc.constraint_type = 'PRIMARY KEY'
                AND kcu.table_schema = c.table_schema
                AND kcu.table_name = c.table_name
                AND kcu.column_name = c.column_name
            ) AS is_pk
     FROM information_schema.columns c
     WHERE c.table_schema = $1 AND c.table_name = $2
     ORDER BY c.ordinal_position`,
    [schema, table],
  );
  if (rows.length === 0) {
    throw new DbAdminError(404, "That table was not found.");
  }
  const columns: ColumnInfo[] = [];
  for (const row of rows) {
    const labels =
      row.data_type === "USER-DEFINED" ? await enumLabels(client, row.udt_schema, row.udt_name) : [];
    const enumValues = labels.length ? labels : null;
    const input = columnInputKind(row.data_type, row.udt_name, enumValues);
    columns.push({
      name: row.column_name,
      dataType: row.data_type,
      udtName: row.udt_name,
      nullable: row.is_nullable === "YES",
      isPrimaryKey: row.is_pk,
      enumValues,
      input,
      sqlCast: columnSqlCast(row, input),
    });
  }
  return columns;
}

export function primaryKeyFrom(columns: ColumnInfo[], row: Record<string, unknown>): Record<string, unknown> | null {
  const keys = columns.filter((column) => column.isPrimaryKey);
  if (keys.length === 0) return null;
  const primaryKey: Record<string, unknown> = {};
  for (const column of keys) primaryKey[column.name] = row[column.name] ?? null;
  return primaryKey;
}

export function serializeCell(value: unknown): unknown {
  if (Buffer.isBuffer(value)) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) out[key] = serializeCell(value);
  return out;
}
