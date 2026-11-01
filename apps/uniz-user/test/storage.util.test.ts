import { mkdir, readFile, rm } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  compressToWebp,
  isStorageConfigured,
  saveImage,
  uploadsDir,
} from "../src/utils/storage.util";

describe("storage.util", () => {
  const dir = uploadsDir();

  beforeAll(async () => {
    await mkdir(dir, { recursive: true });
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("reports local disk as configured", () => {
    expect(isStorageConfigured()).toBe(true);
    expect(uploadsDir()).toBe(process.env.UPLOADS_DIR);
  });

  it("compresses an image to webp within the requested bounds", async () => {
    const png = await sharp({
      create: {
        width: 20,
        height: 10,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const webp = await compressToWebp(png, {
      maxWidth: 8,
      maxHeight: 8,
      quality: 40,
    });
    const meta = await sharp(webp).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBeLessThanOrEqual(8);
    expect(meta.height).toBeLessThanOrEqual(8);
  });

  it("writes a normalized key and returns a cache-busted public url", async () => {
    const url = await saveImage("profiles/student/o240001.webp", Buffer.from("webp"));
    expect(url.startsWith("http://uploads.test/files/img/profiles/student/o240001.webp?v=")).toBe(
      true,
    );
    const stored = await readFile(
      path.join(dir, "profiles/student/o240001.webp"),
    );
    expect(stored.toString()).toBe("webp");
  });

  it("rejects an absolute key and keeps a relative traversal inside uploads", async () => {
    await expect(saveImage("/etc/passwd", Buffer.from("no"))).rejects.toThrow(
      "Invalid storage key",
    );

    const url = await saveImage("../profiles/ok.webp", Buffer.from("ok"));
    expect(url).toContain("/profiles/ok.webp?v=");
    const stored = await readFile(path.join(dir, "profiles/ok.webp"));
    expect(stored.toString()).toBe("ok");
  });
});
