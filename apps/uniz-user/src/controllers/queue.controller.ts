import { Request, Response } from "express";
import { processNextStudentBatch } from "../services/bulk-worker.service";
import axios from "axios";

export const processQueue = async (req: Request, res: Response) => {
  const secret = req.headers["x-internal-secret"];
  const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "uniz-core";

  if (secret !== INTERNAL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await processNextStudentBatch();
    if (!result) {
      return res.status(200).json({ message: "No jobs in student queue" });
    }

    if (result.status === "continued") {
      const port = process.env.PORT || 3002;
      const url = `http://localhost:${port}/api/queue/process`;
      const triggerUrl = `${url}?lb=${Math.random().toString(36).substring(7)}`;

      console.log(
        `[Queue] 🔁 Triggering next Student batch recursively: ${triggerUrl}`,
      );

      // Fire and forget trigger
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
          if (e.code !== "ECONNABORTED") {
            console.error(
              `[Queue] Student Recursive trigger error: ${e.message}`,
            );
          }
        });

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Student Queue Worker Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
