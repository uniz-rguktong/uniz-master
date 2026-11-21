const test = require("node:test");
const assert = require("node:assert/strict");
const {
  canReadAdminDirectory,
  canReadStaffBatches,
  isDirectoryWebadmin,
  isDirectoryRole,
  directoryPermissionWriteBlocked,
  sanitizeDirectoryPermissions,
  WEBADMIN_PERMISSION_LOCK_MESSAGE,
} = require("../dist/utils/staff-access");

test("batch list is staff-only", () => {
  assert.equal(canReadStaffBatches(undefined), false);
  assert.equal(canReadStaffBatches({ role: "student" }), false);
  assert.equal(canReadStaffBatches({ role: "STUDENT" }), false);
  assert.equal(canReadStaffBatches({ role: "webadmin", username: "webadmin" }), true);
  assert.equal(canReadStaffBatches({ role: "dean" }), true);
  assert.equal(canReadStaffBatches({ role: "director" }), true);
  assert.equal(canReadStaffBatches({ role: "faculty" }), true);
  assert.equal(canReadStaffBatches({ role: "hod", username: "hod_cse" }), true);
});

test("directory mutations stay with the canonical webadmin", () => {
  assert.equal(isDirectoryWebadmin(undefined), false);
  assert.equal(isDirectoryWebadmin({ role: "student" }), false);
  assert.equal(isDirectoryWebadmin({ role: "dean" }), false);
  assert.equal(isDirectoryWebadmin({ role: "webadmin", username: "dean" }), false);
  assert.equal(
    isDirectoryWebadmin({
      role: "webadmin",
      email: "webadmin@rguktong.ac.in",
    }),
    true,
  );
  assert.equal(
    isDirectoryWebadmin({ role: "webadmin", username: "webadmin" }),
    true,
  );
});

test("directory reads include dean and director", () => {
  assert.equal(canReadAdminDirectory(undefined), false);
  assert.equal(canReadAdminDirectory({ role: "student" }), false);
  assert.equal(canReadAdminDirectory({ role: "faculty" }), false);
  assert.equal(canReadAdminDirectory({ role: "dean" }), true);
  assert.equal(canReadAdminDirectory({ role: "director" }), true);
  assert.equal(
    canReadAdminDirectory({ role: "webadmin", username: "webadmin" }),
    true,
  );
  assert.equal(
    canReadAdminDirectory({ role: "webadmin", username: "dean" }),
    false,
  );
});

test("webadmin permission writes are rejected", () => {
  assert.equal(directoryPermissionWriteBlocked("webadmin"), true);
  assert.equal(directoryPermissionWriteBlocked(" Webadmin "), true);
  assert.equal(directoryPermissionWriteBlocked("dean"), false);
  assert.equal(directoryPermissionWriteBlocked("director"), false);
  assert.equal(directoryPermissionWriteBlocked(""), false);
  assert.equal(
    WEBADMIN_PERMISSION_LOCK_MESSAGE,
    "The webadmin role cannot be edited",
  );
});

test("directory roles and permissions are the portal set", () => {
  assert.equal(isDirectoryRole("webadmin"), true);
  assert.equal(isDirectoryRole("dean"), true);
  assert.equal(isDirectoryRole("director"), true);
  assert.equal(isDirectoryRole("student"), false);
  assert.equal(isDirectoryRole("faculty"), false);
  assert.deepEqual(
    sanitizeDirectoryPermissions(["view_reports", "manage_users"]),
    ["view_reports", "manage_users"],
  );
  assert.equal(sanitizeDirectoryPermissions(["not_a_permission"]), null);
  assert.equal(sanitizeDirectoryPermissions("view_reports"), null);
});
