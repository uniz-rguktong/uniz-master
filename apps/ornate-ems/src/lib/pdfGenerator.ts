import type { Page } from "puppeteer-core";
import path from "path";
import fs from "fs";
import { getBrowser } from "./browserManager";
import { pdfSemaphore } from "./pdfSemaphore";
import logger from "./logger";

// ── Configuration ────────────────────────────────────────────────
const RENDER_TIMEOUT_MS = parseInt(
  process.env.PDF_RENDER_TIMEOUT_MS || "30000",
);

/**
 * Generate a PDF from HTML content.
 *
 * Architecture:
 * - Uses a shared browser singleton (browserManager.ts) — no per-request Chrome launch
 * - Concurrency controlled by semaphore (pdfSemaphore.ts) — caps memory usage
 * - Guaranteed page.close() in finally — no zombie pages
 * - Hard render timeout — hung tabs don't block slots forever
 *
 * Signature is unchanged from the original — all 4 call sites work without modification.
 */
export async function generatePdf(htmlContent: string): Promise<Buffer> {
  const startMs = performance.now();
  const release = await pdfSemaphore.acquire();
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Render with hard timeout — prevent hung Chrome tabs from blocking slots
    const pdfBuffer = await Promise.race([
      renderPage(page, htmlContent),
      rejectAfter(RENDER_TIMEOUT_MS, "PDF render timeout"),
    ]);

    const durationMs = Math.round(performance.now() - startMs);
    const sizeBytes = pdfBuffer.length;
    logger.info({ durationMs, sizeBytes }, "pdf.render.complete");

    return pdfBuffer;
  } catch (error) {
    const durationMs = Math.round(performance.now() - startMs);
    logger.error({ err: error, durationMs }, "pdf.render.error");
    throw error;
  } finally {
    // Guaranteed page cleanup — prevents zombie pages
    if (page) {
      await page.close().catch((err) => {
        logger.warn({ err }, "pdf.page.close.error");
      });
    }
    release();
  }
}

/**
 * Core render logic — isolated for timeout wrapping.
 */
async function renderPage(page: Page, htmlContent: string): Promise<Buffer> {
  await page.setContent(htmlContent, {
    waitUntil: ["networkidle0", "load", "domcontentloaded"],
    timeout: RENDER_TIMEOUT_MS,
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    landscape: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  return Buffer.from(pdfBuffer);
}

/**
 * Timeout helper — rejects after the specified duration.
 */
function rejectAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${message} after ${ms}ms`)), ms);
  });
}

/**
 * Embed local images in HTML content as base64 data URIs.
 * Matches relative paths (./  ../  /) with image extensions.
 */
export function embedLocalImages(htmlContent: string): string {
  return htmlContent.replace(
    /src="((?:\.\/|\.\.\/|\/)[^"]+\.(png|jpg|jpeg|gif|svg|webp))"/gi,
    (match: string, imgPath: string, ext: string) => {
      try {
        const absolutePath = path.resolve(process.cwd(), imgPath);
        if (fs.existsSync(absolutePath)) {
          const imageBuffer = fs.readFileSync(absolutePath);
          const base64 = imageBuffer.toString("base64");
          const mimeType =
            ext === "svg"
              ? "image/svg+xml"
              : `image/${ext === "jpg" ? "jpeg" : ext}`;
          return `src="data:${mimeType};base64,${base64}"`;
        }
      } catch (error: any) {
        logger.warn(
          { imgPath, err: error.message },
          "embedLocalImages: failed to embed image",
        );
      }
      return match;
    },
  );
}
