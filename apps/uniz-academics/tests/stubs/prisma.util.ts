import { vi } from "vitest";

const prisma = {
  academicSemester: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  branchAllocation: {
    findMany: vi.fn(),
  },
  subject: {
    findMany: vi.fn(),
  },
};

export default prisma;
