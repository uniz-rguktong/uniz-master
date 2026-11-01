import { vi } from "vitest";

export class Queue {
  add = vi.fn().mockResolvedValue({ id: "job-1" });

  constructor(
    public name: string,
    public opts?: unknown,
  ) {}
}

export class Worker {
  handlers = new Map<string, (...args: any[]) => unknown>();
  on = vi.fn((event: string, handler: (...args: any[]) => unknown) => {
    this.handlers.set(event, handler);
    return this;
  });

  constructor(
    public name: string,
    public processor: (job: { id?: string; data: any }) => Promise<unknown>,
    public opts?: unknown,
  ) {}
}
