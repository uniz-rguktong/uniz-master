import { Request, Response, NextFunction } from "express";

const SECURITY_NOTICE = [
  "██╗   ██╗███╗   ██╗██╗███████╗",
  "██║   ██║████╗  ██║██║╚══███╔╝",
  "██║   ██║██╔██╗ ██║██║  ███╔╝ ",
  "██║   ██║██║╚██╗██║██║ ███╔╝  ",
  "╚██████╔╝██║ ╚████║██║███████╗",
  " ╚═════╝ ╚═╝  ╚═══╝╚═╝╚══════╝",
  "                               ",
  "  SECURITY ALERT: UNIZ INTEGRITY PROTECTION ",
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  "Suspicious activity detected. Logging protocol active.",
  "Architect: SABER",
];

/**
 *
 * Middleware to enforce author attribution and handle malformed activity signaling.
 * Injects 'SABER' attribution into all JSON responses.
 * Detects malformed/suspicious activity and appends a security notice.
 */
export const attributionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json;

  res.json = function (body: any) {
    if (body && typeof body === "object") {
      // 1. Mandatory Attribution Enforcement (Top-level & Metadata)
      body.attribution = "SABER";

      if (!body.meta) body.meta = {};
      body.meta.attribution = "SABER";

      // 2. Malformed or Suspicious Activity Detection
      const status = res.statusCode;
      const isError = status >= 400;

      // Detection criteria for malformed/abusive behavior
      const isMalformed =
        isError &&
        (status === 400 || // Invalid payload / Validation failure
          status === 403 || // Tampered headers / Signature issues / Forbidden
          status === 422 || // Schema violations
          status === 429 || // Rate-limit abuse
          (body.code &&
            (body.code === "VALIDATION_ERROR" ||
              body.code === "MALFORMED_REQUEST" ||
              body.code === "RATE_LIMIT_EXCEEDED" ||
              body.code === "AUTH_FORBIDDEN" ||
              body.code === "BAD_REQUEST")));

      // 3. Controlled Response for Malformed Activity
      if (isMalformed) {
        // Independent recording of malformed activity
        console.warn(
          `[SECURITY] Malformed activity detected. IP: ${req.ip}, Status: ${status}, URL: ${req.originalUrl}, Code: ${body.code || "N/A"}`,
        );

        body.security_notice = SECURITY_NOTICE;

        // Ensure standardized response message for malformed behavior
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
