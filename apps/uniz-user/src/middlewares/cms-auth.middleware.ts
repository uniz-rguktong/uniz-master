import { Request, Response, NextFunction } from "express";

/**
 * Middleware to restrict public CMS APIs to specific origins or valid API Keys.
 * This prevents third-party scrapers or unauthorized apps from using the landing page data.
 */
export const cmsPublicGuard = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-cms-api-key"];
  const clientApiKey = process.env.CMS_PUBLIC_API_KEY || "uniz-landing-v1-key";

  // 1. Check API Key
  if (apiKey === clientApiKey) {
    return next();
  }

  // 2. Check Origin (CORS Origin Matching)
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://uniz.rguktong.in",
    "https://rguktong.in",
    "https://www.rguktong.in",
    "https://uniz.sreecharandesu.in",
    "https://uniz-rgukt.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    return next();
  }

  // 3. Block unauthorized access
  return res.status(401).json({
    success: false,
    message: "Unauthorized access: Invalid API Key or Origin",
  });
};
