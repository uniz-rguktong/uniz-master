import crypto from "node:crypto";
import http from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const HEALTH_KEY = "gateway:system_health_aggregate";
const NOW = 1_800_000_000_000;

const state = vi.hoisted(() => {
  const store = new Map<string, string>();
  const redisHandlers: Record<string, (err?: Error) => void> = {};
  const proxyHandlers: Record<string, Function> = {};
  const proxyWeb = vi.fn();
  const axiosGet = vi.fn();
  const flags = {
    getError: null as Error | null,
    setexError: null as Error | null,
  };
  const redis = {
    on(event: string, cb: (err?: Error) => void) {
      redisHandlers[event] = cb;
      return redis;
    },
    async get(key: string) {
      if (flags.getError) {
        const err = flags.getError;
        flags.getError = null;
        throw err;
      }
      return store.has(key) ? store.get(key)! : null;
    },
    async setex(key: string, _ttl: number, value: string) {
      if (flags.setexError) {
        const err = flags.setexError;
        flags.setexError = null;
        throw err;
      }
      store.set(key, value);
      return "OK";
    },
  };
  return {
    store,
    redis,
    redisHandlers,
    proxyHandlers,
    proxyWeb,
    axiosGet,
    flags,
    retryDelays: [] as number[],
    redisUrl: "" as string,
  };
});

vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

vi.mock("axios", () => ({
  default: {
    create: () => ({
      get: (...args: unknown[]) => state.axiosGet(...args),
    }),
  },
}));

vi.mock("ioredis", () => {
  class Redis {
    constructor(
      url?: string,
      options?: { retryStrategy?: (times: number) => number },
    ) {
      state.redisUrl = url || "";
      if (options?.retryStrategy) {
        state.retryDelays = [1, 3, 100].map((n) => options.retryStrategy!(n));
      }
      return state.redis as unknown as Redis;
    }
  }
  return { default: Redis };
});

vi.mock("http-proxy", () => {
  const proxy = {
    on(event: string, handler: Function) {
      state.proxyHandlers[event] = handler;
      return proxy;
    },
    web: (...args: unknown[]) => state.proxyWeb(...args),
  };
  return { default: { createProxyServer: () => proxy } };
});

import dotenv from "dotenv";

const realListen = http.Server.prototype.listen;
const realSetInterval = global.setInterval;
let captured: http.Server | undefined;
let markListening: () => void = () => {};
const intervalIds: ReturnType<typeof setInterval>[] = [];

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(global, "setInterval").mockImplementation(((fn: () => void, ms?: number) => {
  const id = realSetInterval(fn, ms as number);
  intervalIds.push(id);
  return id;
}) as typeof setInterval);
vi.spyOn(http.Server.prototype, "listen").mockImplementation(function (
  this: http.Server,
  ...args: unknown[]
) {
  captured = this;
  const cb = args.find((arg) => typeof arg === "function") as
    | (() => void)
    | undefined;
  return realListen.call(this, 0, () => {
    cb?.();
    markListening();
  });
});

const BASE_ENV: Record<string, string | undefined> = {
  CLIENT_URL: "http://localhost:5173, http://localhost:3000",
  NODE_ENV: "test",
  DOCKER_ENV: undefined,
  UNIZ_API_URL: "http://api.test:3001",
  AUTH_SERVICE_URL: "http://auth.test:3001",
  USER_SERVICE_URL: "http://user.test:3002",
  ACADEMICS_SERVICE_URL: "http://academics.test:3004",
  OUTPASS_SERVICE_URL: "http://outpass.test:3003",
  FILES_SERVICE_URL: "http://files.test:3005",
  NOTIFICATION_SERVICE_URL: "http://notify.test:3007",
  CRON_SERVICE_URL: "http://cron.test:3006",
  DOCS_SERVICE_URL: "http://docs.test:3333",
  LANDING_API_URL: "http://landing.test:8000/",
  ENABLE_OUTPASS_OUTING: "false",
  REDIS_URL: undefined,
  PORT: "0",
};

function applyEnv(overrides: Record<string, string | undefined> = {}) {
  const env = { ...BASE_ENV, ...overrides };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  for (const secret of [
    "DATABASE_URL",
    "AUTH_DATABASE_URL",
    "JWT_SECRET",
    "JWT_SECURITY_KEY",
  ]) {
    delete process.env[secret];
  }
}

