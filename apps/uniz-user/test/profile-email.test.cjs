const test = require("node:test");
const assert = require("node:assert/strict");
const {
  planProfilePatch,
  EMAIL_IN_USE_MESSAGE,
} = require("../dist/utils/profile-email");

const self = {
  id: "admin-1",
  username: "webadmin",
  email: "webadmin@rguktong.ac.in",
};

test("updating the phone with the same email succeeds", () => {
  const result = planProfilePatch({
    self,
    patch: {
      contact: "8110001666",
      email: "Webadmin@rguktong.ac.in",
      name: "webadmin",
    },
    owners: [
      self,
      {
        id: "auth-mirror",
        username: "WEBADMIN",
        email: "WEBADMIN@rguktong.ac.in",
      },
    ],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.contact, "8110001666");
  assert.equal(result.data.name, "webadmin");
  assert.equal(Object.prototype.hasOwnProperty.call(result.data, "email"), false);
});

test("changing to another user's email fails", () => {
  const result = planProfilePatch({
    self,
    patch: {
      contact: "8110001666",
      email: "Dean@rguktong.ac.in",
    },
    owners: [
      self,
      {
        id: "dean-1",
        username: "dean",
        email: "dean@rguktong.ac.in",
      },
    ],
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.message, EMAIL_IN_USE_MESSAGE);
});

test("a new email that nobody else owns is written in lowercase", () => {
  const result = planProfilePatch({
    self,
    patch: { email: "Webadmin.Desk@rguktong.ac.in" },
    owners: [self],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.data.email, "webadmin.desk@rguktong.ac.in");
});

test("omitting email leaves a phone update alone", () => {
  const result = planProfilePatch({
    self,
    patch: { contact: "9000000000" },
    owners: [
      {
        id: "dean-1",
        username: "dean",
        email: "dean@rguktong.ac.in",
      },
    ],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.data, { contact: "9000000000" });
});

test("ignores prototype-pollution keys in patch", () => {
  const patch = JSON.parse('{"contact":"9000000000","__proto__":{"polluted":true},"constructor":"bad","prototype":"bad"}');
  const result = planProfilePatch({
    self,
    patch,
    owners: [self],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.data, { contact: "9000000000" });
  assert.equal(Object.prototype.hasOwnProperty.call(result.data, "__proto__"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.data, "constructor"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.data, "prototype"), false);
});
