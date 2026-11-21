export interface RateLimiter {
  allow(key: string, now?: number): boolean;
}

export function createRateLimiter(opts: { windowMs: number; max: number }): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    allow(key, now = Date.now()) {
      const start = now - opts.windowMs;
      const prev = (hits.get(key) ?? []).filter((stamp) => stamp > start);
      if (prev.length >= opts.max) {
        hits.set(key, prev);
        return false;
      }
      prev.push(now);
      hits.set(key, prev);
      return true;
    },
  };
}
