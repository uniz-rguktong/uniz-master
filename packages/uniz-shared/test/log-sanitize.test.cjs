"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { sanitizeLog } = require("../dist/log-sanitize.js");

describe("sanitizeLog", () => {
  it("strips carriage returns and newlines", () => {
    assert.equal(
      sanitizeLog("alice\nFAKE_LOG\r\nLINE"),
      "alice FAKE_LOG  LINE",
    );
  });

  it("handles non-string inputs safely", () => {
    assert.equal(sanitizeLog(404), "404");
    assert.equal(sanitizeLog(undefined), "undefined");
    assert.equal(sanitizeLog(null), "null");
  });
});
