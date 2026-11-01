import { vi } from "vitest";

export const redis = {
  get: vi.fn().mockResolvedValue(null),
  getBuffer: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue("OK"),
  setex: vi.fn().mockResolvedValue("OK"),
  del: vi.fn().mockResolvedValue(1),
  incr: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  on: vi.fn(),
};

export const notificationQueue = {
  add: vi.fn().mockResolvedValue({ id: "notification-job" }),
};
