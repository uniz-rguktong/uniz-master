import { beforeEach, describe, expect, it, vi } from "vitest";

const { queues } = vi.hoisted(() => ({
  queues: [] as Array<{
    name: string;
    opts: unknown;
    add: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("bullmq", () => ({
  Queue: class Queue {
    name: string;
    opts: unknown;
    add = vi.fn(async (name: string, data: unknown, opts: unknown) => ({
      name,
      data,
      opts,
    }));
    constructor(name: string, opts: unknown) {
      this.name = name;
      this.opts = opts;
      queues.push(this);
    }
  },
}));

async function loadQueue() {
  vi.resetModules();
  return import("../src/utils/queue.util");
}

describe("notification queue", () => {
  beforeEach(() => {
    queues.length = 0;
    delete process.env.REDIS_URL;
  });

  it("uses localhost when REDIS_URL is unset and reuses the queue", async () => {
    const { getNotificationQueue, NOTIFICATION_QUEUE_NAME } = await loadQueue();
    const first = getNotificationQueue();
    const second = getNotificationQueue();
    expect(first).toBe(second);
    expect(NOTIFICATION_QUEUE_NAME).toBe("notification-queue");
    expect(queues).toHaveLength(1);
    expect(queues[0].opts).toMatchObject({
      connection: {
        host: "localhost",
        port: 6379,
        maxRetriesPerRequest: null,
      },
    });
  });

  it("parses host, port, and password from REDIS_URL", async () => {
    process.env.REDIS_URL = "redis://:test-pass@redis.internal:6380";
    const { getNotificationQueue } = await loadQueue();
    getNotificationQueue();
    expect(queues[0].opts).toMatchObject({
      connection: {
        host: "redis.internal",
        port: 6380,
        password: "test-pass",
        maxRetriesPerRequest: null,
      },
    });
  });

  it("defaults the port when the url omits one", async () => {
    process.env.REDIS_URL = "redis://redis.internal";
    const { getNotificationQueue } = await loadQueue();
    getNotificationQueue();
    expect(queues[0].opts).toMatchObject({
      connection: { host: "redis.internal", port: 6379, password: undefined },
    });
  });

  it("enqueues with the default retry options", async () => {
    const { enqueueNotificationJob, getNotificationQueue } = await loadQueue();
    const job = await enqueueNotificationJob(
      "OTP_EMAIL",
      { otp: "123456" },
      { priority: 1 },
    );
    expect(job).toMatchObject({
      name: "OTP_EMAIL",
      data: { otp: "123456" },
      opts: {
        attempts: 5,
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
        priority: 1,
        backoff: { type: "exponential", delay: 5000 },
      },
    });
    expect(getNotificationQueue()).toBe(queues[0]);
  });
});
