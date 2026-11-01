-- Additive columns for forced password change on first login.
-- Existing rows stay mustChangePassword = false and passwordChangedAt = NULL,
-- so a student who already set their own password is not flagged.
ALTER TABLE "AuthCredential"
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
