import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import http from "node:http";
import { after, before, describe, it } from "node:test";
import jwt from "jsonwebtoken";
import { Pool, type PoolClient } from "pg";
import { createApp } from "./app";
import { listTables, type TableSummary } from "./catalog";
import { closePools } from "./db";

const ADMIN_URL = process.env.DBADMIN_TEST_ADMIN_URL || "postgresql://postgres:postgres@127.0.0.1:5433/postgres";
const DB_NAME = "uniz_dbadmin_tables_test";
const ROLE = "uniz_tables_reader";
const PORT = 5433;

describe("table list for a non-owner", { timeout: 30_000 }, () => {
  const admin = new Pool({ connectionString: ADMIN_URL, connectionTimeoutMillis: 2000 });
  const roleSecret = randomBytes(16).toString("hex");
  let server: http.Server | undefined;
  let prepared = false;

  function readerUrl(database: string): string {
    return `postgresql://${ROLE}:${encodeURIComponent(roleSecret)}@127.0.0.1:${PORT}/${database}`;
  }

  async function withReader<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = new Pool({ connectionString: readerUrl(DB_NAME) });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET TRANSACTION READ ONLY");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* the connection already failed */
      }
      throw error;
    } finally {
      client.release();
      await pool.end();
    }
  }

  function byName(tables: TableSummary[]): Map<string, number | null> {
    return new Map(tables.map((table) => [table.name, table.estimatedRows]));
  }

  before(async (t) => {
    try {
      await admin.query("SELECT 1");
    } catch {
      t.skip("A local Postgres is not available on the test port.");
      return;
    }

    await admin.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${ROLE}') THEN
          CREATE ROLE ${ROLE} LOGIN PASSWORD '${roleSecret}'
            NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
        END IF;
      END $$;
    `);
    await admin.query(`ALTER ROLE ${ROLE} WITH LOGIN PASSWORD '${roleSecret}' NOSUPERUSER`);
    await admin.query(`DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${DB_NAME}`);

    const setup = new Pool({ connectionString: ADMIN_URL.replace(/\/postgres(\?|$)/, `/${DB_NAME}$1`) });
    try {
      await setup.query(`GRANT CONNECT ON DATABASE ${DB_NAME} TO ${ROLE}`);
      await setup.query(`GRANT USAGE ON SCHEMA public TO ${ROLE}`);
      await setup.query(`CREATE TABLE public.students (id int primary key, name text)`);
      await setup.query(`INSERT INTO public.students VALUES (1, 'A'), (2, 'B')`);
      await setup.query(`ANALYZE public.students`);
      await setup.query(`CREATE TABLE public.courses (id int primary key, title text)`);
      await setup.query(`CREATE TABLE public.empty_desk (id int primary key)`);
      await setup.query(`ANALYZE public.empty_desk`);
      await setup.query(`CREATE TABLE public.blown_stats (id int primary key)`);
      await setup.query(`CREATE TABLE public.huge_stats (id int primary key)`);
      await setup.query(`CREATE TABLE public.private_notes (id int primary key, body text)`);
      await setup.query(`
        UPDATE pg_class
        SET reltuples = 'NaN'
        WHERE relname = 'blown_stats' AND relnamespace = 'public'::regnamespace
      `);
      await setup.query(`
        UPDATE pg_class
        SET reltuples = '1e20'
        WHERE relname = 'huge_stats' AND relnamespace = 'public'::regnamespace
      `);
      await setup.query(`
        GRANT SELECT, INSERT, UPDATE, DELETE ON
          public.students, public.courses, public.empty_desk, public.blown_stats, public.huge_stats
        TO ${ROLE}
      `);
      const owner = await setup.query<{ owner: string }>(
        `SELECT r.rolname AS owner
         FROM pg_class c
         JOIN pg_roles r ON r.oid = c.relowner
         WHERE c.relname = 'students' AND c.relnamespace = 'public'::regnamespace`,
      );
      assert.notEqual(owner.rows[0]?.owner, ROLE);
    } finally {
      await setup.end();
    }

    process.env.JWT_SECURITY_KEY = "test-jwt-secret-not-a-production-key";
    process.env.DBADMIN_DB_USER = ROLE;
    process.env.DBADMIN_DB_PASSWORD = roleSecret;
    process.env.DBADMIN_TARGETS = `uniz|Main university database|127.0.0.1|${PORT}|${DB_NAME}`;
    prepared = true;
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await closePools();
    if (prepared) {
      await admin.query(`DROP DATABASE IF EXISTS ${DB_NAME} WITH (FORCE)`);
    }
    await admin.end();
  });

  it("lists unanalyzed and ungranted tables for a role that does not own them", async () => {
    const who = await withReader(async (client) => {
      const current = await client.query<{ current_user: string }>("SELECT current_user");
      const tables = await listTables(client, "public");
      return { currentUser: current.rows[0]?.current_user, tables };
    });
    assert.equal(who.currentUser, ROLE);
    const found = byName(who.tables);
    assert.equal(found.has("students"), true);
    assert.equal(typeof found.get("students"), "number");
    assert.ok((found.get("students") || 0) > 0);
    assert.equal(found.get("courses"), null);
    assert.equal(found.get("empty_desk"), 0);
    assert.equal(found.has("blown_stats"), true);
    assert.equal(found.get("blown_stats"), null);
    assert.equal(found.has("huge_stats"), true);
    assert.equal(found.get("huge_stats"), null);
    assert.equal(found.has("private_notes"), true);
    assert.equal(found.get("private_notes"), null);
  });

  it("returns the table contract from the tables route", async () => {
    const app = createApp();
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server?.once("listening", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("The test server has no port.");
    const token = jwt.sign(
      { id: "webadmin", username: "webadmin", role: "webadmin", email: "webadmin@rguktong.ac.in" },
      process.env.JWT_SECURITY_KEY || "",
    );
    const response = await new Promise<{ status: number; body: { success?: boolean; tables?: TableSummary[] } }>(
      (resolve, reject) => {
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port: address.port,
            path: "/databases/uniz/tables?schema=public",
            headers: { Authorization: `Bearer ${token}` },
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
              resolve({
                status: res.statusCode || 0,
                body: JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
                  success?: boolean;
                  tables?: TableSummary[];
                },
              });
            });
          },
        );
        req.on("error", reject);
        req.end();
      },
    );
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    const tables = response.body.tables;
    assert.ok(Array.isArray(tables));
    for (const table of tables || []) {
      assert.equal(typeof table.name, "string");
      assert.ok(table.name.length > 0);
      assert.ok(table.estimatedRows === null || typeof table.estimatedRows === "number");
    }
    const found = byName(tables || []);
    assert.equal(found.get("courses"), null);
    assert.equal(found.get("empty_desk"), 0);
    assert.equal(found.has("private_notes"), true);
    assert.equal(found.has("blown_stats"), true);
  });

  it("still lists tables when pg_class cannot be read", async () => {
    const setup = new Pool({ connectionString: ADMIN_URL.replace(/\/postgres(\?|$)/, `/${DB_NAME}$1`) });
    try {
      await setup.query(`REVOKE ALL ON TABLE pg_catalog.pg_class FROM PUBLIC`);
      await setup.query(`REVOKE ALL ON TABLE pg_catalog.pg_class FROM ${ROLE}`);
    } finally {
      await setup.end();
    }
    try {
      const tables = await withReader((client) => listTables(client, "public"));
      const found = byName(tables);
      assert.equal(found.has("students"), true);
      assert.equal(found.has("courses"), true);
      assert.equal(found.has("empty_desk"), true);
      assert.equal(found.get("courses"), null);
      assert.equal(found.get("empty_desk"), null);
    } finally {
      const restore = new Pool({ connectionString: ADMIN_URL.replace(/\/postgres(\?|$)/, `/${DB_NAME}$1`) });
      try {
        await restore.query(`GRANT SELECT ON TABLE pg_catalog.pg_class TO PUBLIC`);
      } finally {
        await restore.end();
      }
    }
  });
});
