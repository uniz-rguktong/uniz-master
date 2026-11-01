import { vi } from "vitest";

export default class Redis {
  static instances: Redis[] = [];

  get = vi.fn().mockResolvedValue(null);
  set = vi.fn().mockResolvedValue("OK");
  on = vi.fn().mockReturnThis();

  constructor(..._args: unknown[]) {
    Redis.instances.push(this);
  }
}
