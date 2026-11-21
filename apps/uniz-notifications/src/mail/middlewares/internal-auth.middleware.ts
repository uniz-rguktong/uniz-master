import { Request, Response, NextFunction } from "express";

export const internalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const configured = process.env.INTERNAL_SECRET?.trim() ?? "";
  if (!configured) {
    return res.status(503).json({
      success: false,
      message: "Mail service is not configured",
    });
  }

  const header = req.headers["x-internal-secret"];
  const provided = Array.isArray(header) ? header[0] : header;
  if (!provided || provided.trim() !== configured) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Internal service access only",
    });
  }
  next();
};
