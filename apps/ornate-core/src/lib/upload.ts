/**
 * Upload a file to Cloudflare R2 via the server-side multipart proxy.
 */
export const uploadFileToR2 = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (uploadRes.ok) {
      const { publicUrl } = (await uploadRes.json()) as { publicUrl: string };
      return publicUrl;
    }

    const contentType = uploadRes.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errorData = (await uploadRes.json()) as { error?: string };
      throw new Error(errorData.error || "Upload failed");
    }

    const errorText = await uploadRes.text();
    throw new Error(errorText || "Upload failed");
  } catch (error: any) {
    console.error("R2 Upload Error:", error);
    return null;
  }
};
