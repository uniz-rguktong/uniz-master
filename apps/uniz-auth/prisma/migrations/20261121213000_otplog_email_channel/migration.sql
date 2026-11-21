-- Password-reset codes are email-only. Existing rows were not channel-tagged;
-- default them to email so an in-flight code can still be verified once.
ALTER TABLE "OtpLog" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'email';
