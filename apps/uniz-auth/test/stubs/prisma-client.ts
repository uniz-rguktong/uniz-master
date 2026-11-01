type QueryEvent = { duration: number; query: string };

const bucket = globalThis as {
  __unizAuthPrismaConstructed?: Array<{
    opts?: unknown;
    listeners: Record<string, (ev: QueryEvent) => void>;
  }>;
};

bucket.__unizAuthPrismaConstructed ??= [];

export const constructed = bucket.__unizAuthPrismaConstructed;

export class PrismaClient {
  opts?: unknown;
  listeners: Record<string, (ev: QueryEvent) => void> = {};

  constructor(opts?: unknown) {
    this.opts = opts;
    constructed.push(this);
  }

  $on(event: string, cb: (ev: QueryEvent) => void) {
    this.listeners[event] = cb;
  }
}
