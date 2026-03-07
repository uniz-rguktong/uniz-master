import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sharp from "sharp";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function sanitizeFilename(value: string) {
  return value
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 180);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const urlParam = request.nextUrl.searchParams.get("url");
  // Try to get filename, but we will force extension later if needed
  const filenameParam =
    request.nextUrl.searchParams.get("filename") || "logo_file";

  if (!urlParam) {
    return NextResponse.json({ error: "Missing logo url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(urlParam, request.nextUrl.origin);
  } catch {
    return NextResponse.json({ error: "Invalid logo url" }, { status: 400 });
  }

  if (
    !ALLOWED_PROTOCOLS.has(parsed.protocol) &&
    !urlParam.startsWith("data:")
  ) {
    return NextResponse.json(
      { error: "Unsupported protocol" },
      { status: 400 },
    );
  }

  const isSameOrigin = parsed.origin === request.nextUrl.origin;

  try {
    let buffer: Uint8Array;
    let contentType: string;

    // 1. Fetch the data
    if (urlParam.startsWith("data:")) {
      const matches = urlParam.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3 || !matches[2]) {
        return NextResponse.json(
          { error: "Invalid data URL" },
          { status: 400 },
        );
      }
      contentType = matches[1] || "application/octet-stream";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      const upstream = await fetch(parsed.toString(), {
        method: "GET",
        cache: "no-store" as const,
        ...(isSameOrigin && {
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        }),
      });

      if (!upstream.ok) {
        return NextResponse.json(
          { error: "Failed to fetch logo file" },
          { status: upstream.status },
        );
      }

      const arrayBuffer = await upstream.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
      contentType =
        upstream.headers.get("content-type") || "application/octet-stream";
    }

    // 2. Detect SVG content robustly
    const initialText = new TextDecoder()
      .decode(buffer.slice(0, 1000))
      .toLowerCase();
    const isSvg =
      contentType.includes("svg") ||
      urlParam.toLowerCase().includes(".svg") ||
      filenameParam.toLowerCase().endsWith(".svg") ||
      initialText.includes("<svg") ||
      initialText.includes("<?xml");

    const targetFormat = request.nextUrl.searchParams.get("format");
    let finalBuffer = buffer;
    let finalContentType = contentType;
    let safeName = sanitizeFilename(filenameParam);

    // 3. Process SVG if conversion requested
    if (isSvg && targetFormat === "png") {
      try {
        const pngBuffer = await sharp(Buffer.from(buffer)).png().toBuffer();
        finalBuffer = new Uint8Array(pngBuffer);
        finalContentType = "image/png";

        // CRITICAL: Remove .svg and force .png
        safeName = safeName.replace(/\.svg$/i, "");
        if (!safeName.toLowerCase().endsWith(".png")) {
          safeName += ".png";
        }
        console.log(
          `[BrandingDownload] Converted SVG to PNG. New filename: ${safeName}`,
        );
      } catch (e) {
        console.error("[BrandingDownload] Sharp conversion failed:", e);
        // Fallback: even if conversion fails, try to ensure at least valid SVG type
        finalContentType = "image/svg+xml";
      }
    } else if (isSvg) {
      finalContentType = "image/svg+xml";
    }

    if (finalBuffer.length === 0) {
      return NextResponse.json(
        { error: "Source file is empty" },
        { status: 500 },
      );
    }

    // 4. Return as standard Response with FORCEFUL headers
    return new Response(finalBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": finalContentType,
        "Content-Length": finalBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("branding.download.error", error);
    return NextResponse.json(
      { error: "Failed to download logo file" },
      { status: 500 },
    );
  }
}
