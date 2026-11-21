import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { claimsAllow, decideAccess, readAccessToken, accessCertsUrl, accessIssuer } from "../access/claims";
import { classifySql, confirmationSatisfied, targetsAuditTable } from "../audit/sql";
import { quoteIdent } from "../audit/idents";
import { buildDelete, buildInsert, buildRowSelect, buildUpdate, collectFilters } from "../audit/rowsql";
import { TABLE_LIST_SQL } from "../catalog";
import { buildUndoStatement, fitAuditJson, isChangeUndone } from "../audit/undo";
import { coerceColumnValue, columnInputKind, describeChange } from "../audit/values";
import { DbAdminError, sanitizePgMessage } from "../errors";
import { createRateLimiter } from "../rate-limit";

const columns = [
  { name: "id", dataType: "uuid" },
  { name: "name", dataType: "text" },
  { name: "note", dataType: "jsonb" },
];

describe("sql classification", () => {
  it("treats select as a read", () => {
    const result = classifySql("  select 1;  ");
    assert.equal(result.kind, "read");
    assert.equal(result.confirmText, null);
  });

  it("treats a data-changing common table expression as a write", () => {
    const result = classifySql("WITH c AS (SELECT 1) UPDATE people SET name = 'a'");
    assert.equal(result.kind, "write");
    assert.equal(result.confirmText, "UPDATE");
  });

  it("treats select into as a write", () => {
    assert.equal(classifySql("SELECT id INTO copy FROM people").kind, "write");
  });

  it("ignores comments and strings when finding the command", () => {
    const result = classifySql("/* note */ -- hi\nDELETE FROM people WHERE name = 'DELETE'");
    assert.equal(result.confirmText, "DELETE");
  });

  it("keeps a do block as one command", () => {
    const result = classifySql("DO $$ BEGIN DELETE FROM people; END $$;");
    assert.equal(result.statements.length, 1);
    assert.equal(result.confirmText, "DO");
  });

  it("requires confirmation for a mixed batch", () => {
    const result = classifySql("SELECT 1; DELETE FROM people");
    assert.equal(result.kind, "write");
    assert.equal(result.confirmText, "DELETE");
  });

  it("treats explain analyze as a write and plain explain as a read", () => {
    assert.equal(classifySql("EXPLAIN SELECT 1").kind, "read");
    assert.equal(classifySql("EXPLAIN ANALYZE SELECT 1").kind, "write");
  });

  it("rejects login changes and transaction control", () => {
    assert.throws(() => classifySql("SET ROLE postgres"), DbAdminError);
    assert.throws(() => classifySql("SET SESSION AUTHORIZATION postgres"), DbAdminError);
    assert.throws(() => classifySql("BEGIN"), DbAdminError);
  });

  it("rejects edits to the history tables", () => {
    assert.equal(targetsAuditTable('UPDATE "uniz_dbadmin"."changes" SET id = id'), true);
    assert.throws(() => classifySql("DELETE FROM uniz_dbadmin.changes"), DbAdminError);
    assert.equal(classifySql("SELECT * FROM uniz_dbadmin.changes").kind, "read");
  });

  it("matches a typed confirmation exactly", () => {
    assert.equal(confirmationSatisfied("DELETE", "DELETE"), true);
    assert.equal(confirmationSatisfied("DELETE", "delete"), false);
    assert.equal(confirmationSatisfied(null, undefined), true);
  });
});

