import type { Browser } from 'puppeteer-core';
import os from 'os';
import fs from 'fs';
import logger from './logger';

// ── Singleton State ──────────────────────────────────────────────
let browser: Browser | null = null;
let launching: Promise<Browser> | null = null;
let launchedAt: number = 0;
let lastUsedAt: number = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectCount: number = 0;
let reconnectWindowStart: number = 0;
let handlersRegistered: boolean = false;

// ── Configuration ────────────────────────────────────────────────
const IDLE_TIMEOUT_MS = parseInt(process.env.PDF_BROWSER_IDLE_TIMEOUT_MS || '300000'); // 5 min
const MAX_RECONNECTS = parseInt(process.env.PDF_MAX_RECONNECTS || '3');
const RECONNECT_WINDOW_MS = 60_000; // 60s window for reconnect limiting

// ── Chrome Discovery ─────────────────────────────────────────────
function findChrome(): string | null {
    const platform = os.platform();
    let paths: string[] = [];

    if (platform === 'win32') {
        paths = [
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            (process.env.LOCALAPPDATA || '') + "\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        ];
    } else if (platform === 'darwin') {
        paths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
            '/Library/Application Support/Google/Chrome/Application/googlechrome',
        ];
    } else if (platform === 'linux') {
        paths = [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
        ];
    }

    for (const p of paths) {
        if (p && fs.existsSync(p)) {
            return p;
        }
    }
    return null;
}

// ── Idle Timer ───────────────────────────────────────────────────
function resetIdleTimer(): void {
    if (idleTimer) clearTimeout(idleTimer);
    lastUsedAt = Date.now();
    idleTimer = setTimeout(async () => {
        if (browser && Date.now() - lastUsedAt >= IDLE_TIMEOUT_MS) {
            logger.info({ idleMs: IDLE_TIMEOUT_MS, uptimeMs: Date.now() - launchedAt }, 'browser.idle.close');
            await closeBrowser();
        }
    }, IDLE_TIMEOUT_MS);
}

// ── Reconnect Rate Limiter ───────────────────────────────────────
function checkReconnectLimit(): boolean {
    const now = Date.now();
    if (now - reconnectWindowStart > RECONNECT_WINDOW_MS) {
        // Reset window
        reconnectCount = 0;
        reconnectWindowStart = now;
    }
    reconnectCount++;
    if (reconnectCount > MAX_RECONNECTS) {
        logger.fatal(
            { reconnectCount, windowMs: RECONNECT_WINDOW_MS },
            'browser.reconnect.limit — too many reconnects, refusing auto-relaunch'
        );
        return false; // Block reconnect
    }
    return true; // Allow reconnect
}

// ── Signal Handlers (registered once) ────────────────────────────
function registerShutdownHandlers(): void {
    if (handlersRegistered) return;
    handlersRegistered = true;

    const shutdown = async (signal: string) => {
        logger.info({ signal, uptimeMs: browser ? Date.now() - launchedAt : 0 }, 'browser.shutdown');
        await closeBrowser();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Get the shared browser instance. Launches Chrome on first call,
 * reuses the same process for all subsequent calls. Thread-safe:
 * concurrent callers share a single launch promise.
 */
export async function getBrowser(): Promise<Browser> {
    // Fast path: return existing connected browser
    if (browser && browser.connected) {
        resetIdleTimer();
        return browser;
    }

    // Deduplicate concurrent launch requests — only one launch() runs
    if (launching) return launching;

    launching = (async () => {
        try {
            // Reconnect rate-limiting
            if (reconnectCount > 0 && !checkReconnectLimit()) {
                throw new Error(
                    `Chrome reconnect limit exceeded (${MAX_RECONNECTS} in ${RECONNECT_WINDOW_MS / 1000}s). Manual restart required.`
                );
            }

            const executablePath = findChrome();
            if (!executablePath) {
                throw new Error('Could not find a valid Chrome or Edge installation.');
            }

            const startMs = performance.now();
            const puppeteer = (await import('puppeteer-core')).default;

            const instance = await puppeteer.launch({
                executablePath,
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-extensions',
                    '--disable-background-networking',
                    '--disable-default-apps',
                    '--disable-sync',
                    '--disable-translate',
                    '--metrics-recording-only',
                    '--mute-audio',
                    '--no-default-browser-check',
                    '--safebrowsing-disable-auto-update',
                ],
            });

            const pid = instance.process()?.pid ?? null;
            const launchMs = Math.round(performance.now() - startMs);

            logger.info({ pid, executablePath, launchMs }, 'browser.launch');

            // Auto-nullify on disconnect for crash recovery
            instance.on('disconnected', () => {
                const uptimeMs = Date.now() - launchedAt;
                logger.warn({ pid, uptimeMs, reconnectCount }, 'browser.disconnect');
                browser = null;
                launching = null;
                if (idleTimer) {
                    clearTimeout(idleTimer);
                    idleTimer = null;
                }
            });

            browser = instance;
            launchedAt = Date.now();
            resetIdleTimer();
            registerShutdownHandlers();

            return instance;
        } catch (err) {
            // Clear the launching promise so next caller retries
            launching = null;
            throw err;
        }
    })();

    // Clear the launching promise once resolved (success or failure handled above)
    launching.then(() => { launching = null; }).catch(() => { launching = null; });

    return launching;
}

/**
 * Gracefully close the browser and free all resources.
 */
export async function closeBrowser(): Promise<void> {
    if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
    }
    if (browser) {
        try {
            await browser.close();
        } catch (err) {
            logger.error({ err }, 'browser.close.error');
        }
        browser = null;
        launching = null;
    }
}

/**
 * Health check — returns current browser state for monitoring.
 */
export function getBrowserHealth(): {
    connected: boolean;
    pid: number | null;
    pageCount: number | null;
    uptimeMs: number;
    lastUsedMs: number;
    reconnects: number;
    idleTimeoutMs: number;
} {
    return {
        connected: browser?.connected ?? false,
        pid: browser?.process()?.pid ?? null,
        pageCount: null, // Populated async — use getBrowserHealthAsync() for full data
        uptimeMs: browser ? Date.now() - launchedAt : 0,
        lastUsedMs: lastUsedAt ? Date.now() - lastUsedAt : 0,
        reconnects: reconnectCount,
        idleTimeoutMs: IDLE_TIMEOUT_MS,
    };
}

/**
 * Async health check — includes page count from browser.
 */
export async function getBrowserHealthAsync(): Promise<{
    connected: boolean;
    pid: number | null;
    pageCount: number;
    uptimeMs: number;
    lastUsedMs: number;
    reconnects: number;
    idleTimeoutMs: number;
}> {
    let pageCount = 0;
    if (browser && browser.connected) {
        try {
            const pages = await browser.pages();
            pageCount = pages.length;
        } catch { /* browser may have disconnected */ }
    }

    return {
        connected: browser?.connected ?? false,
        pid: browser?.process()?.pid ?? null,
        pageCount,
        uptimeMs: browser ? Date.now() - launchedAt : 0,
        lastUsedMs: lastUsedAt ? Date.now() - lastUsedAt : 0,
        reconnects: reconnectCount,
        idleTimeoutMs: IDLE_TIMEOUT_MS,
    };
}
