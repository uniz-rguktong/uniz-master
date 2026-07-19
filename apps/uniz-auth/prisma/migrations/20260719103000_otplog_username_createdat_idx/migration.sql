-- OTP lookups filter by username + order by createdAt desc. usernames are
-- stored already-normalized, so this composite index serves the hot query.
CREATE INDEX IF NOT EXISTS "OtpLog_username_createdAt_idx" ON "OtpLog" ("username", "createdAt");
