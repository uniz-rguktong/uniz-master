import { Router, type Request } from "express";
import type { PoolClient } from "pg";
import { confirmationSatisfied, classifySql } from "./audit/sql";
import { isAuditTable, coerceColumnValue, describeChange } from "./audit/values";
import { buildUndoStatement } from "./audit/undo";
import { buildDelete, buildInsert, buildRowSelect, buildSelectForUpdate, buildUpdate, collectFilters } from "./audit/rowsql";
import { insertChange } from "./audit/store";
import type { Actor } from "./auth";
import { listColumns, listSchemas, listTables, primaryKeyFrom, serializeRow, type ColumnInfo } from "./catalog";
import { loadTargets, queryRows, withClient } from "./db";
import { DbAdminError } from "./errors";

const router = Router();

function actorOf(req: Request): Actor {
  if (!req.actor) throw new DbAdminError(401, "Sign in again to open the database editor.");
  return req.actor;
}

function databaseId(value: unknown): string {
  const id = String(value || "");
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new DbAdminError(400, "That database is not in the editor.");
  return id;
}

function requireText(value: unknown, label: string): string {
  const text = String(value || "").trim();
  if (!text) throw new DbAdminError(400, `Choose a ${label}.`);
  return text;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DbAdminError(400, `The ${label} was not sent correctly.`);
  }
  return value as Record<string, unknown>;
}

function castsFor(columns: ColumnInfo[]): Record<string, string> {
  const casts: Record<string, string> = {};
  for (const column of columns) {
    if (column.sqlCast) casts[column.name] = column.sqlCast;
  }
  return casts;
}

function coerceValues(columns: ColumnInfo[], input: Record<string, unknown>, mode: "insert" | "update"): Record<string, unknown> {
  const known = new Map(columns.map((column) => [column.name, column]));
  const values: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(input)) {
    const column = known.get(key);
    if (!column) throw new DbAdminError(400, "That column was not found.");
    if (column.input === "binary") {
      if (raw === undefined || raw === null || raw === "") continue;
      throw new DbAdminError(400, "File fields cannot be edited here.");
    }
    if (mode === "insert" && (raw === undefined || raw === "")) continue;
    values[key] = coerceColumnValue(column.input, raw, column.enumValues);
  }
  return values;
}

async function lockRow(
  client: PoolClient,
  schema: string,
  table: string,
  primaryKey: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const statement = buildSelectForUpdate(schema, table, primaryKey);
  const rows = await queryRows<Record<string, unknown>>(client, statement.text, statement.values);
  if (rows.length === 0) throw new DbAdminError(404, "That row is no longer there.");
  return serializeRow(rows[0]);
}

router.get("/databases", (_req, res) => {
  res.json({
    success: true,
    databases: loadTargets().map((target) => ({ id: target.id, label: target.label })),
  });
});

router.get("/databases/:database/schemas", async (req, res, next) => {
  try {
    const id = databaseId(req.params.database);
    const schemas = await withClient(id, "read", (client) => listSchemas(client));
    res.json({ success: true, schemas });
  } catch (error) {
    next(error);
  }
});

router.get("/databases/:database/tables", async (req, res, next) => {
  try {
    const id = databaseId(req.params.database);
    const schema = requireText(req.query.schema, "group of tables");
    const tables = await withClient(id, "read", (client) => listTables(client, schema));
    res.json({ success: true, tables });
  } catch (error) {
    next(error);
  }
});

router.get("/databases/:database/rows", async (req, res, next) => {
  try {
    const id = databaseId(req.params.database);
    const schema = requireText(req.query.schema, "group of tables");
    const table = requireText(req.query.table, "table");
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const sortColumn = String(req.query.sort || "");
    const direction = String(req.query.direction || "asc").toLowerCase() === "desc" ? "desc" : "asc";
    const filters = collectFilters({
      filters: req.query.filters,
      filterColumn: req.query.filterColumn,
      filterOp: req.query.filterOp,
      filterValue: req.query.filterValue,
    });
    const payload = await withClient(id, "read", async (client) => {
      const columns = await listColumns(client, schema, table);
      const built = buildRowSelect({
        schema,
        table,
        columns: columns.map((column) => ({ name: column.name, dataType: column.dataType })),
        search: String(req.query.search || ""),
        filters,
        sort: sortColumn ? { column: sortColumn, direction } : undefined,
        limit,
        offset,
      });
      const rows = await queryRows<Record<string, unknown>>(client, built.rows.text, built.rows.values);
      const count = await queryRows<{ total: number }>(client, built.count.text, built.count.values);
      return {
        columns,
        rows: rows.map((row) => serializeRow(row)),
        total: count[0]?.total ?? 0,
        limit,
        offset,
      };
    });
    res.json({ success: true, ...payload });
  } catch (error) {
    next(error);
  }
});

