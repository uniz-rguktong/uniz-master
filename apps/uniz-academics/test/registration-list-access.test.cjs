const test = require("node:test");
const assert = require("node:assert/strict");
const {
  canListRegistrations,
} = require("../dist/utils/registration-list-access");

test("registration list is limited to academic staff", () => {
  for (const role of ["webadmin", "coe", "dean", "director", "hod"]) {
    assert.equal(canListRegistrations(role), true);
  }
  assert.equal(canListRegistrations("WEBADMIN"), true);
  assert.equal(canListRegistrations("student"), false);
  assert.equal(canListRegistrations("faculty"), false);
  assert.equal(canListRegistrations("teacher"), false);
  assert.equal(canListRegistrations(""), false);
});
