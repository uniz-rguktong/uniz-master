import { Request, Response, NextFunction } from "express";

export const internalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const internalSecret = req.headers["x-internal-secret"];
  const SECRET = (process.env.INTERNAL_SECRET || "uniz-core").trim();

  if (!internalSecret || internalSecret !== SECRET) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Internal service access only",
    });
  }
  next();
};
