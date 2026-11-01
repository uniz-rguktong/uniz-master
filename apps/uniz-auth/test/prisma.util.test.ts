import { afterEach, describe, expect, it, vi } from "vitest";
import { constructed } from "./stubs/prisma-client";

async function loadPrisma() {
  delete (globalThis as { unizAuthPrisma?: unknown }).unizAuthPrisma;
  vi.resetModules();
  return import("../src/utils/prisma");
}

describe("prisma client", () => {
  afterEach(() => {
    constructed.length = 0;
    delete (globalThis as { unizAuthPrisma?: unknown }).unizAuthPrisma;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("pins a connection limit and pool timeout onto the auth url", async () => {
    vi.stubEnv(
      "AUTH_DATABASE_URL",
      "postgresql://user:pass@127.0.0.1:5432/uniz_auth?schema=auth",
    );
    vi.stubEnv("NODE_ENV", "test");
    await loadPrisma();
    const opts = constructed[0].opts as {
      datasources: { db: { url: string } };
      log: string[];
    };
    const url = new URL(opts.datasources.db.url);
    expect(url.searchParams.get("connection_limit")).toBe("5");
    expect(url.searchParams.get("pool_timeout")).toBe("15");
    expect(url.searchParams.get("schema")).toBe("auth");
    expect(opts.log).toEqual(["error"]);
  });

  it("uses the prisma env overrides when the url has no pool settings", async () => {
    vi.stubEnv("PRISMA_CONNECTION_LIMIT", "2");
    vi.stubEnv("PRISMA_POOL_TIMEOUT", "8");
    vi.stubEnv(
      "AUTH_DATABASE_URL",
      "postgresql://user:pass@127.0.0.1:5432/uniz_auth",
    );
    await loadPrisma();
    const url = new URL(
      (constructed[0].opts as { datasources: { db: { url: string } } })
        .datasources.db.url,
    );
    expect(url.searchParams.get("connection_limit")).toBe("2");
    expect(url.searchParams.get("pool_timeout")).toBe("8");
  });

  it("keeps limits already present on the url", async () => {
    vi.stubEnv(
      "AUTH_DATABASE_URL",
      "postgresql://user:pass@127.0.0.1:5432/uniz_auth?connection_limit=9&pool_timeout=3",
    );
    await loadPrisma();
    const url = new URL(
      (constructed[0].opts as { datasources: { db: { url: string } } })
        .datasources.db.url,
    );
    expect(url.searchParams.get("connection_limit")).toBe("9");
    expect(url.searchParams.get("pool_timeout")).toBe("3");
  });

  it("leaves a non-url string untouched", async () => {
    vi.stubEnv("AUTH_DATABASE_URL", "not a url");
    vi.stubEnv("NODE_ENV", "development");
    await loadPrisma();
    const opts = constructed[0].opts as {
      datasources: { db: { url: string } };
      log: string[];
    };
    expect(opts.datasources.db.url).toBe("not a url");
    expect(opts.log).toEqual(["error", "warn"]);
  });

  it("allows a missing database url", async () => {
    delete process.env.AUTH_DATABASE_URL;
    delete process.env.DATABASE_URL;
    await loadPrisma();
    expect(
      (constructed[0].opts as { datasources: { db: { url?: string } } })
        .datasources.db.url,
    ).toBeUndefined();
  });

  it("reuses the client outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv(
      "AUTH_DATABASE_URL",
      "postgresql://user:pass@127.0.0.1:5432/uniz_auth",
    );
    const first = await loadPrisma();
    vi.resetModules();
    const second = await import("../src/utils/prisma");
    expect(second.prisma).toBe(first.prisma);
    expect(constructed).toHaveLength(1);
  });

  it("does not stash the client globally in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "AUTH_DATABASE_URL",
      "postgresql://user:pass@127.0.0.1:5432/uniz_auth",
    );
    await loadPrisma();
    expect(
      (globalThis as { unizAuthPrisma?: unknown }).unizAuthPrisma,
    ).toBeUndefined();
  });

  it("warns on queries slower than SLOW_QUERY_MS", async () => {
    vi.stubEnv("SLOW_QUERY_MS", "50");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv(
      "AUTH_DATABASE_URL",
      "postgresql://user:pass@127.0.0.1:5432/uniz_auth",
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await loadPrisma();
    const opts = constructed[0].opts as {
      log: Array<{ emit: string; level: string } | string>;
    };
    expect(opts.log).toEqual([
      { emit: "stdout", level: "error" },
      { emit: "event", level: "query" },
    ]);
    constructed[0].listeners.query({ duration: 10, query: "SELECT fast" });
    constructed[0].listeners.query({ duration: 80, query: "SELECT slow" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("80ms");
    expect(String(warn.mock.calls[0][0])).toContain("SELECT slow");
  });
});
