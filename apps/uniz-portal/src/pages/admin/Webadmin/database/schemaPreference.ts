import { listTables } from "./databaseApi";

export const PREFERRED_SCHEMA = "uniz_academics";

export function schemaStorageKey(databaseId: string): string {
  return `uniz.webadmin.database.schema.${databaseId}`;
}

export function readRememberedSchema(databaseId: string): string | null {
  try {
    const value = window.localStorage.getItem(schemaStorageKey(databaseId));
    const schema = value?.trim() || "";
    return schema || null;
  } catch {
    return null;
  }
}

export function rememberSchema(databaseId: string, schema: string): void {
  try {
    const key = schemaStorageKey(databaseId);
    if (!schema) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, schema);
  } catch {
    /* private mode and blocked storage should not break the page */
  }
}

// Pick a starting schema without waiting for table lists when a remembered,
// preferred, or already-selected name is still present.
export function immediateStartingSchema(
  schemas: string[],
  current: string,
  remembered: string | null,
): string | null {
  if (current && schemas.includes(current)) return current;
  if (remembered && schemas.includes(remembered)) return remembered;
  if (schemas.includes(PREFERRED_SCHEMA)) return PREFERRED_SCHEMA;
  return null;
}

export function fallbackStartingSchema(schemas: string[]): string {
  return schemas.find((name) => name !== "public") || schemas[0] || "";
}

// Prefer the last picked schema, then uniz_academics, then the first schema
// that actually has tables. Never fall back to an empty public schema while
// another schema has tables.
export async function resolveStartingSchema(
  databaseId: string,
  schemas: string[],
  current = "",
): Promise<string> {
  const immediate = immediateStartingSchema(schemas, current, readRememberedSchema(databaseId));
  if (immediate) return immediate;
  for (const name of schemas) {
    try {
      const result = await listTables(databaseId, name);
      if (result.tables.length > 0) return name;
    } catch {
      /* keep looking; a failed list should not force an empty public default */
    }
  }
  return fallbackStartingSchema(schemas);
}
