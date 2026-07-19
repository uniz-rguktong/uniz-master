-- Case-insensitive identity guard for AdminProfile.
-- Deferred from 20260719140000 because prod had a 'webmaster'/'WEBMASTER'
-- collision. That was resolved by consolidating both into a single 'webadmin'
-- account (scripts/ops/consolidate-webadmin-account.sql), so the guard is now
-- safe to enforce.
--
-- NOTE: expression indexes are not expressible in the Prisma schema, so this
-- guard lives only in the migration (already applied in prod via the ops script;
-- migrate deploy records it as a no-op).
CREATE UNIQUE INDEX IF NOT EXISTS "AdminProfile_username_lower_key"
  ON "AdminProfile" (lower(username));
