import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { redis } from "../utils/redis.util";
import {
  CMS_PUBLIC_CACHE_TTL_SEC,
  publicBannersCacheKey,
  publicNotificationsCacheKey,
} from "../utils/cms-cache.util";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { UserRole } from "../shared/roles.enum";
import { ErrorCode } from "../shared/error-codes";

/**
 * PUBLIC ENDPOINTS
 */

// Consolidated public banners
export const getPublicBanners = async (req: Request, res: Response) => {
  try {
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=60");

    const cacheKey = publicBannersCacheKey();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const banners = await prisma.banner.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: "desc" },
    });
    const payload = { success: true, banners };
    await redis.setex(
      cacheKey,
      CMS_PUBLIC_CACHE_TTL_SEC,
      JSON.stringify(payload),
    );
    return res.json(payload);
  } catch (e) {
    console.error("[CMS-Public-Error] Failed to fetch banners:", e);
    // Fail-safe: Return empty array so landing page doesn't crash
    return res.json({ success: true, banners: [] });
  }
};

// Consolidated notifications (Updates only, Tenders removed)
export const getPublicNotifications = async (req: Request, res: Response) => {
  try {
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=60");

    const cacheKey = publicNotificationsCacheKey();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const updates = await prisma.publicNotification.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: "desc" },
    });

    const payload = {
      success: true,
      notifications: { updates, tenders: [] },
    };
    await redis.setex(
      cacheKey,
      CMS_PUBLIC_CACHE_TTL_SEC,
      JSON.stringify(payload),
    );
    return res.json(payload);
  } catch (e) {
    console.error("[CMS-Public-Error] Failed to fetch notifications:", e);
    // Fail-safe: Return empty structure
    return res.json({
      success: true,
      notifications: { updates: [], tenders: [] },
    });
  }
};

/**
 * ADMIN ENDPOINTS (Restricted via RBAC)
 */

const CMS_ALLOWED_ROLES = [UserRole.WEBMASTER, UserRole.DEAN, UserRole.DIRECTOR];

function hasCmsAccess(role?: string): boolean {
  return !!role && CMS_ALLOWED_ROLES.includes(role as UserRole);
}

// Banners
export const getAdminBanners = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!hasCmsAccess(req.user?.role))
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, banners });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

export const createBanner = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!hasCmsAccess(req.user?.role))
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  const { title, text, imageUrl, isVisible } = req.body;
  try {
    const banner = await prisma.banner.create({
      data: { title, text, imageUrl, isVisible: isVisible ?? true },
    });
    return res.json({ success: true, banner });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

export const updateBanner = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!hasCmsAccess(req.user?.role))
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  const { id } = req.params;
  try {
    const banner = await prisma.banner.update({
      where: { id },
      data: req.body,
    });
    return res.json({ success: true, banner });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

export const deleteBanner = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!hasCmsAccess(req.user?.role))
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  const { id } = req.params;
  try {
    await prisma.banner.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

// Notifications (Updates)
// Notifications (Updates)
export const createUpdate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!hasCmsAccess(req.user?.role))
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  const { title, content, link, isVisible } = req.body;
  try {
    const update = await prisma.publicNotification.create({
      data: { title, content, link, isVisible: isVisible ?? true },
    });
    return res.json({ success: true, update });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

export const updateUpdate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!hasCmsAccess(req.user?.role))
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  const { id } = req.params;
  try {
    const update = await prisma.publicNotification.update({
      where: { id },
      data: req.body,
    });
    return res.json({ success: true, update });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

export const deleteUpdate = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!hasCmsAccess(req.user?.role))
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  const { id } = req.params;
  try {
    await prisma.publicNotification.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

// Tenders
export const createTender = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!hasCmsAccess(req.user?.role))
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  const { title, description, pdfUrl, deadline, isVisible } = req.body;
  try {
    const tender = await prisma.tender.create({
      data: {
        title,
        description,
        pdfUrl,
        deadline: deadline ? new Date(deadline) : null,
        isVisible: isVisible ?? true,
      },
    });
    return res.json({ success: true, tender });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};

// Toggle Visibility (Generic for any CMS item)
export const toggleVisibility = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (!hasCmsAccess(req.user?.role))
    return res.status(403).json({ code: ErrorCode.AUTH_FORBIDDEN });
  const { type, id } = req.params;
  const { isVisible } = req.body;

  try {
    let updated;
    if (type === "banner") {
      updated = await prisma.banner.update({
        where: { id },
        data: { isVisible },
      });
    } else if (type === "update") {
      updated = await prisma.publicNotification.update({
        where: { id },
        data: { isVisible },
      });
    } else if (type === "tender") {
      updated = await prisma.tender.update({
        where: { id },
        data: { isVisible },
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    return res.json({ success: true, data: updated });
  } catch (e) {
    return res.status(500).json({ success: false });
  }
};
