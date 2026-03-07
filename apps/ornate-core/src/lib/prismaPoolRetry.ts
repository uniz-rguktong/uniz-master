import logger from "@/lib/logger";

const POOL_TIMEOUT_PATTERN =
  /timed out fetching a new connection from the connection pool/i;

function isPoolTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return POOL_TIMEOUT_PATTERN.test(error.message);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withPrismaPoolRetry<T>(
  operation: () => Promise<T>,
  options?: { label?: string; maxAttempts?: number; backoffMs?: number[] },
): Promise<T> {
  const label = options?.label || "prisma-operation";
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 3);
  const backoffMs = options?.backoffMs ?? [150, 350, 700];

  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      return await operation();
    } catch (error) {
      const retryable = isPoolTimeoutError(error);
      if (!retryable || attempt >= maxAttempts) {
        throw error;
      }

      const delay =
        backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 300;
      logger.warn(
        { label, attempt, maxAttempts, delay },
        "Retrying Prisma operation after connection pool timeout",
      );
      await wait(delay);
    }
  }

  throw new Error("Unexpected Prisma retry flow state");
}
