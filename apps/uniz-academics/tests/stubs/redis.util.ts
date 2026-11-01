import { vi } from "vitest";

export function createRedisPipeline() {
  const chain: {
    exec: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
  } = {
    exec: vi.fn().mockResolvedValue([]),
    del: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    expire: vi.fn(),
  };
  chain.del.mockImplementation(() => chain);
  chain.set.mockImplementation(() => chain);
  chain.get.mockImplementation(() => chain);
  chain.expire.mockImplementation(() => chain);
  return chain;
}

export const redis = {
  get: vi.fn().mockResolvedValue(null),
  getBuffer: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue("OK"),
  setex: vi.fn().mockResolvedValue("OK"),
  del: vi.fn().mockResolvedValue(1),
  incr: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  rpush: vi.fn().mockResolvedValue(1),
  lpop: vi.fn().mockResolvedValue(null),
  llen: vi.fn().mockResolvedValue(0),
  pipeline: vi.fn(() => createRedisPipeline()),
  on: vi.fn(),
};

export const notificationQueue = {
  add: vi.fn().mockResolvedValue({
    id: "notification-job",
    opts: { attempts: 5 },
  }),
};
