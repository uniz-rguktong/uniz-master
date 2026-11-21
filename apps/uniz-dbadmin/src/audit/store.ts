import crypto from "crypto";
import type { PoolClient } from "pg";
import type { Actor } from "../auth";
import { fitAuditJson } from "./undo";

export interface ChangeDraft {
  actor: Actor;
  database: string;
  schema: string;
  table: string;
  primaryKey: Record<string, unknown> | null;
  action: "insert" | "update" | "delete" | "undo" | "sql";
  before: unknown;
  after: unknown;
  sql: string;
  reversesId?: string | null;
  undoable?: boolean;
}

function jsonParam(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

export async function insertChange(client: PoolClient, draft: ChangeDraft): Promise<string> {
  const before = fitAuditJson(draft.before);
  const after = fitAuditJson(draft.after);
  const undoable = (draft.undoable !== false) && !before.truncated && !after.truncated;
  const id = crypto.randomUUID();
  await client.query(
    `INSERT INTO uniz_dbadmin.changes (
       id, actor_id, actor_username, database_name, schema_name, table_name,
       primary_key, action, before_json, after_json, sql_text, reverses_id, undoable
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7::jsonb, $8, $9::jsonb, $10::jsonb, $11, $12, $13
     )`,
    [
      id,
      draft.actor.id,
      draft.actor.username,
      draft.database,
      draft.schema,
      draft.table,
      jsonParam(draft.primaryKey),
      draft.action,
      jsonParam(before.json),
      jsonParam(after.json),
      draft.sql.slice(0, 20_000),
      draft.reversesId ?? null,
      undoable && draft.action !== "sql" && draft.action !== "undo",
    ],
  );
  return id;
}

export async function insertRequest(
  client: PoolClient,
  entry: {
    actor?: Actor;
    method: string;
    path: string;
    status: number;
    ip: string;
    kind: "read" | "write";
  },
): Promise<void> {
  await client.query(
    `INSERT INTO uniz_dbadmin.requests (
       id, actor_id, actor_username, method, path, status_code, ip, kind
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      crypto.randomUUID(),
      entry.actor?.id ?? null,
      entry.actor?.username ?? null,
      entry.method.slice(0, 16),
      entry.path.slice(0, 300),
      entry.status,
      entry.ip.slice(0, 80),
      entry.kind,
    ],
  );
}
