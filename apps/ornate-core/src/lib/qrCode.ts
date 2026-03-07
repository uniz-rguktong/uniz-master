import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL (Base64)
 */
export async function generateQRCode(text: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error("Error generating QR code", err);
    return null;
  }
}

/**
 * Generate a QR code as a Buffer
 */
export async function generateQRCodeBuffer(
  text: string,
): Promise<Buffer | null> {
  try {
    return await QRCode.toBuffer(text);
  } catch (err) {
    console.error("Error generating QR code buffer", err);
    return null;
  }
}

/**
 * Saves a QR code to a specific file path.
 */
export async function saveQRCodeToFile(
  text: string,
  filePath: string,
): Promise<void> {
  try {
    await QRCode.toFile(filePath, text);
  } catch (err) {
    console.error("Error saving QR code to file:", err);
    throw err;
  }
}
