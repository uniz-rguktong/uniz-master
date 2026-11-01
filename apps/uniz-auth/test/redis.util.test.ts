import { afterEach, describe, expect, it, vi } from "vitest";

const { ctorArgs, handlers, config } = vi.hoisted(() => ({
  ctorArgs: [] as unknown[][],
  handlers: {} as Record<string, (err?: unknown) => void>,
  config: vi.fn(),
}));

vi.mock("dotenv", () => ({
  default: { config },
}));

vi.mock("ioredis", () => ({
  default: class Redis {
    constructor(...args: unknown[]) {
      ctorArgs.push(args);
    }
    on(event: string, cb: (err?: unknown) => void) {
      handlers[event] = cb;
      return this;
    }
  },
}));

describe("redis client", () => {
  afterEach(() => {
    ctorArgs.length = 0;
    for (const key of Object.keys(handlers)) delete handlers[key];
    config.mockClear();
    vi.resetModules();
    delete process.env.REDIS_URL;
    vi.restoreAllMocks();
  });

  it("does not read a url when REDIS_URL is unset", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await import("../src/utils/redis.util");
    expect(config).toHaveBeenCalled();
    expect(ctorArgs[0]).toEqual([
      { maxRetriesPerRequest: 10, connectTimeout: 10000 },
    ]);
    handlers.connect();
    expect(log).toHaveBeenCalledWith("Connected to Internal Redis");
  });

  it("passes REDIS_URL through and logs connection errors", async () => {
    process.env.REDIS_URL = "redis://redis.internal:6379";
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await import("../src/utils/redis.util");
    expect(ctorArgs[0][0]).toBe("redis://redis.internal:6379");
    handlers.connect();
    expect(log).toHaveBeenCalledWith("Connected to Redis Cloud");
    handlers.error(new Error("refused"));
    expect(error).toHaveBeenCalled();
  });
});
