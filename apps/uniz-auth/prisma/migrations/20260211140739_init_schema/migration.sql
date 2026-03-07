-- CreateTable
CREATE TABLE "AuthCredential" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AuthCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpLog" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "OtpLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthCredential_username_key" ON "AuthCredential"("username");
