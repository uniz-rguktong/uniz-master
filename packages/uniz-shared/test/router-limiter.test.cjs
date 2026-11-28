const test = require("node:test");
const assert = require("node:assert/strict");
const { clientKey } = require("../dist/router-limiter.js");

const req = (headers, ip) => ({
  headers,
  ip,
  socket: { remoteAddress: "10.0.0.9" },
});

test("signed-in users are keyed by token, not by shared campus IP", () => {
  const a = clientKey(
    req({ authorization: "Bearer aaa", "x-forwarded-for": "1.1.1.1" }),
  );
  const b = clientKey(
    req({ authorization: "Bearer bbb", "x-forwarded-for": "1.1.1.1" }),
  );
  assert.notEqual(a, b);
  assert.ok(a.startsWith("t:"));
  assert.ok(!a.includes("aaa"));
});

test("anonymous clients fall back to the forwarded address, then the socket", () => {
  assert.equal(clientKey(req({ "cf-connecting-ip": "2.2.2.2" })), "ip:2.2.2.2");
  assert.equal(
    clientKey(req({ "x-forwarded-for": "3.3.3.3, 4.4.4.4" })),
    "ip:3.3.3.3",
  );
  assert.equal(clientKey(req({}, "5.5.5.5")), "ip:5.5.5.5");
  assert.equal(clientKey(req({})), "ip:10.0.0.9");
});
