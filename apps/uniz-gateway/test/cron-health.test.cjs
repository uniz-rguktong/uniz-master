const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { handleCronHealth, CRON_HEALTH_BODY } = require("../dist/cron-health.js");

describe("GET /api/v1/cron/health", () => {
  it("returns CronJob-only JSON from the gateway handler", async () => {
    const app = express();
    app.get("/api/v1/cron/health", handleCronHealth);
    const server = await new Promise((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    try {
      const addr = server.address();
      assert.ok(addr && typeof addr !== "string");
      const res = await fetch(`http://127.0.0.1:${addr.port}/api/v1/cron/health`);
      const body = await res.json();
      assert.equal(res.status, 200);
      assert.deepEqual(body, CRON_HEALTH_BODY);
      assert.equal(body.maintenance, "CronJob-only");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it("does not proxy cron through serviceMap", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../src/index.ts"),
      "utf8",
    );
    assert.match(src, /handleCronHealth/);
    assert.match(src, /\/api\/v1\/cron\/health/);
    assert.doesNotMatch(src, /^\s*cron:/m);
    assert.doesNotMatch(src, /CRON_SERVICE_URL/);
  });
});
