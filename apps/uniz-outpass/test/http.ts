import { vi } from "vitest";

export function mockRes() {
  const res: any = {
    statusCode: 200,
    headersSent: false,
    body: undefined,
  };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  res.send = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  res.setHeader = vi.fn(() => res);
  res.getHeader = vi.fn(() => undefined);
  return res;
}

export function baseReq(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: "user-1",
      username: "o190001",
      role: "student",
      email: "o190001@rguktong.ac.in",
    },
    body: {},
    params: {},
    query: {},
    headers: { authorization: "Bearer test-token" },
    originalUrl: "/outpass",
    ip: "203.0.113.10",
    ...overrides,
  } as any;
}

export function utcHour(dayOffset: number, hour: number, minute = 0) {
  const d = new Date();
  d.setUTCHours(hour, minute, 0, 0);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d;
}

export function openRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: "req-1",
    studentId: "O190001",
    studentGender: "M",
    isApproved: false,
    isRejected: false,
    isExpired: false,
    currentLevel: "caretaker_male",
    approvalLogs: [] as unknown[],
    issuedTime: new Date().toISOString(),
    checkedOutTime: null,
    checkedInTime: null,
    reason: "Going home",
    requestedTime: new Date("2026-06-01T00:00:00.000Z"),
    ...overrides,
  };
}
