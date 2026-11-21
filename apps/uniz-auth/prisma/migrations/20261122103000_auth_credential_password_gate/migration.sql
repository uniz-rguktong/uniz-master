-- Login revamp. Outstanding JWTs carry tokenVersion; a bump signs every
-- session out. mustChangePassword blocks the API until the issued password
-- is replaced. realEmail is the mailbox for OTP and delivery, separate from
-- the login username.
ALTER TABLE "AuthCredential"
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "realEmail" TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS "AuthCredential_realEmail_idx"
  ON "AuthCredential" ("realEmail");
