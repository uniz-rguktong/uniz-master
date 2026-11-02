-- Additive only: information centre items (circulars, calendars, downloads, forms).
CREATE TABLE IF NOT EXISTS "InfoItem" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "eventDate" TIMESTAMP(3),
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InfoItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InfoItem_category_idx" ON "InfoItem"("category");
