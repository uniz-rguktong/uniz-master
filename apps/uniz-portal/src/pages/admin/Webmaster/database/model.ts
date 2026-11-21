import type { ColumnInfo, FilterOp } from "./databaseApi";

export interface DraftRow {
  key: string;
  values: Record<string, unknown>;
}

export interface DisplayRow {
  key: string;
  kind: "draft" | "row";
  primaryKey: Record<string, unknown> | null;
  values: Record<string, unknown>;
  base: Record<string, unknown>;
}

export interface GridFilter {
  id: string;
  column: string;
  op: FilterOp;
  value: string;
}

const OP_LABEL: Record<FilterOp, string> = {
  eq: "equals",
  contains: "contains",
  isnull: "is null",
  gt: "greater than",
  lt: "less than",
};

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatEstimate(value: number): string {
  if (value >= 1_000_000) {
    const scaled = value / 1_000_000;
    return `${scaled >= 10 ? Math.round(scaled) : scaled.toFixed(1)}m`;
  }
  if (value >= 10_000) return `${Math.round(value / 1_000)}k`;
  return value.toLocaleString("en-US");
}

export function typeLabel(column: ColumnInfo): string {
  if (column.dataType === "USER-DEFINED") return column.udtName;
  if (column.dataType === "timestamp with time zone") return "timestamptz";
  if (column.dataType === "timestamp without time zone") return "timestamp";
  if (column.dataType === "character varying") return "varchar";
  if (column.dataType === "double precision") return "float8";
  return column.dataType;
}

export function filterLabel(filter: Pick<GridFilter, "column" | "op" | "value">): string {
  if (filter.op === "isnull") return `${filter.column} is null`;
  return `${filter.column} ${OP_LABEL[filter.op]} ${filter.value}`;
}

export function formatCell(value: unknown): { text: string; muted: boolean } {
  if (value === null || value === undefined) return { text: "NULL", muted: true };
  if (typeof value === "boolean") return { text: value ? "true" : "false", muted: false };
  if (typeof value === "object") return { text: JSON.stringify(value), muted: false };
  return { text: String(value), muted: false };
}

export function valuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left == null || right == null) return false;
  if (typeof left === "number" || typeof right === "number" || typeof left === "boolean" || typeof right === "boolean") {
    return String(left) === String(right);
  }
  if (typeof left === "object" || typeof right === "object") {
    try {
      const parsedLeft = typeof left === "string" ? JSON.parse(left) : left;
      const parsedRight = typeof right === "string" ? JSON.parse(right) : right;
      return JSON.stringify(parsedLeft) === JSON.stringify(parsedRight);
    } catch {
      return false;
    }
  }
  return String(left) === String(right);
}

export function primaryKeyOf(columns: ColumnInfo[], row: Record<string, unknown>): Record<string, unknown> | null {
  const keys = columns.filter((column) => column.isPrimaryKey);
  if (keys.length === 0) return null;
  const primaryKey: Record<string, unknown> = {};
  for (const column of keys) primaryKey[column.name] = row[column.name] ?? null;
  return primaryKey;
}

export function rowIdentity(primaryKey: Record<string, unknown>): string {
  return Object.keys(primaryKey)
    .sort()
    .map((key) => `${key}=${JSON.stringify(primaryKey[key] ?? null)}`)
    .join("|");
}

export function buildDisplayRows(
  columns: ColumnInfo[],
  rows: Record<string, unknown>[],
  drafts: DraftRow[],
  edits: Record<string, Record<string, unknown>>,
): DisplayRow[] {
  const draftRows: DisplayRow[] = drafts.map((draft) => ({
    key: draft.key,
    kind: "draft",
    primaryKey: null,
    base: {},
    values: { ...draft.values },
  }));
  const saved = rows.map((row, index) => {
    const primaryKey = primaryKeyOf(columns, row);
    const key = primaryKey ? rowIdentity(primaryKey) : `row:${index}`;
    const staged = edits[key] || {};
    return {
      key,
      kind: "row" as const,
      primaryKey,
      base: row,
      values: { ...row, ...staged },
    };
  });
  return [...draftRows, ...saved];
}

export function dirtyKeys(edits: Record<string, Record<string, unknown>>, drafts: DraftRow[]): Set<string> {
  const dirty = new Set<string>();
  for (const [rowKey, cols] of Object.entries(edits)) {
    for (const column of Object.keys(cols)) dirty.add(`${rowKey}\u0000${column}`);
  }
  for (const draft of drafts) {
    for (const [column, value] of Object.entries(draft.values)) {
      if (value === undefined || value === "") continue;
      dirty.add(`${draft.key}\u0000${column}`);
    }
  }
  return dirty;
}

export function editorDraft(column: ColumnInfo, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (column.input === "boolean") return value === true || value === "true" ? "true" : value === false || value === "false" ? "false" : "";
  if (column.input === "json") return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (column.input === "date" && typeof value === "string") return value.slice(0, 10);
  if (column.input === "datetime" && typeof value === "string") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function commitEditor(column: ColumnInfo, draft: string): unknown {
  if (column.input === "boolean") {
    if (draft === "true") return true;
    if (draft === "false") return false;
    return null;
  }
  if (column.input === "json") {
    if (draft.trim() === "") return null;
    const parsed = JSON.parse(draft);
    return JSON.stringify(parsed);
  }
  if (column.input === "datetime") {
    if (!draft) return null;
    const parsed = new Date(draft);
    if (Number.isNaN(parsed.getTime())) return draft;
    return parsed.toISOString();
  }
  if (draft === "") return column.input === "text" ? "" : null;
  return draft;
}

export function defaultColumnWidth(column: ColumnInfo): number {
  if (column.input === "boolean") return 112;
  if (column.input === "date") return 148;
  if (column.input === "datetime") return 196;
  if (column.input === "json") return 240;
  if (column.dataType === "uuid" || column.isPrimaryKey) return 220;
  return 168;
}
