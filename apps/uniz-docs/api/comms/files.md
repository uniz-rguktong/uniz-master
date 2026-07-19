---
title: "Files upload API"
description: "POST /api/v1/files/image/upload — image upload to Cloudflare R2 via user-service (folded from uniz-files)."
---

Upstream: **user-service**.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/files/image/upload` | Multipart image → compressed to WebP (sharp) → **Cloudflare R2** |

Multipart field `image`. Optional `purpose` (`student-profile`, `admin-profile`,
`faculty-profile`, `banner`, `website`) selects the storage key and compression
profile. Profile purposes use a deterministic key per user, so a re-upload
**replaces** the previous image; banners/website get unique keys. The response is
`{ "success": true, "url": "<public R2 URL>" }` — the caller persists that URL.

Requires an authenticated portal session / JWT as implemented on user routes.
Admin-scoped purposes (banner/website/faculty-on-behalf) require an admin role.

Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
`R2_PUBLIC_BASE_URL` (public bucket/CDN base URL, no trailing slash).

Code: `apps/uniz-user/src/routes/files.routes.ts`, `apps/uniz-user/src/utils/r2.util.ts`.

> Note: existing images stored on Cloudinary keep working (URLs are absolute);
> new uploads go to R2. Non-image Excel/CSV backups still use Cloudinary.
