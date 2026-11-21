import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { DbAdminError } from "./errors";

export interface DbTarget {
  id: string;
  label: string;
  host: string;
  port: number;
  database: string;
}

const pools = new Map<string, Pool>();

export async function closePools(): Promise<void> {
  const open = [...pools.values()];
  pools.clear();
  await Promise.all(open.map((pool) => pool.end()));
}

export function loadTargets(): DbTarget[] {
  const raw = (process.env.DBADMIN_TARGETS || "").trim();
  if (!raw) {
    return [
      {
        id: "uniz",
        label: "Main university database",
        host: process.env.DBADMIN_PG_HOST || "10.42.0.1",
        port: Number(process.env.DBADMIN_PG_PORT || 5432),
        database: process.env.DBADMIN_PG_DATABASE || "uniz_db",
      },
    ];
  }
  return raw.split(",").map((item) => {
    const [id, label, host, port, database] = item.split("|");
    if (!id || !label || !host || !port || !database) {
      throw new Error("DBADMIN_TARGETS entries must be id|label|host|port|database");
    }
    return { id, label, host, port: Number(port), database };
  });
}

export function targetById(id: string): DbTarget {
  const target = loadTargets().find((item) => item.id === id);
  if (!target) throw new DbAdminError(404, "That database is not in the editor.");
  return target;
}

function poolFor(target: DbTarget): Pool {
  const existing = pools.get(target.id);
  if (existing) return existing;
  const password = process.env.DBADMIN_DB_PASSWORD || "";
  const user = process.env.DBADMIN_DB_USER || "uniz_dbadmin";
  if (!password) {
    throw new DbAdminError(503, "The database editor password is not configured yet.");
  }
  const pool = new Pool({
    host: target.host,
    port: target.port,
    database: target.database,
    user,
    password,
    max: 5,
    ssl: false,
    connectionTimeoutMillis: 5000,
    statement_timeout: 20_000,
    application_name: "uniz-dbadmin",
  });
  pool.on("error", () => {
    /* the next query reports a plain-language failure */
  });
  pools.set(target.id, pool);
  return pool;
}

export async function withClient<T>(
  databaseId: string,
  mode: "read" | "write",
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await poolFor(targetById(databaseId)).connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query("SET LOCAL lock_timeout = '5s'");
    if (mode === "read") await client.query("SET TRANSACTION READ ONLY");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* connection already failed */
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function queryRows<T extends QueryResultRow>(
  client: PoolClient,
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  const result: QueryResult<T> = await client.query<T>(text, values);
  return result.rows;
}
