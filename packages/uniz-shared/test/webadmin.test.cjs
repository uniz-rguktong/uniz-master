"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  accessRole,
  demoteAcademicsDisplayRole,
  demoteStoredWebadminRole,
  isWebadmin,
  webadminAssignmentRejection,
  WEBADMIN_ASSIGNMENT_MESSAGE,
} = require("../dist/admin-role.js");

const repoRoot = path.resolve(__dirname, "../../..");
function migration(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("single webadmin account", () => {
  it("allows webadmin@rguktong.ac.in", () => {
    const account = {
      role: "webadmin",
      username: "WEBADMIN",
      email: "  Webadmin@RGUKTONG.ac.in ",
    };
    assert.equal(isWebadmin(account), true);
    assert.equal(accessRole(account), "webadmin");
    assert.equal(
      webadminAssignmentRejection(
        { username: "webadmin", email: "webadmin@rguktong.ac.in" },
        "webadmin",
      ),
      null,
    );
  });

  it("allows the institutional mailbox when the token has no email claim", () => {
    const account = { role: "Webadmin", username: "webadmin" };
    assert.equal(isWebadmin(account), true);
    assert.equal(accessRole(account), "webadmin");
  });

  it("denies another account that still has the webadmin role", () => {
    const account = {
      role: "webadmin",
      username: "dean",
      email: "dean@rguktong.ac.in",
    };
    assert.equal(isWebadmin(account), false);
    assert.equal(accessRole(account), "faculty");
    assert.equal(
      isWebadmin({ role: "webadmin", username: "mallikarjuna" }),
      false,
    );
  });

  it("rejects assigning webadmin to any other account", () => {
    assert.equal(
      webadminAssignmentRejection(
        { username: "coe", email: "coe@rguktong.ac.in" },
        "webadmin",
      ),
      WEBADMIN_ASSIGNMENT_MESSAGE,
    );
    assert.equal(
      webadminAssignmentRejection(
        { username: "director", email: "webadmin@rguktong.ac.in" },
        "WEBADMIN",
      ),
      null,
    );
    assert.equal(
      webadminAssignmentRejection({ username: "dean" }, "dean"),
      null,
    );
  });

  it("rejects a credential whose username is the webadmin mailbox", () => {
    assert.equal(
      webadminAssignmentRejection(
        {
          username: "webadmin@rguktong.ac.in",
          email: "webadmin@rguktong.ac.in",
        },
        "webadmin",
      ),
      WEBADMIN_ASSIGNMENT_MESSAGE,
    );
    assert.equal(
      isWebadmin({
        role: "webadmin",
        username: "webadmin@rguktong.ac.in",
        email: "webadmin@rguktong.ac.in",
      }),
      false,
    );
    assert.equal(
      webadminAssignmentRejection({ username: "WEBADMIN" }, "webadmin"),
      null,
    );
  });

  it("restores coe and keeps webadmin when demoting the July role flip", () => {
    assert.equal(demoteStoredWebadminRole({ username: "coe" }), "coe");
    assert.equal(demoteStoredWebadminRole({ username: "COE" }), "coe");
    assert.equal(
      demoteStoredWebadminRole({ username: "webadmin" }),
      "webadmin",
    );
    assert.equal(
      demoteStoredWebadminRole({
        username: "webadmin",
        email: "other@example.com",
      }),
      "webadmin",
    );
    assert.equal(
      demoteStoredWebadminRole({ username: "mallikarjuna" }),
      "faculty",
    );
    assert.equal(
      demoteStoredWebadminRole({
        username: "mallikarjuna",
        facultyProfileRole: "dean",
      }),
      "dean",
    );
    assert.equal(
      demoteAcademicsDisplayRole({ email: "coe@rguktong.ac.in" }),
      "COE",
    );
    assert.equal(
      demoteAcademicsDisplayRole({ email: "webadmin@rguktong.ac.in" }),
      "WEBADMIN",
    );
    assert.equal(
      demoteAcademicsDisplayRole({ email: "someone@rguktong.ac.in" }),
      "FACULTY",
    );

    const authSql = migration(
      "apps/uniz-auth/prisma/migrations/20261121193000_single_webadmin_account/migration.sql",
    );
    const userSql = migration(
      "apps/uniz-user/prisma/migrations/20261121193000_single_webadmin_account/migration.sql",
    );
    const academicsSql = migration(
      "apps/uniz-academics/prisma/migrations/20261121193000_single_webadmin_display_role/migration.sql",
    );
    for (const sql of [authSql, userSql, academicsSql]) {
      assert.match(sql, /'coe'/);
      assert.match(
        sql,
        /lower\(trim\(username\)\) = 'webadmin'|lower\(trim\(email\)\) = 'webadmin@rguktong.ac.in'/,
      );
    }
    assert.match(authSql, /SET role = lower\(trim\(username\)\)/);
    assert.match(userSql, /THEN lower\(trim\(f\.username\)\)/);
    assert.match(userSql, /THEN lower\(trim\(a\.username\)\)/);
    assert.match(
      academicsSql,
      /THEN upper\(split_part\(lower\(trim\(email\)\), '@', 1\)\)/,
    );
    const authDemote = authSql.indexOf("SET role = lower(trim(username))");
    const authFaculty = authSql.lastIndexOf("SET role = 'faculty'");
    assert.ok(authDemote > 0 && authDemote < authFaculty);
  });

  it("leaves the internal service identity unchanged", () => {
    assert.equal(
      accessRole({
        id: "internal",
        role: "webadmin",
        username: "internal-service",
      }),
      "webadmin",
    );
  });
});
