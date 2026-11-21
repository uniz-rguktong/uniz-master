import { DbAdminError } from "../errors";

export type InputKind =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "json"
  | "enum"
  | "binary";

export function columnInputKind(
  dataType: string,
  udtName: string,
  enumValues: string[] | null,
): InputKind {
  if (enumValues && enumValues.length > 0) return "enum";
  const type = dataType.toLowerCase();
  const udt = udtName.toLowerCase();
  if (type === "boolean") return "boolean";
  if (
    ["smallint", "integer", "bigint", "decimal", "numeric", "real", "double precision", "money"].includes(
      type,
    )
  ) {
    return "number";
  }
  if (type === "date") return "date";
  if (type.includes("timestamp") || type.startsWith("time")) return "datetime";
  if (type === "json" || type === "jsonb" || udt === "json" || udt === "jsonb") return "json";
  if (type === "bytea") return "binary";
  return "text";
}

export function coerceColumnValue(
  kind: InputKind,
  value: unknown,
  enumValues?: string[] | null,
): unknown {
  if (value === undefined) return undefined;
  if (kind === "binary") {
    throw new DbAdminError(400, "File fields cannot be edited here.");
  }
  if (value === null) return null;
  if (value === "") return kind === "text" ? "" : null;

  if (kind === "boolean") {
    if (value === true || value === false) return value;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new DbAdminError(400, "Choose yes or no.");
  }

  if (kind === "number") {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new DbAdminError(400, "Enter a number.");
      return value;
    }
    const text = String(value).trim();
    if (!/^-?\d+(\.\d+)?$/.test(text)) throw new DbAdminError(400, "Enter a number.");
    if (!text.includes(".") && text.replace("-", "").length > 15) return text;
    return text.includes(".") ? text : Number(text);
  }

  if (kind === "json") {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        throw new DbAdminError(400, "That value is not valid JSON.");
      }
    }
    return value;
  }

  if (kind === "enum") {
    const text = String(value);
    if (enumValues && enumValues.length > 0 && !enumValues.includes(text)) {
      throw new DbAdminError(400, "Choose one of the listed values.");
    }
    return text;
  }

  if (kind === "date") {
    const text = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      throw new DbAdminError(400, "Enter a date as YYYY-MM-DD.");
    }
    return text;
  }

  if (kind === "datetime") {
    const text = String(value);
    if (Number.isNaN(Date.parse(text))) {
      throw new DbAdminError(400, "Enter a valid date and time.");
    }
    return text;
  }

  return String(value);
}

export function describeChange(action: string, table: string): string {
  if (action === "insert") return `Added a row in ${table}`;
  if (action === "update") return `Changed a row in ${table}`;
  if (action === "delete") return `Removed a row in ${table}`;
  if (action === "undo") return `Undid a change in ${table}`;
  if (action === "sql") return "Ran a database command";
  return `Updated ${table}`;
}

export function isAuditTable(schema: string, table: string): boolean {
  return schema === "uniz_dbadmin" && (table === "changes" || table === "requests");
}