router.post("/databases/:database/rows", async (req, res, next) => {
  try {
    const id = databaseId(req.params.database);
    const schema = requireText(req.body?.schema, "group of tables");
    const table = requireText(req.body?.table, "table");
    if (isAuditTable(schema, table)) {
      throw new DbAdminError(400, "The history tables cannot be edited. They only grow.");
    }
    const input = asRecord(req.body?.values, "row");
    const saved = await withClient(id, "write", async (client) => {
      const columns = await listColumns(client, schema, table);
      const values = coerceValues(columns, input, "insert");
      const statement = buildInsert(schema, table, values, castsFor(columns));
      const rows = await queryRows<Record<string, unknown>>(client, statement.text, statement.values);
      const after = serializeRow(rows[0] || {});
      const primaryKey = primaryKeyFrom(columns, after);
      await insertChange(client, {
        actor: actorOf(req),
        database: id,
        schema,
        table,
        primaryKey,
        action: "insert",
        before: null,
        after,
        sql: statement.text,
        undoable: primaryKey !== null,
      });
      return after;
    });
    res.status(201).json({ success: true, row: saved, message: "The row was added." });
  } catch (error) {
    next(error);
  }
});

router.patch("/databases/:database/rows", async (req, res, next) => {
  try {
    const id = databaseId(req.params.database);
    const schema = requireText(req.body?.schema, "group of tables");
    const table = requireText(req.body?.table, "table");
    if (isAuditTable(schema, table)) {
      throw new DbAdminError(400, "The history tables cannot be edited. They only grow.");
    }
    const primaryKey = asRecord(req.body?.primaryKey, "row key");
    const input = asRecord(req.body?.values, "row");
    const saved = await withClient(id, "write", async (client) => {
      const columns = await listColumns(client, schema, table);
      const before = await lockRow(client, schema, table, primaryKey);
      const values = coerceValues(columns, input, "update");
      const statement = buildUpdate(schema, table, values, primaryKey, castsFor(columns));
      const rows = await queryRows<Record<string, unknown>>(client, statement.text, statement.values);
      const after = serializeRow(rows[0] || {});
      await insertChange(client, {
        actor: actorOf(req),
        database: id,
        schema,
        table,
        primaryKey,
        action: "update",
        before,
        after,
        sql: statement.text,
        undoable: true,
      });
      return after;
    });
    res.json({ success: true, row: saved, message: "The row was saved." });
  } catch (error) {
    next(error);
  }
});

router.delete("/databases/:database/rows", async (req, res, next) => {
  try {
    const id = databaseId(req.params.database);
    const schema = requireText(req.body?.schema, "group of tables");
    const table = requireText(req.body?.table, "table");
    if (isAuditTable(schema, table)) {
      throw new DbAdminError(400, "The history tables cannot be edited. They only grow.");
    }
    if (!confirmationSatisfied("DELETE", req.body?.confirm)) {
      throw new DbAdminError(428, "Type DELETE to confirm removing this row.", "DELETE");
    }
    const primaryKey = asRecord(req.body?.primaryKey, "row key");
    await withClient(id, "write", async (client) => {
      const columns = await listColumns(client, schema, table);
      const before = await lockRow(client, schema, table, primaryKey);
      const statement = buildDelete(schema, table, primaryKey);
      await client.query(statement.text, statement.values);
      await insertChange(client, {
        actor: actorOf(req),
        database: id,
        schema,
        table,
        primaryKey,
        action: "delete",
        before,
        after: null,
        sql: statement.text,
        undoable: primaryKeyFrom(columns, before) !== null,
      });
    });
    res.json({ success: true, message: "The row was removed." });
  } catch (error) {
    next(error);
  }
});

