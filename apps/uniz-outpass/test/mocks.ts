import { afterEach, beforeEach, vi } from "vitest";

process.env.TZ = "UTC";
process.env.NODE_ENV = "test";
process.env.INTERNAL_SECRET = "test-internal";
process.env.JWT_SECURITY_KEY = "test-jwt-key";
process.env.DOCKER_ENV = "false";
process.env.GATEWAY_URL = "http://gateway.test/api/v1";
process.env.NOTIFICATION_SERVICE_URL = "http://notify.test/health";
delete process.env.AUTH_SERVICE_URL;
delete process.env.REDIS_URL;

const mocks = vi.hoisted(() => {
  const fn = () => vi.fn();
  const table = () => ({
    updateMany: fn(),
    findFirst: fn(),
    create: fn(),
    findMany: fn(),
    count: fn(),
    findUnique: fn(),
    update: fn(),
    deleteMany: fn(),
  });
  return {
    prisma: { outpass: table(), outing: table() },
    axios: { get: fn(), post: fn(), put: fn() },
    redis: { get: fn(), setex: fn(), on: fn() },
  };
});

vi.mock("../src/utils/prisma", () => ({
  default: mocks.prisma,
  prisma: mocks.prisma,
}));

vi.mock("../src/utils/redis.util", () => ({
  redis: mocks.redis,
}));

vi.mock("axios", () => ({
  default: mocks.axios,
}));

vi.mock("ioredis", () => ({
  default: class Redis {
    on() {
      return this;
    }
    get() {
      return Promise.resolve(null);
    }
    setex() {
      return Promise.resolve("OK");
    }
  },
}));

vi.mock("dotenv", () => ({
  default: { config: () => ({ parsed: {} }) },
  config: () => ({ parsed: {} }),
}));

export const prisma = mocks.prisma;
export const axiosMock = mocks.axios;
export const redisMock = mocks.redis;

export function useCleanMocks() {
  for (const table of [prisma.outpass, prisma.outing]) {
    for (const method of Object.values(table)) {
      method.mockReset();
    }
    table.updateMany.mockResolvedValue({ count: 0 });
    table.findFirst.mockResolvedValue(null);
    table.findMany.mockResolvedValue([]);
    table.findUnique.mockResolvedValue(null);
    table.count.mockResolvedValue(0);
    table.deleteMany.mockResolvedValue({ count: 0 });
    table.create.mockResolvedValue({ id: "created-1" });
    table.update.mockResolvedValue({ id: "updated-1" });
  }

  axiosMock.get.mockReset();
  axiosMock.post.mockReset();
  axiosMock.put.mockReset();
  axiosMock.get.mockResolvedValue({
    data: {
      student: {
        is_in_campus: true,
        has_pending_requests: false,
        gender: "M",
      },
    },
  });
  axiosMock.post.mockResolvedValue({ data: { success: true, students: [] } });
  axiosMock.put.mockResolvedValue({ data: {} });

  redisMock.get.mockReset();
  redisMock.setex.mockReset();
  redisMock.get.mockResolvedValue(null);
  redisMock.setex.mockResolvedValue("OK");
}

const consoleSpies: Array<{ mockRestore: () => void }> = [];

beforeEach(() => {
  consoleSpies.splice(
    0,
    consoleSpies.length,
    vi.spyOn(console, "log").mockImplementation(() => {}),
    vi.spyOn(console, "warn").mockImplementation(() => {}),
    vi.spyOn(console, "error").mockImplementation(() => {}),
  );
  useCleanMocks();
});

afterEach(() => {
  for (const spy of consoleSpies) spy.mockRestore();
  consoleSpies.length = 0;
});