describe("undo", () => {
  it("turns an insert into a delete by key", () => {
    const undo = buildUndoStatement({
      action: "insert",
      schema: "uniz_user",
      table: "StudentProfile",
      primaryKey: { id: "abc" },
      before: null,
      after: { id: "abc" },
    });
    assert.equal(undo.text, 'DELETE FROM "uniz_user"."StudentProfile" WHERE "id" = $1');
    assert.deepEqual(undo.values, ["abc"]);
  });

  it("restores a deleted row without putting the text into the command", () => {
    const nasty = "'); DROP TABLE people;--";
    const undo = buildUndoStatement({
      action: "delete",
      schema: "s",
      table: "t",
      primaryKey: { id: "1" },
      before: { id: "1", name: nasty },
      after: null,
    });
    assert.equal(undo.text.includes("DROP"), false);
    assert.deepEqual(undo.values, ["1", nasty]);
  });

  it("puts the previous values back on an edit", () => {
    const undo = buildUndoStatement({
      action: "update",
      schema: "s",
      table: "t",
      primaryKey: { id: 1 },
      before: { id: 1, name: "old", meta: { a: 1 } },
      after: { id: 1, name: "new" },
    });
    assert.match(undo.text, /^UPDATE "s"\."t" SET/);
    assert.equal(undo.values[1], "old");
    assert.equal(undo.values[2], '{"a":1}');
    assert.equal(undo.values[3], 1);
  });

  it("refuses to undo a row with no key", () => {
    assert.throws(
      () =>
        buildUndoStatement({
          action: "update",
          schema: "s",
          table: "t",
          primaryKey: null,
          before: { a: 1 },
          after: { a: 2 },
        }),
      /no key/,
    );
  });

  it("knows when a later history row already undid a change", () => {
    assert.equal(isChangeUndone("a", [{ reversesId: null }, { reversesId: "a" }]), true);
    assert.equal(isChangeUndone("a", [{ reversesId: "b" }]), false);
  });

  it("marks oversized snapshots as not restorable", () => {
    const fitted = fitAuditJson({ blob: "x".repeat(500_001) });
    assert.equal(fitted.truncated, true);
    assert.deepEqual(fitted.json, { _truncated: true });
  });
});

