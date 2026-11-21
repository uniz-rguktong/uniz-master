"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  accessRole,
  isWebadmin,
  webadminAssignmentRejection,
  WEBADMIN_ASSIGNMENT_MESSAGE,
} = require("../dist/admin-role.js");

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