router.post("/databases/:database/sql", async (req, res, next) => {
  try {
    const id = databaseId(req.params.database);
    const sql = String(req.body?.sql || "");
    if (sql.length > 100_000) throw new DbAdminError(400, "That command is too long.");
    const classified = classifySql(sql);
    if (classified.kind === "empty") throw new DbAdminError(400, "Enter a command first.");
    if (classified.kind === "write" && !confirmationSatisfied(classified.confirmText, req.body?.confirm)) {
      throw new DbAdminError(
        428,
        `This will change data. Type ${classified.confirmText} to continue.`,
        classified.confirmText || undefined,
      );
    }
    const mode = classified.kind === "write" ? "write" : "read";
    const outcome = await withClient(id, mode, async (client) => {
      let last: { columns: string[]; rows: Record<string, unknown>[]; rowCount: number } = {
        columns: [],
        rows: [],
        rowCount: 0,
      };
      for (const statement of classified.statements) {
        const result = await client.query(statement);
        const fields = result.fields?.map((field) => field.name) ?? [];
        if (fields.length > 0) {
          last = {
            columns: fields,
            rows: result.rows.map((row) => serializeRow(row as Record<string, unknown>)).slice(0, 200),
            rowCount: result.rowCount ?? result.rows.length,
          };
        } else {
          last = { columns: [], rows: [], rowCount: result.rowCount ?? 0 };
        }
      }
      if (classified.kind === "write") {
        await insertChange(client, {
          actor: actorOf(req),
          database: id,
          schema: "uniz_dbadmin",
          table: "(command)",
          primaryKey: null,
          action: "sql",
          before: null,
          after: null,
          sql,
          undoable: false,
        });
      }
      return last;
    });
    res.json({
      success: true,
      kind: classified.kind,
      columns: outcome.columns,
      rows: outcome.rows,
      rowCount: outcome.rowCount,
      message: classified.kind === "write" ? "The command finished. It is recorded in History." : "The command finished.",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/databases/:database/history", async (req, res, next) => {
  try {
    const id = databaseId(req.params.database);
    const limit = req.query.limit ? Number(req.query.limit) : 30;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new DbAdminError(400, "Ask for between 1 and 100 history rows.");
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new DbAdminError(400, "That history page is not valid.");
    }
    const payload = await withClient(id, "read", async (client) => {
      const rows = await queryRows<{
        id: string;
        at: Date;
        actor_username: string;
        schema_name: string;
        table_name: string;
        action: string;
        primary_key: Record<string, unknown> | null;
        before_json: unknown;
        after_json: unknown;
        sql_text: string;
        undoable: boolean;
        undone: boolean;
      }>(
        client,
        `SELECT c.id, c.at, c.actor_username, c.schema_name, c.table_name, c.action,
                c.primary_key, c.before_json, c.after_json, c.sql_text, c.undoable,
                EXISTS (SELECT 1 FROM uniz_dbadmin.changes u WHERE u.reverses_id = c.id) AS undone
         FROM uniz_dbadmin.changes c
         WHERE c.database_name = $1
         ORDER BY c.at DESC
         LIMIT $2 OFFSET $3`,
        [id, limit, offset],
      );
      const count = await queryRows<{ total: number }>(
        client,
        `SELECT count(*)::int AS total FROM uniz_dbadmin.changes WHERE database_name = $1`,
        [id],
      );
      return {
        total: count[0]?.total ?? 0,
        entries: rows.map((row) => ({
          id: row.id,
          at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
          actorUsername: row.actor_username,
          schema: row.schema_name,
          table: row.table_name,
          action: row.action,
          primaryKey: row.primary_key,
          before: row.before_json,
          after: row.after_json,
          sql: row.action === "sql" ? row.sql_text : undefined,
          undoable: row.undoable && !row.undone && row.action !== "sql" && row.action !== "undo",
          undone: row.undone,
          summary: describeChange(row.action, row.table_name === "(command)" ? "the database" : row.table_name),
        })),
      };
    });
    res.json({ success: true, ...payload });
  } catch (error) {
    next(error);
  }
});

router.post("/databases/:database/history/:changeId/undo", async (req, res, next) => {
  try {
    const id = databaseId(req.params.database);
    const changeId = String(req.params.changeId || "");
    if (!/^[0-9a-f-]{36}$/i.test(changeId)) throw new DbAdminError(400, "That history entry was not found.");
    await withClient(id, "write", async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(42, hashtext($1))", [changeId]);
      const rows = await queryRows<{
        id: string;
        schema_name: string;
        table_name: string;
        action: "insert" | "update" | "delete" | "undo" | "sql";
        primary_key: Record<string, unknown> | null;
        before_json: Record<string, unknown> | null;
        after_json: Record<string, unknown> | null;
        undoable: boolean;
      }>(
        client,
        `SELECT id, schema_name, table_name, action, primary_key, before_json, after_json, undoable
         FROM uniz_dbadmin.changes WHERE id = $1 AND database_name = $2`,
        [changeId, id],
      );
      const change = rows[0];
      if (!change) throw new DbAdminError(404, "That history entry was not found.");
      if (change.action === "sql" || change.action === "undo" || !change.undoable) {
        throw new DbAdminError(400, "This history entry cannot be undone with one click.");
      }
      const undone = await queryRows<{ id: string }>(
        client,
        `SELECT id FROM uniz_dbadmin.changes WHERE reverses_id = $1 LIMIT 1`,
        [changeId],
      );
      if (undone.length > 0) throw new DbAdminError(409, "This change was already undone.");
      const columns = await listColumns(client, change.schema_name, change.table_name);
      const statement = buildUndoStatement(
        {
          action: change.action,
          schema: change.schema_name,
          table: change.table_name,
          primaryKey: change.primary_key,
          before: change.before_json,
          after: change.after_json,
        },
        castsFor(columns),
      );
      const result = await client.query(statement.text, statement.values);
      if ((result.rowCount ?? 0) === 0 && change.action !== "delete") {
        throw new DbAdminError(409, "The row is no longer in the state this change expected.");
      }
      await insertChange(client, {
        actor: actorOf(req),
        database: id,
        schema: change.schema_name,
        table: change.table_name,
        primaryKey: change.primary_key,
        action: "undo",
        before: change.after_json,
        after: change.before_json,
        sql: statement.text,
        reversesId: change.id,
        undoable: false,
      });
    });
    res.json({ success: true, message: "The change was undone." });
  } catch (error) {
    next(error);
  }
});

export default router;
