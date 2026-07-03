-- CreateTable
CREATE TABLE "NotificationInbox" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERIC',
    "path" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationInbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationInbox_username_createdAt_idx" ON "NotificationInbox"("username", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "NotificationInbox_username_readAt_idx" ON "NotificationInbox"("username", "readAt");