describe("row commands", () => {
  it("binds search text instead of pasting it into the command", () => {
    const built = buildRowSelect({
      schema: "uniz_user",
      table: "StudentProfile",
      columns,
      search: "a' OR 1=1",
      limit: 50,
      offset: 0,
    });
    assert.equal(built.rows.text.includes("OR 1=1"), false);
    assert.equal(built.rows.values[0], "%a' OR 1=1%");
  });

  it("rejects a sort column that is not on the table", () => {
    assert.throws(
      () =>
        buildRowSelect({
          schema: "s",
          table: "t",
          columns,
          sort: { column: "secret", direction: "asc" },
          limit: 10,
          offset: 0,
        }),
      DbAdminError,
    );
  });

  it("keeps insert and update values out of the command text", () => {
    const inserted = buildInsert("s", "t", { name: "Ann" });
    assert.equal(inserted.text, 'INSERT INTO "s"."t" ("name") VALUES ($1) RETURNING *');
    assert.deepEqual(inserted.values, ["Ann"]);
    const updated = buildUpdate("s", "t", { name: "Bea" }, { id: "1" });
    assert.match(updated.text, /WHERE "id" = \$2 RETURNING \*$/);
    assert.deepEqual(updated.values, ["Bea", "1"]);
    const removed = buildDelete("s", "t", { id: "1" });
    assert.equal(removed.text, 'DELETE FROM "s"."t" WHERE "id" = $1');
  });

  it("casts a column only when the type name is safe", () => {
    const updated = buildUpdate("s", "t", { at: "2026-01-01T00:00:00.000Z" }, { id: "1" }, { at: "timestamptz" });
    assert.match(updated.text, /"at" = \$1::timestamptz/);
    assert.deepEqual(updated.values, ["2026-01-01T00:00:00.000Z", "1"]);
    assert.throws(() => buildUpdate("s", "t", { at: "x" }, { id: "1" }, { at: "text; drop" }), DbAdminError);
  });

  it("rejects unsafe names", () => {
    assert.throws(() => quoteIdent('id"; drop table t;--'), DbAdminError);
  });

  it("binds column filters and keeps their text out of the command", () => {
    const contains = buildRowSelect({
      schema: "s",
      table: "t",
      columns,
      filters: [{ column: "name", op: "contains", value: "a'b" }],
      limit: 10,
      offset: 0,
    });
    assert.equal(contains.rows.text.includes("a'b"), false);
    assert.match(contains.rows.text, /"name"::text ILIKE \$1/);
    assert.equal(contains.rows.values[0], "%a'b%");

    const equals = buildRowSelect({
      schema: "s",
      table: "t",
      columns,
      filters: [{ column: "name", op: "eq", value: "Ann" }],
      limit: 10,
      offset: 0,
    });
    assert.match(equals.rows.text, /"name"::text = \$1/);
    assert.equal(equals.rows.values[0], "Ann");
  });

  it("treats is null as a predicate with no bound value", () => {
    const built = buildRowSelect({
      schema: "s",
      table: "t",
      columns,
      filters: [{ column: "name", op: "isnull", value: "'); DROP TABLE t;--" }],
      limit: 10,
      offset: 0,
    });
    assert.equal(built.rows.text.includes("DROP"), false);
    assert.match(built.rows.text, /"name" IS NULL/);
    assert.deepEqual(built.rows.values, [10, 0]);
  });

  it("compares numbers and text with the column type", () => {
    const greater = buildRowSelect({
      schema: "s",
      table: "t",
      columns: [...columns, { name: "age", dataType: "integer" }],
      filters: [{ column: "age", op: "gt", value: "21" }],
      limit: 10,
      offset: 0,
    });
    assert.match(greater.rows.text, /"age" > \$1::numeric/);
    assert.equal(greater.rows.text.includes("21"), false);
    assert.equal(greater.rows.values[0], "21");

    const less = buildRowSelect({
      schema: "s",
      table: "t",
      columns,
      filters: [{ column: "name", op: "lt", value: "M" }],
      limit: 5,
      offset: 0,
    });
    assert.match(less.rows.text, /"name"::text < \$1/);
    assert.equal(less.rows.text.includes("::numeric"), false);
  });

  it("ands several filters and rejects a missing column", () => {
    const built = buildRowSelect({
      schema: "s",
      table: "t",
      columns,
      filters: [
        { column: "name", op: "eq", value: "Ann" },
        { column: "note", op: "isnull" },
      ],
      limit: 10,
      offset: 0,
    });
    assert.match(built.rows.text, /"name"::text = \$1 AND "note" IS NULL/);
    assert.throws(
      () =>
        buildRowSelect({
          schema: "s",
          table: "t",
          columns,
          filters: [{ column: "secret", op: "eq", value: "x" }],
          limit: 10,
          offset: 0,
        }),
      DbAdminError,
    );
  });

  it("reads the filter list and the older single filter", () => {
    assert.deepEqual(
      collectFilters({
        filters: JSON.stringify([
          { column: "name", op: "contains", value: "an" },
          { column: "note", op: "isnull", value: "" },
        ]),
      }),
      [
        { column: "name", op: "contains", value: "an" },
        { column: "note", op: "isnull", value: "" },
      ],
    );
    assert.deepEqual(collectFilters({ filterColumn: "name", filterOp: "eq", filterValue: "Ann" }), [
      { column: "name", op: "eq", value: "Ann" },
    ]);
    assert.deepEqual(collectFilters({ filterColumn: "name", filterOp: "contains", filterValue: "  " }), []);
    assert.throws(() => collectFilters({ filters: "{" }), /not sent correctly/);
    assert.throws(
      () => collectFilters({ filters: JSON.stringify([{ column: "name", op: "like", value: "a" }]) }),
      /not supported/,
    );
    const many = Array.from({ length: 9 }, (_, index) => ({ column: "name", op: "eq", value: String(index) }));
    assert.throws(() => collectFilters({ filters: JSON.stringify(many) }), /at most 8/);
  });

  it("estimates table size from planner stats instead of counting every row", () => {
    assert.match(TABLE_LIST_SQL, /reltuples/);
    assert.match(TABLE_LIST_SQL, /\$1/);
    assert.equal(TABLE_LIST_SQL.includes("${"), false);
  });
});