function healthyAxios() {
  state.axiosGet.mockImplementation(async () => ({
    status: 200,
    headers: { "content-type": "application/json" },
    data: Buffer.from("{}"),
  }));
}

async function closeServer() {
  for (const id of intervalIds) clearInterval(id);
  intervalIds.length = 0;
  if (captured?.listening) {
    const server = captured;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

async function startGateway() {
  await closeServer();
  state.store.clear();
  state.proxyWeb.mockClear();
  state.axiosGet.mockClear();
  vi.resetModules();
  const ready = new Promise<void>((resolve) => {
    markListening = resolve;
  });
  await import("../src/index.ts");
  await ready;
  for (const id of intervalIds) clearInterval(id);
  intervalIds.length = 0;
  const address = captured?.address();
  if (!address || typeof address === "string") throw new Error("gateway did not listen");
  return address.port;
}

async function boot(overrides: Record<string, string | undefined> = {}) {
  applyEnv(overrides);
  healthyAxios();
  const port = await startGateway();
  await vi.waitFor(() => {
    if (!state.store.has(HEALTH_KEY)) throw new Error("health cache not warm");
  });
  return port;
}

function identity(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function cacheKey(service: string, url: string, raw: string) {
  return `p5:${service}:${Buffer.from(url).toString("base64")}:${identity(raw)}`;
}

function request(
  port: number,
  method: string,
  path: string,
  headers: Record<string, string> = {},
) {
  return new Promise<{
    status: number;
    headers: http.IncomingHttpHeaders;
    body: string;
  }>((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, method, path, headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.setTimeout(4000, () => req.destroy(new Error(`timeout ${method} ${path}`)));
    req.on("error", reject);
    req.end();
  });
}

function lastProxy() {
  const call = state.proxyWeb.mock.calls.at(-1);
  if (!call) throw new Error("proxy.web was not called");
  return { req: call[0] as any, opts: call[2] as { target?: string } };
}

describe("uniz-gateway", () => {
  let port = 0;

  beforeAll(async () => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);
    port = await boot();
  });

  afterAll(async () => {
    await closeServer();
  });

  beforeEach(() => {
    healthyAxios();
    state.flags.getError = null;
    state.flags.setexError = null;
    state.axiosGet.mockClear();
    state.proxyWeb.mockClear();
    state.proxyWeb.mockImplementation((_req: unknown, res: any) => {
      if (!res || res.writableEnded) return;
      if (!res.headersSent) {
        res.statusCode = 599;
        res.setHeader("x-test-proxied", "1");
      }
      res.end("proxied");
    });
  });

  it("mocks redis, dotenv, and the retry schedule without reading secrets", () => {
    expect(dotenv.config).toHaveBeenCalledWith({ override: true });
    expect(state.redisUrl).toBe("redis://uniz-redis:6379");
    expect(state.retryDelays).toEqual([50, 150, 2000]);
  });

  it("logs redis connect and error events", () => {
    (console.log as unknown as ReturnType<typeof vi.fn>).mockClear();
    (console.error as unknown as ReturnType<typeof vi.fn>).mockClear();
    state.redisHandlers.connect();
    state.redisHandlers.error(new Error("ECONNREFUSED"));
    expect(console.log).toHaveBeenCalledWith("[Redis] Connected for Caching");
    expect(console.error).toHaveBeenCalledWith(
      "[Redis] Connection Error:",
      "ECONNREFUSED",
    );
  });

  it("serves the banner and a local liveness probe", async () => {
    const root = await request(port, "GET", "/");
    expect(root.status).toBe(200);
    expect(root.body).toContain("UniZ Ultra-Speed Gateway");
    expect(root.body).toContain("SreeCharan Node");

    const live = await request(port, "GET", "/api/v1/system/health/live");
    expect(live.status).toBe(200);
    expect(JSON.parse(live.body)).toEqual({ status: "ok" });
    expect(live.headers["x-process-time-ms"]).toBeTruthy();
  });

  it("applies CORS only for configured origins and answers preflight", async () => {
    const allowed = await request(port, "GET", "/", {
      origin: "http://localhost:3000",
    });
    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");
    expect(allowed.headers["access-control-allow-headers"]).toContain(
      "Authorization",
    );

    const blocked = await request(port, "GET", "/", {
      origin: "http://evil.test",
    });
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();

    const preflight = await request(port, "OPTIONS", "/api/v1/system/health/live", {
      origin: "http://localhost:5173",
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers["access-control-allow-methods"]).toContain("PATCH");
    expect(preflight.headers["access-control-max-age"]).toBe("86400");
  });

  it("redirects doc pages onto /docs and proxies doc assets", async () => {
    const redirect = await request(port, "GET", "/faculty/list?x=1");
    expect(redirect.status).toBe(308);
    expect(redirect.headers.location).toBe("/docs/faculty/list?x=1");
    expect(state.proxyWeb).not.toHaveBeenCalled();

    const apiDoc = await request(port, "GET", "/api/academics");
    expect(apiDoc.status).toBe(308);
    expect(apiDoc.headers.location).toBe("/docs/api/academics");

    await request(port, "GET", "/assets/app.js", {
      referer: "http://localhost:5173/docs/intro",
    });
    expect(lastProxy().opts.target).toBe("http://docs.test:3333");
    expect(lastProxy().req.url).toBe("/assets/app.js");

    await request(port, "GET", "/docs//guide");
    expect(lastProxy().req.url).toBe("/guide");
    expect(lastProxy().opts.target).toBe("http://docs.test:3333");
  });

  it("splits analytics and cms traffic and strips the landing trailing slash", async () => {
    await request(port, "GET", "/api/v1/analytics/student/7?term=1");
    expect(lastProxy().req.url).toBe("/api/analytics/student/7");
    expect(lastProxy().opts.target).toBe("http://landing.test:8000");

    state.proxyWeb.mockClear();
    await request(port, "GET", "/api/v1/cms/api/home?x=1");
    expect(lastProxy().req.url).toBe("/api/home?x=1");
    expect(lastProxy().opts.target).toBe("http://landing.test:8000");

    state.proxyWeb.mockClear();
    await request(port, "GET", "/api/v1/cms/banners?active=1");
    expect(lastProxy().req.url).toBe("/banners?active=1");
    expect(lastProxy().opts.target).toBe("http://user.test:3002");
    expect(lastProxy().req.headers["x-uniz-service"]).toBe("cms");
  });

  it("proxies a service root that has no extra path", async () => {
    await request(port, "GET", "/api/v1/clubs", {
      authorization: "Bearer student",
    });
    expect(lastProxy().req.url).toBe("/");
    expect(lastProxy().req.headers["x-uniz-service"]).toBe("clubs");
    expect(lastProxy().opts.target).toBe("http://user.test:3002");

    state.proxyWeb.mockClear();
    await request(port, "POST", "/api/v1/clubs");
    expect(lastProxy().req.url).toBe("/");
    expect(lastProxy().req.headers["x-uniz-service"]).toBe("clubs");

    state.proxyWeb.mockClear();
    await request(port, "GET", "/api/v1/clubs/events", {
      authorization: "Bearer student",
    });
    expect(lastProxy().req.url).toBe("/events");
    expect(lastProxy().opts.target).toBe("http://user.test:3002");
  });

  it("rejects unknown services and parked outpass routes", async () => {
    const missing = await request(port, "GET", "/api/v1/unknown/x");
    expect(missing.status).toBe(404);
    expect(JSON.parse(missing.body)).toEqual({ error: "Service Not Found" });
    expect(state.proxyWeb).not.toHaveBeenCalled();

    const parked = await request(port, "POST", "/api/v1/requests/leave");
    expect(parked.status).toBe(503);
    expect(JSON.parse(parked.body)).toMatchObject({
      success: false,
      code: "OUTPASS_OUTING_DISABLED",
    });
  });

  it("sends grievance calls that arrive on /requests to the user service", async () => {
    await request(port, "POST", "/api/v1/requests/grievance/42?open=1");
    expect(lastProxy().req.url).toBe("/grievance/42?open=1");
    expect(lastProxy().req.headers["x-uniz-service"]).toBe("grievance");
    expect(lastProxy().opts.target).toBe("http://user.test:3002");
  });

  it("stamps unified services and leaves mail unstamped", async () => {
    await request(port, "POST", "/api/v1/auth/login");
    expect(lastProxy().opts.target).toBe("http://auth.test:3001");
    expect(lastProxy().req.headers["x-uniz-service"]).toBe("auth");
    expect(lastProxy().req.url).toBe("/login");

    state.proxyWeb.mockClear();
    await request(port, "POST", "/api/v1/mail/send");
    expect(lastProxy().opts.target).toBe("http://notify.test:3007");
    expect(lastProxy().req.headers["x-uniz-service"]).toBeUndefined();

    state.proxyWeb.mockClear();
    await request(port, "POST", "/api/v1/files/upload");
    expect(lastProxy().opts.target).toBe("http://files.test:3005");
    expect(lastProxy().req.headers["x-uniz-service"]).toBe("files");

    state.proxyWeb.mockClear();
    await request(port, "POST", "/api/v1/cron/tick");
    expect(lastProxy().opts.target).toBe("http://cron.test:3006");
  });

  it("returns a cached guest response without calling upstream", async () => {
    const key = cacheKey("auth", "/ping", "guest");
    state.store.set(
      key,
      JSON.stringify({
        body: '{"cached":true}',
        headers: { "content-type": "application/json", "x-from-cache": "yes" },
        status: 200,
      }),
    );
    const res = await request(port, "GET", "/api/v1/auth/ping");
    expect(res.status).toBe(200);
    expect(res.headers["x-cache"]).toBe("HIT");
    expect(res.headers["x-from-cache"]).toBe("yes");
    expect(JSON.parse(res.body)).toEqual({ cached: true });
    expect(state.axiosGet).not.toHaveBeenCalled();
    expect(state.proxyWeb).not.toHaveBeenCalled();
    expect(identity("guest")).toHaveLength(64);
  });

  it("partitions the cache by the full token and prefers authorization over uid", async () => {
    const tokenA = `Bearer ${"a".repeat(40)}`;
    const tokenB = `Bearer ${"a".repeat(39)}b`;
    const keyA = cacheKey("profile", "/cms/banners", tokenA);
    state.store.set(
      keyA,
      JSON.stringify({
        body: '{"who":"a"}',
        headers: { "content-type": "application/json" },
        status: 200,
      }),
    );

    const other = await request(port, "GET", "/api/v1/profile/cms/banners", {
      authorization: tokenB,
      uid: "user-42",
    });
    expect(other.headers["x-cache"]).toBeUndefined();
    expect(state.axiosGet).toHaveBeenCalled();

    state.axiosGet.mockClear();
    const hit = await request(port, "GET", "/api/v1/profile/cms/banners", {
      authorization: tokenA,
      uid: "user-42",
    });
    expect(hit.headers["x-cache"]).toBe("HIT");
    expect(JSON.parse(hit.body)).toEqual({ who: "a" });
    expect(state.axiosGet).not.toHaveBeenCalled();
  });

  it("stores raw utf-8 JSON for a guest miss and strips CORP", async () => {
    state.axiosGet.mockResolvedValue({
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cross-origin-resource-policy": "same-origin",
        "x-upstream": "1",
      },
      data: Buffer.from('{"ok":1}'),
    });
    const res = await request(port, "GET", "/api/v1/auth/ping?q=1");
    expect(res.status).toBe(200);
    expect(res.headers["cross-origin-resource-policy"]).toBeUndefined();
    expect(res.headers["x-upstream"]).toBe("1");
    expect(JSON.parse(res.body)).toEqual({ ok: 1 });

    const call = state.axiosGet.mock.calls[0];
    expect(call[0]).toBe("http://auth.test:3001/ping?q=1");
    expect(call[1]).toMatchObject({
      responseType: "arraybuffer",
      headers: { host: "auth.test:3001", "x-uniz-service": "auth" },
    });
    expect(call[1].validateStatus()).toBe(true);

    const key = cacheKey("auth", "/ping?q=1", "guest");
    await vi.waitFor(() => {
      if (!state.store.has(key)) throw new Error("cache write missing");
    });
    const stored = JSON.parse(state.store.get(key)!);
    expect(stored.body).toBe('{"ok":1}');
    expect(stored.status).toBe(200);
  });

  it("uses a 30s ttl for public cms and 10s otherwise", async () => {
    state.store.delete(cacheKey("auth", "/ping", "guest"));
    const setex = vi.spyOn(state.redis, "setex");
    await request(port, "GET", "/api/v1/auth/ping");
    expect(setex).toHaveBeenCalledWith(
      cacheKey("auth", "/ping", "guest"),
      10,
      expect.any(String),
    );

    setex.mockClear();
    await request(port, "GET", "/api/v1/profile/cms/updates", { uid: "user-42" });
    expect(setex).toHaveBeenCalledWith(
      cacheKey("profile", "/cms/updates", "user-42"),
      30,
      expect.any(String),
    );
    setex.mockRestore();
  });

  it("does not cache non-json, errors, binary, sensitive, authed, or no-cache gets", async () => {
    state.axiosGet.mockResolvedValue({
      status: 200,
      headers: { "content-type": "text/html" },
      data: Buffer.from("<p>hi</p>"),
    });
    const html = await request(port, "GET", "/api/v1/auth/page");
    expect(html.status).toBe(200);
    expect(html.body).toBe("<p>hi</p>");
    expect(state.store.has(cacheKey("auth", "/page", "guest"))).toBe(false);

    state.axiosGet.mockResolvedValue({
      status: 500,
      headers: { "content-type": "application/json" },
      data: Buffer.from('{"error":"x"}'),
    });
    const failed = await request(port, "GET", "/api/v1/auth/boom");
    expect(failed.status).toBe(500);
    expect(state.store.has(cacheKey("auth", "/boom", "guest"))).toBe(false);

    state.proxyWeb.mockClear();
    state.axiosGet.mockClear();
    await request(port, "GET", "/api/v1/files/img/a.png");
    expect(lastProxy().opts.target).toBe("http://files.test:3005");
    expect(state.axiosGet).not.toHaveBeenCalled();

    state.proxyWeb.mockClear();
    state.axiosGet.mockClear();
    await request(port, "GET", "/api/v1/academics/pdf/jobs/abc/download");
    expect(state.proxyWeb).toHaveBeenCalled();
    expect(state.axiosGet).not.toHaveBeenCalled();

    state.proxyWeb.mockClear();
    await request(port, "GET", "/api/v1/profile/student/me");
    expect(lastProxy().req.url).toBe("/student/me");
    expect(state.axiosGet).not.toHaveBeenCalled();

    state.proxyWeb.mockClear();
    await request(port, "GET", "/api/v1/auth/ping", {
      authorization: "Bearer secret-token",
    });
    expect(state.proxyWeb).toHaveBeenCalled();
    expect(state.axiosGet).not.toHaveBeenCalled();

    state.proxyWeb.mockClear();
    await request(port, "GET", "/api/v1/auth/ping", {
      "cache-control": "no-cache",
    });
    expect(state.proxyWeb).toHaveBeenCalled();
    expect(state.axiosGet).not.toHaveBeenCalled();
  });

  it("falls back to the proxy when the warp client throws and ignores a cache write failure", async () => {
    (console.error as unknown as ReturnType<typeof vi.fn>).mockClear();
    state.axiosGet.mockRejectedValue(new Error("socket hang up"));
    const fallback = await request(port, "GET", "/api/v1/notifications/digest");
    expect(fallback.status).toBe(599);
    expect(lastProxy().opts.target).toBe("http://notify.test:3007");
    expect(console.error).toHaveBeenCalledWith(
      "[Warp-Engine-Error]",
      "socket hang up",
    );

    healthyAxios();
    state.flags.setexError = new Error("readonly");
    const res = await request(port, "GET", "/api/v1/academics/catalog");
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({});
  });

  it("reports proxy failures and strips CORP on proxied responses", () => {
    const res = {
      headersSent: false,
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    state.proxyHandlers.error(new Error("upstream failed"), {
      headers: { origin: "http://localhost:5173" },
    }, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "http://localhost:5173",
    );
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: "Upstream Service Unreachable",
      message: "upstream failed",
    });

    const sent = {
      headersSent: true,
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    state.proxyHandlers.error(new Error("late"), { headers: {} }, sent);
    expect(sent.status).not.toHaveBeenCalled();

    const proxyRes = {
      headers: {
        "cross-origin-resource-policy": "same-origin",
        "content-type": "application/pdf",
      },
    };
    const downstream = { setHeader: vi.fn() };
    state.proxyHandlers.proxyRes(
      proxyRes,
      { headers: { origin: "http://evil.test" } },
      downstream,
    );
    expect(proxyRes.headers["cross-origin-resource-policy"]).toBeUndefined();
    expect(downstream.setHeader).not.toHaveBeenCalled();

    state.proxyHandlers.proxyRes({}, { headers: {} }, { setHeader: vi.fn() });
  });

  it("serves a fresh health snapshot from redis without probing", async () => {
    state.store.set(
      HEALTH_KEY,
      JSON.stringify({
        data: { status: "ok", services: [{ name: "marker" }] },
        httpStatus: 200,
        fetchedAt: NOW - 1000,
      }),
    );
    const res = await request(port, "GET", "/api/v1/system/health");
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      status: "ok",
      services: [{ name: "marker" }],
      cached: true,
    });
    expect(state.axiosGet).not.toHaveBeenCalled();
    expect(res.headers["x-process-time-ms"]).toBeTruthy();
  });

  it("returns a stale snapshot and refreshes it in the background", async () => {
    state.store.set(
      HEALTH_KEY,
      JSON.stringify({
        data: { status: "ok", services: [{ name: "stale" }] },
        httpStatus: 200,
        fetchedAt: NOW - 60_000,
      }),
    );
    const res = await request(port, "GET", "/api/v1/system/health");
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body).services[0].name).toBe("stale");
    expect(JSON.parse(res.body).cached).toBe(true);
    await vi.waitFor(() => {
      const parsed = JSON.parse(state.store.get(HEALTH_KEY)!);
      if (parsed.data.services?.[0]?.name === "stale") {
        throw new Error("background refresh has not landed");
      }
    });
  });

  it("refreshes an expired snapshot and marks optional probe failures healthy", async () => {
    state.axiosGet.mockImplementation(async (url: string) => {
      if (String(url).includes("auth.test")) throw new Error("auth down");
      if (String(url).includes("docs.test")) throw new Error("docs down");
      return { status: 200, headers: {}, data: Buffer.from("") };
    });
    state.store.set(
      HEALTH_KEY,
      JSON.stringify({
        data: { status: "ok", services: [{ name: "old" }] },
        httpStatus: 503,
        fetchedAt: NOW - 200_000,
      }),
    );
    const res = await request(port, "GET", "/api/v1/system/health");
    expect(res.status).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.cached).toBe(false);
    expect(body.status).toBe("down");
    expect(body.services.find((row: { name: string }) => row.name === "auth")).toMatchObject({
      status: "unhealthy",
      error: "auth down",
    });
    expect(body.services.find((row: { name: string }) => row.name === "docs")).toMatchObject({
      status: "healthy",
      statusDetail: "optional probe skipped",
      latency: "0ms",
    });
    const docsCall = state.axiosGet.mock.calls.find((call) =>
      String(call[0]).includes("docs.test"),
    );
    const authCall = state.axiosGet.mock.calls.find((call) =>
      String(call[0]).includes("auth.test"),
    );
    expect(docsCall?.[0]).toBe("http://docs.test:3333/health");
    expect(docsCall?.[1]).toMatchObject({ timeout: 250 });
    expect(authCall?.[1]).toMatchObject({ timeout: 800 });
  });

  it("refreshes when the health cache is missing, invalid, or unreadable", async () => {
    state.store.delete(HEALTH_KEY);
    const missing = await request(port, "GET", "/api/v1/system/health");
    expect(missing.status).toBe(200);
    expect(JSON.parse(missing.body).status).toBe("ok");
    expect(JSON.parse(missing.body).cached).toBe(false);

    state.store.set(HEALTH_KEY, "{");
    const invalid = await request(port, "GET", "/api/v1/system/health");
    expect(invalid.status).toBe(200);

    (console.error as unknown as ReturnType<typeof vi.fn>).mockClear();
    state.flags.getError = new Error("redis read");
    const unreadable = await request(port, "GET", "/api/v1/system/health");
    expect(unreadable.status).toBe(200);
    expect(console.error).toHaveBeenCalledWith(
      "[Health-Cache-Read]",
      expect.any(Error),
    );
  });

  it("returns 503 when a forced refresh cannot be stored", async () => {
    state.store.delete(HEALTH_KEY);
    state.flags.setexError = new Error("redis write failed");
    const res = await request(port, "GET", "/api/v1/system/health");
    expect(res.status).toBe(503);
    expect(JSON.parse(res.body)).toEqual({
      status: "down",
      error: "redis write failed",
    });
  });

  it("logs a warmer failure when the startup refresh cannot be stored", async () => {
    (console.error as unknown as ReturnType<typeof vi.fn>).mockClear();
    state.flags.setexError = new Error("warmer down");
    port = await startGateway();
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("[Health-Warmer]", "warmer down");
    });
    port = await boot();
  });

  describe("when outpass outing is enabled", () => {
    beforeAll(async () => {
      port = await boot({ ENABLE_OUTPASS_OUTING: "true" });
    });

    it("proxies outing requests to the outpass service", async () => {
      await request(port, "POST", "/api/v1/requests/outpass/new");
      expect(lastProxy().opts.target).toBe("http://outpass.test:3003");
      expect(lastProxy().req.url).toBe("/outpass/new");
      expect(lastProxy().req.headers["x-uniz-service"]).toBeUndefined();
    });
  });

  describe("with production and docker defaults", () => {
    beforeAll(async () => {
      port = await boot({
        LANDING_API_URL: undefined,
        DOCS_SERVICE_URL: undefined,
        DOCKER_ENV: "true",
        NODE_ENV: "production",
        CLIENT_URL: undefined,
        UNIZ_API_URL: undefined,
        AUTH_SERVICE_URL: undefined,
      });
    });

    it("uses the in-cluster landing and docs targets", async () => {
      await request(port, "GET", "/api/v1/analytics/dean/campus-occupancy");
      expect(lastProxy().opts.target).toBe(
        "http://uniz-landing-backend-svc.default.svc.cluster.local:8000",
      );

      state.proxyWeb.mockClear();
      state.axiosGet.mockClear();
      await request(port, "POST", "/api/v1/docs/page");
      expect(lastProxy().opts.target).toBe(
        "http://uniz-docs-service.default.svc.cluster.local:3333",
      );

      state.proxyWeb.mockClear();
      await request(port, "GET", "/assets/logo.svg", {
        referer: "https://uniz.example/docs",
      });
      expect(lastProxy().opts.target).toBe(
        "http://uniz-docs-service.default.svc.cluster.local:3333",
      );

      state.proxyWeb.mockClear();
      await request(port, "POST", "/api/v1/auth/login");
      expect(lastProxy().opts.target).toBe(
        "http://uniz-api-service.default.svc.cluster.local:3001",
      );

      state.proxyWeb.mockClear();
      await request(port, "GET", "/docs/guide");
      expect(lastProxy().req.url).toBe("/guide");
      expect(lastProxy().opts.target).toBe(
        "http://uniz-docs-service.default.svc.cluster.local:3333",
      );
    });
  });

  describe("with local defaults", () => {
    beforeAll(async () => {
      port = await boot({
        LANDING_API_URL: undefined,
        DOCS_SERVICE_URL: undefined,
        DOCKER_ENV: undefined,
        NODE_ENV: "test",
        CLIENT_URL: undefined,
        CRON_SERVICE_URL: undefined,
        OUTPASS_SERVICE_URL: undefined,
        MAIL_SERVICE_URL: undefined,
        NOTIFICATION_SERVICE_URL: undefined,
        FILES_SERVICE_URL: undefined,
        AUTH_SERVICE_URL: undefined,
        USER_SERVICE_URL: undefined,
        ACADEMICS_SERVICE_URL: undefined,
      });
    });

    it("uses localhost for landing, docs, and CORS", async () => {
      await request(port, "GET", "/api/v1/analytics/x");
      expect(lastProxy().opts.target).toBe("http://127.0.0.1:8000");

      const cors = await request(port, "GET", "/", {
        origin: "http://localhost:5173",
      });
      expect(cors.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173",
      );

      state.proxyWeb.mockClear();
      await request(port, "GET", "/assets/app.js", {
        referer: "http://127.0.0.1/docs",
      });
      expect(lastProxy().opts.target).toBe("http://127.0.0.1:3333");

      state.proxyWeb.mockClear();
      await request(port, "GET", "/docs");
      expect(lastProxy().req.url).toBe("/");
      expect(lastProxy().opts.target).toBe("http://127.0.0.1:3333");

      state.proxyWeb.mockClear();
      await request(port, "POST", "/api/v1/cron/tick");
      expect(lastProxy().opts.target).toBe(
        "http://uniz-outpass-service.default.svc.cluster.local:3003",
      );

      state.proxyWeb.mockClear();
      await request(port, "POST", "/api/v1/mail/send");
      expect(lastProxy().opts.target).toBe(
        "http://uniz-notification-service.default.svc.cluster.local:3007",
      );

      state.proxyWeb.mockClear();
      await request(port, "POST", "/api/v1/files/upload");
      expect(lastProxy().opts.target).toBe("http://api.test:3001");
      expect(lastProxy().req.headers["x-uniz-service"]).toBe("files");

      state.proxyWeb.mockClear();
      await request(port, "POST", "/api/v1/auth/login");
      expect(lastProxy().opts.target).toBe("http://api.test:3001");
    });
  });
});
