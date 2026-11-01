import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Constructed = {
  opts: { datasources: { db: { url?: string } }; log: unknown };
  ons: unknown[][];
};

const registry = globalThis as { __prismaClients?: Constructed[]; prisma?: unknown };

async function loadPrisma() {
  vi.resetModules();
  registry.__prismaClients = [];
  return import("../src/utils/prisma.util");
}

function client() {
  return registry.__prismaClients?.[0];
}

describe("prisma pooled url", () => {
  beforeEach(() => {
    delete registry.prisma;
    registry.__prismaClients = [];
  });

  afterEach(() => {
    delete registry.prisma;
    delete process.env.NOTIFICATION_DATABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.PRISMA_CONNECTION_LIMIT;
    delete process.env.PRISMA_POOL_TIMEOUT;
    delete process.env.SLOW_QUERY_MS;
    process.env.NODE_ENV = "test";
  });

  it("adds a connection limit and pool timeout", async () => {
    process.env.NOTIFICATION_DATABASE_URL =
      "postgresql://user:pass@127.0.0.1:5432/notifications";
    process.env.DATABASE_URL = "postgresql://ignored@127.0.0.1:5432/other";
    await loadPrisma();
    const url = new URL(client().opts.datasources.db.url!);
    expect(url.searchParams.get("connection_limit")).toBe("5");
    expect(url.searchParams.get("pool_timeout")).toBe("15");
    expect(url.pathname).toBe("/notifications");
  });

  it("keeps limits that are already on the url and honors overrides", async () => {
    process.env.PRISMA_CONNECTION_LIMIT = "9";
    process.env.PRISMA_POOL_TIMEOUT = "3";
    process.env.DATABASE_URL =
      "postgresql://user:pass@127.0.0.1:5432/notifications?connection_limit=2";
    await loadPrisma();
    const url = new URL(client().opts.datasources.db.url!);
    expect(url.searchParams.get("connection_limit")).toBe("2");
    expect(url.searchParams.get("pool_timeout")).toBe("3");
  });

  it("returns an unparseable url unchanged and ignores a missing url", async () => {
    process.env.DATABASE_URL = "not a url";
    await loadPrisma();
    expect(client().opts.datasources.db.url).toBe("not a url");

    delete process.env.DATABASE_URL;
    delete registry.prisma;
    await loadPrisma();
    expect(client().opts.datasources.db.url).toBeUndefined();
  });

  it("warns only for queries slower than SLOW_QUERY_MS", async () => {
    process.env.SLOW_QUERY_MS = "50";
    process.env.DATABASE_URL =
      "postgresql://user:pass@127.0.0.1:5432/notifications";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await loadPrisma();
    expect(client().opts.log).toEqual([
      { emit: "stdout", level: "error" },
      { emit: "event", level: "query" },
    ]);
    const handler = client().ons.find((call) => call[0] === "query")?.[1] as (
      event: { duration: number; query: string },
    ) => void;
    handler({ duration: 49, query: "select 1" });
    handler({ duration: 50, query: "select 2" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("50ms");
    warn.mockRestore();
  });

  it("includes warnings while developing and reuses the global client", async () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL =
      "postgresql://user:pass@127.0.0.1:5432/notifications";
    await loadPrisma();
    expect(client().opts.log).toEqual(["error", "warn"]);
    expect(registry.prisma).toBe(client());

    vi.resetModules();
    registry.__prismaClients = [];
    await import("../src/utils/prisma.util");
    expect(registry.__prismaClients).toHaveLength(0);
  });

  it("does not store the client globally in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL =
      "postgresql://user:pass@127.0.0.1:5432/notifications";
    await loadPrisma();
    expect(client().opts.log).toEqual(["error"]);
    expect(registry.prisma).toBeUndefined();
  });
});
