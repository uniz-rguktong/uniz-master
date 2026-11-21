"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  rejectStaleSession,
  isPasswordChangeExempt,
  encodeCredentialStatus,
  decodeCredentialStatus,
  PASSWORD_CHANGE_REQUIRED,
  AUTH_TOKEN_REVOKED,
} = require("../dist/session-gate.js");

describe("session gate", () => {
  it("allows a current token when a password change is not required", () => {
    assert.equal(
      rejectStaleSession({
        jwtVersion: 2,
        currentVersion: 2,
        mustChangePassword: false,
        method: "GET",
        path: "/api/v1/profile/student/me",
      }),
      null,
    );
  });

  it("treats a missing token version as generation 0", () => {
    assert.equal(
      rejectStaleSession({
        jwtVersion: undefined,
        currentVersion: 0,
        mustChangePassword: false,
        method: "GET",
        path: "/me",
      }),
      null,
    );
  });

  it("rejects a token from an older generation", () => {
    const rejection = rejectStaleSession({
      jwtVersion: 1,
      currentVersion: 2,
      mustChangePassword: false,
      method: "GET",
      path: "/api/v1/academics/grades",
    });
    assert.equal(rejection.status, 401);
    assert.equal(rejection.code, AUTH_TOKEN_REVOKED);
  });

  it("blocks API calls until the issued password is replaced", () => {
    const rejection = rejectStaleSession({
      jwtVersion: 3,
      currentVersion: 3,
      mustChangePassword: true,
      method: "GET",
      path: "/api/v1/profile/faculty/me",
    });
    assert.equal(rejection.status, 403);
    assert.equal(rejection.code, PASSWORD_CHANGE_REQUIRED);
  });

  it("still allows the password change and logout calls", () => {
    assert.equal(
      rejectStaleSession({
        jwtVersion: 3,
        currentVersion: 3,
        mustChangePassword: true,
        method: "POST",
        path: "/api/v1/auth/password/change",
      }),
      null,
    );
    assert.equal(
      rejectStaleSession({
        jwtVersion: 3,
        currentVersion: 3,
        mustChangePassword: true,
        method: "POST",
        path: "/auth/logout?next=/",
      }),
      null,
    );
    assert.equal(isPasswordChangeExempt("GET", "/password/change"), false);
    assert.equal(
      rejectStaleSession({
        jwtVersion: 3,
        currentVersion: 3,
        mustChangePassword: true,
        method: "POST",
        path: "/api/v1/auth/password/change/otp",
      }),
      null,
    );
  });

  it("does not trust the legacy suspension cache for a version check", () => {
    assert.equal(decodeCredentialStatus("true"), null);
    assert.equal(decodeCredentialStatus("false"), null);
    const encoded = encodeCredentialStatus({
      isDisabled: false,
      tokenVersion: 4,
      mustChangePassword: true,
    });
    assert.deepEqual(decodeCredentialStatus(encoded), {
      isDisabled: false,
      tokenVersion: 4,
      mustChangePassword: true,
    });
  });
});
