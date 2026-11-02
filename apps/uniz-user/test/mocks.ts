import { vi } from "vitest";

const bag = vi.hoisted(() => {
  const redisMock: Record<string, any> = {
    on: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    setex: vi.fn(),
    lpop: vi.fn(),
    llen: vi.fn(),
    rpush: vi.fn(),
    scan: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  };

  redisMock.multi = () => {
    const queued: Array<() => Promise<unknown>> = [];
    const chain: Record<string, any> = {
      incr: (key: string) => {
        queued.push(async () => redisMock.incr(key));
        return chain;
      },
      expire: (key: string, ttl: number) => {
        queued.push(async () => redisMock.expire(key, ttl));
        return chain;
      },
      exec: async () => {
        const out: Array<[null, unknown]> = [];
        for (const fn of queued) out.push([null, await fn()]);
        return out;
      },
    };
    return chain;
  };

  const model = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    createMany: vi.fn(),
    updateMany: vi.fn(),
  });

  const prismaMock = {
    studentProfile: model(),
    facultyProfile: model(),
    leaveRequest: model(),
    leaveBalance: model(),
    dutyAssignment: model(),
    feeStructure: model(),
    feeInvoice: model(),
    payment: model(),
    book: model(),
    bookCopy: model(),
    loan: model(),
    libraryFine: model(),
    adminProfile: model(),
    grievance: model(),
    banner: model(),
    publicNotification: model(),
    tender: model(),
    uploadHistory: model(),
  };

  const axiosMock = {
    get: vi.fn(),
    post: vi.fn(),
  };

  return { redisMock, prismaMock, axiosMock };
});

export const redisMock = bag.redisMock;
export const prismaMock = bag.prismaMock;
export const axiosMock = bag.axiosMock;

vi.mock("dotenv", () => ({
  default: { config: vi.fn(() => ({ parsed: {} })) },
  config: vi.fn(() => ({ parsed: {} })),
}));

vi.mock("ioredis", () => {
  function Redis() {
    return bag.redisMock;
  }
  return { default: Redis };
});

vi.mock("../src/utils/prisma", () => ({
  prisma: bag.prismaMock,
  default: bag.prismaMock,
}));

vi.mock("axios", () => ({
  default: bag.axiosMock,
}));
