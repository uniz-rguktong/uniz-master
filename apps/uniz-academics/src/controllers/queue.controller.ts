import { Request, Response } from "express";
import { processNextBatch } from "../services/upload.service";
import axios from "axios";

export const processQueue = async (req: Request, res: Response) => {
  const secret = req.headers["x-internal-secret"];
  const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";

  const receivedSecret = Array.isArray(secret) ? secret[0] : secret;

  if (receivedSecret !== INTERNAL_SECRET) {
    console.warn(
      `[Queue] Unauthorized trigger attempt. Received length: ${receivedSecret ? receivedSecret.length : 0}, Expected length: ${INTERNAL_SECRET.length}`,
    );
    console.warn(
      `[Queue] Received starts with: ${receivedSecret ? receivedSecret.substring(0, 3) : "NULL"}`,
    );
    console.warn(
      `[Queue] Expected starts with: ${INTERNAL_SECRET.substring(0, 3)}`,
    );
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await processNextBatch();
    if (!result) {
      return res.status(200).json({ message: "No jobs in queue" });
    }

    // CRITICAL: Trigger next batch BEFORE sending response
    // Otherwise Vercel terminates the function immediately after res.json()
    if (result.status === "continued") {
      const port = process.env.PORT || 3004;
      const url = `http://localhost:${port}/api/academics/queue/process`;

      // Loop Buster: Add random param to avoid 508 Loop Detected
      const triggerUrl = `${url}?lb=${Math.random().toString(36).substring(7)}`;
      console.log(
        `[Queue] 🔁 Triggering next batch recursively: ${triggerUrl}`,
      );

      // Fire and forget to avoid HTTP recursion depth limits (508 Loop Detected)
      // and to free up this worker's Redis connection faster.
      axios
        .post(
          triggerUrl,
          {},
          {
            headers: { "x-internal-secret": INTERNAL_SECRET },
            timeout: 5000,
          },
        )
        .catch((e) => {
          // Only log if it's not a timeout (timeouts are expected if we don't wait)
          if (e.code !== "ECONNABORTED") {
            console.error(`[Queue] ❌ Recursive trigger error: ${e.message}`);
          }
        });

      // Increased delay to ensure request is dispatched and proxy "rests"
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`[Queue]  Next batch dispatched.`);
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Queue Worker Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
