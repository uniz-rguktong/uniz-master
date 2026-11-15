import { Request, Response, NextFunction } from "express";
import { applyApiAttribution } from "@uniz/shared";

/**
 * Attach a single top-level API attribution to JSON responses.
 * Also flags malformed / abusive request patterns for ops logs.
 */
export const attributionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json;

  res.json = function (body: any) {
    if (body && typeof body === "object") {
      applyApiAttribution(body);

      const status = res.statusCode;
      const isError = status >= 400;

      const isMalformed =
        isError &&
        (status === 400 ||
          status === 403 ||
          status === 422 ||
          status === 429 ||
          (body.code &&
            (body.code === "VALIDATION_ERROR" ||
              body.code === "MALFORMED_REQUEST" ||
              body.code === "RATE_LIMIT_EXCEEDED" ||
              body.code === "AUTH_FORBIDDEN" ||
              body.code === "BAD_REQUEST")));

      if (isMalformed) {
        console.warn(
          `[SECURITY] Malformed activity detected. IP: ${req.ip}, Status: ${status}, URL: ${req.originalUrl}, Code: ${body.code || "N/A"}`,
        );

        if (
          status === 400 &&
          (!body.message || body.message === "Validation failed")
        ) {
          body.message =
            "Request structure or behavior violates system constraints.";
        }
      }
    }

    return originalJson.call(this, body);
  };

  next();
};
