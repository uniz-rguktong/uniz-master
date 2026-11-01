import { randomUUID } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const queues = vi.hoisted(() => ({ list: [] as any[] }));

vi.mock("bullmq", () => ({
  Queue: class {
    add = vi.fn(async () => ({ id: "job-1" }));
    constructor(
      public name: string,
      public opts: { connection: unknown },
    ) {
      queues.list.push(this);
    }
  },
}));

async function loadQueue() {
  vi.resetModules();
  queues.list.length = 0;
  return import("../src/utils/queue.util");
}

describe("notification queue", () => {
  afterEach(() => {
    delete process.env.REDIS_URL;
  });

  it("falls back to localhost when REDIS_URL is unset", async () => {
    const { getNotificationQueue, NOTIFICATION_QUEUE_NAME } = await loadQueue();
    const queue = getNotificationQueue();
    expect(NOTIFICATION_QUEUE_NAME).toBe("notification-queue");
    expect(queue).toBe(queues.list[0]);
    expect(queues.list[0].name).toBe("notification-queue");
    expect(queues.list[0].opts.connection).toEqual({
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: null,
    });
    expect(getNotificationQueue({ tag: "ignored" } as never)).toBe(queue);
    expect(queues.list).toHaveLength(1);
  });

  it("parses host, port, and password from REDIS_URL", async () => {
    const fakePw = "test-" + randomUUID();
    const url = new URL("redis://redis.internal:6380");
    url.password = fakePw;
    process.env.REDIS_URL = url.toString();
    const { getNotificationQueue } = await loadQueue();
    getNotificationQueue();
    expect(queues.list[0].opts.connection).toEqual({
      host: "redis.internal",
      port: 6380,
      password: fakePw,
      maxRetriesPerRequest: null,
    });
  });

  it("omits an empty password and defaults a missing port", async () => {
    process.env.REDIS_URL = "redis://localhost";
    const { getNotificationQueue } = await loadQueue();
    getNotificationQueue();
    expect(queues.list[0].opts.connection).toEqual({
      host: "localhost",
      port: 6379,
      password: undefined,
      maxRetriesPerRequest: null,
    });
  });

  it("uses an injected connection for the first queue", async () => {
    const { getNotificationQueue } = await loadQueue();
    const connection = { host: "cache", port: 1 };
    getNotificationQueue(connection as never);
    expect(queues.list[0].opts.connection).toBe(connection);
  });

  it("rejects an unparseable REDIS_URL", async () => {
    process.env.REDIS_URL = "not a url";
    const { getNotificationQueue } = await loadQueue();
    expect(() => getNotificationQueue()).toThrow();
  });

  it("merges retry defaults when enqueueing a job", async () => {
    const { enqueueNotificationJob } = await loadQueue();
    const job = await enqueueNotificationJob(
      "EMAIL",
      { to: "ada@example.com" },
      { attempts: 1, jobId: "custom" },
    );
    expect(job).toEqual({ id: "job-1" });
    expect(queues.list[0].add).toHaveBeenCalledWith(
      "EMAIL",
      { to: "ada@example.com" },
      {
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
        attempts: 1,
        backoff: { type: "exponential", delay: 5000 },
        jobId: "custom",
      },
    );
  });
});
