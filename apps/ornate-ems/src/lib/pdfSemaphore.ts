import logger from './logger';

// ── Configuration ────────────────────────────────────────────────
const MAX_CONCURRENT = parseInt(process.env.PDF_MAX_CONCURRENT || '3');
const DEFAULT_TIMEOUT_MS = parseInt(process.env.PDF_SEMAPHORE_TIMEOUT_MS || '30000');

// ── Types ────────────────────────────────────────────────────────
interface QueueEntry {
    resolve: (release: () => void) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout> | null;
    enqueuedAt: number;
}

// ── Semaphore ────────────────────────────────────────────────────
class PdfSemaphore {
    private active: number = 0;
    private readonly maxConcurrent: number;
    private readonly queue: QueueEntry[] = [];

    constructor(maxConcurrent: number) {
        this.maxConcurrent = maxConcurrent;
    }

    /**
     * Acquire a render slot. Returns a release function.
     * If all slots are busy, the caller is queued.
     * If the timeout expires before a slot opens, rejects with an error.
     */
    acquire(timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<() => void> {
        // Fast path: slot available
        if (this.active < this.maxConcurrent) {
            this.active++;
            logger.debug(
                { active: this.active, queued: this.queue.length, max: this.maxConcurrent },
                'semaphore.acquire'
            );
            return Promise.resolve(this.createRelease());
        }

        // Slow path: queue the caller
        return new Promise<() => void>((resolve, reject) => {
            const entry: QueueEntry = {
                resolve,
                reject,
                timer: null,
                enqueuedAt: Date.now(),
            };

            // Timeout: reject if slot doesn't open in time
            if (timeoutMs > 0) {
                entry.timer = setTimeout(() => {
                    const idx = this.queue.indexOf(entry);
                    if (idx !== -1) {
                        this.queue.splice(idx, 1);
                        logger.warn(
                            { waitedMs: timeoutMs, queueLength: this.queue.length },
                            'semaphore.timeout'
                        );
                        reject(new Error(
                            `PDF render queue timeout: waited ${timeoutMs}ms. ` +
                            `${this.active} active renders, ${this.queue.length} still queued.`
                        ));
                    }
                }, timeoutMs);
            }

            this.queue.push(entry);
            logger.debug(
                { active: this.active, queued: this.queue.length, max: this.maxConcurrent },
                'semaphore.queued'
            );
        });
    }

    /**
     * Creates a release function that frees one slot and processes the next queued item.
     */
    private createRelease(): () => void {
        let released = false;
        return () => {
            if (released) return; // Idempotent — safe to call twice
            released = true;
            this.active--;

            logger.debug(
                { active: this.active, queued: this.queue.length },
                'semaphore.release'
            );

            // Process next queued request
            if (this.queue.length > 0) {
                const next = this.queue.shift()!;
                if (next.timer) clearTimeout(next.timer);
                this.active++;
                next.resolve(this.createRelease());
            }
        };
    }

    /**
     * Current semaphore stats for monitoring/health checks.
     */
    getStats(): { active: number; queued: number; maxConcurrent: number } {
        return {
            active: this.active,
            queued: this.queue.length,
            maxConcurrent: this.maxConcurrent,
        };
    }
}

// ── Module Singleton ─────────────────────────────────────────────
export const pdfSemaphore = new PdfSemaphore(MAX_CONCURRENT);
