---
title: "Files upload API"
description: "POST /api/v1/files/image/upload — self-hosted image upload via user-service (folded from uniz-files)."
---

Upstream: **user-service**.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/files/image/upload` | Multipart image → compressed to WebP (sharp) → **VPS disk** |
| GET | `/files/img/<key>` | Public, CDN-cached serving of a stored image |

Multipart field `image`. Optional `purpose` (`student-profile`, `admin-profile`,
`faculty-profile`, `banner`, `website`) selects the storage key and compression
profile. Profile purposes use a deterministic key per user, so a re-upload
**replaces** the previous image; banners/website get unique keys. The response is
`{ "success": true, "url": "<public URL>" }` — the caller persists that URL.

Images are stored on a persistent volume on the VPS (`UPLOADS_DIR`, default
`/data/uploads`) and served back through the gateway at `/api/v1/files/img/*`
with long, immutable cache headers so Cloudflare's CDN caches them. The `?v=<ts>`
query on returned URLs busts the cache when a profile image is replaced.

Requires an authenticated portal session / JWT as implemented on user routes.
Admin-scoped purposes (banner/website/faculty-on-behalf) require an admin role.

Env: `UPLOADS_DIR` (server storage path), `PUBLIC_UPLOADS_BASE_URL` (optional
override; defaults to `GATEWAY_URL` + `/files/img`). No object-storage keys.

Code: `apps/uniz-user/src/routes/files.routes.ts`, `apps/uniz-user/src/utils/storage.util.ts`.

> Note: existing images referenced by absolute Cloudinary URLs keep working; new
> uploads are self-hosted. Non-image Excel/CSV backups still use Cloudinary.