describe("values", () => {
  it("picks an input from the column type", () => {
    assert.equal(columnInputKind("boolean", "bool", null), "boolean");
    assert.equal(columnInputKind("timestamp with time zone", "timestamptz", null), "datetime");
    assert.equal(columnInputKind("USER-DEFINED", "mood", ["ok", "no"]), "enum");
    assert.equal(columnInputKind("jsonb", "jsonb", null), "json");
    assert.equal(columnInputKind("bytea", "bytea", null), "binary");
  });

  it("coerces empty, boolean, json, and numbers", () => {
    assert.equal(coerceColumnValue("number", ""), null);
    assert.equal(coerceColumnValue("boolean", "true"), true);
    assert.deepEqual(coerceColumnValue("json", '{"a":1}'), { a: 1 });
    assert.equal(coerceColumnValue("text", ""), "");
    assert.throws(() => coerceColumnValue("json", "{"), /JSON/);
    assert.throws(() => coerceColumnValue("binary", "aa"), /File/);
  });

  it("describes a change in plain language", () => {
    assert.equal(describeChange("delete", "people"), "Removed a row in people");
    assert.equal(describeChange("sql", "people"), "Ran a database command");
  });
});

describe("rate limit", () => {
  it("allows a burst and then waits", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    assert.equal(limiter.allow("ada", 10), true);
    assert.equal(limiter.allow("ada", 20), true);
    assert.equal(limiter.allow("ada", 30), false);
    assert.equal(limiter.allow("ada", 2000), true);
  });
});

describe("database errors", () => {
  it("hides connection strings and explains permission errors", () => {
    assert.equal(sanitizePgMessage("28P01", "password authentication failed for postgresql://u:p@h/db"), "The database rejected that request.");
    assert.match(sanitizePgMessage("42501", "permission denied"), /cannot change the database structure/);
  });
});

describe("cloudflare access", () => {
  it("builds the public certs url only for an access team domain", () => {
    assert.equal(
      accessCertsUrl("sweet-frost-287a.cloudflareaccess.com").href,
      "https://sweet-frost-287a.cloudflareaccess.com/cdn-cgi/access/certs",
    );
    assert.equal(accessIssuer("sweet-frost-287a.cloudflareaccess.com"), "https://sweet-frost-287a.cloudflareaccess.com");
    assert.throws(() => accessCertsUrl("evil.example"), /team domain/);
  });

  it("accepts only the configured application audience", () => {
    const issuer = "https://sweet-frost-287a.cloudflareaccess.com";
    const aud = "f7f85a6370a5369a98b00fa3cdd47fe5d487317bad36bc70a52df6984e2f4ba0";
    assert.equal(claimsAllow({ iss: issuer, aud }, issuer, aud), true);
    assert.equal(claimsAllow({ iss: issuer, aud: [aud, "other"] }, issuer, aud), true);
    assert.equal(claimsAllow({ iss: issuer, aud: "other" }, issuer, aud), false);
    assert.equal(claimsAllow({ iss: "https://elsewhere.cloudflareaccess.com", aud }, issuer, aud), false);
  });

  it("rejects a missing or invalid assertion", async () => {
    const issuer = "https://sweet-frost-287a.cloudflareaccess.com";
    const aud = "abc";
    assert.equal(readAccessToken({}), null);
    assert.equal(readAccessToken({ "cf-access-jwt-assertion": "  " }), null);
    assert.equal(readAccessToken({ "cf-access-jwt-assertion": "token" }), "token");
    assert.equal(await decideAccess(null, async () => ({ iss: issuer, aud }), issuer, aud), false);
    assert.equal(
      await decideAccess("bad", async () => {
        throw new Error("bad signature");
      }, issuer, aud),
      false,
    );
    assert.equal(
      await decideAccess("good", async () => ({ iss: issuer, aud }), issuer, aud),
      true,
    );
  });
});
