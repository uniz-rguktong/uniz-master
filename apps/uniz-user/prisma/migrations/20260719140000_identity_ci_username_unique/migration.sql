-- Case-insensitive identity guards for the profile tables.
-- Usernames are stored uppercase (roll numbers / staff ids) and matched
-- case-insensitively across services. These functional unique indexes prevent
-- two profiles that differ only by letter case from coexisting.
--
-- NOTE: expression indexes are not expressible in the Prisma schema, so these
-- guards live only in the migration. Prod applies them via `migrate deploy`;
-- local `prisma db push` will not recreate them (local DBs are disposable).
CREATE UNIQUE INDEX IF NOT EXISTS "StudentProfile_username_lower_key"
  ON "StudentProfile" (lower(username));

CREATE UNIQUE INDEX IF NOT EXISTS "FacultyProfile_username_lower_key"
  ON "FacultyProfile" (lower(username));

-- AdminProfile is intentionally NOT guarded yet: production currently holds two
-- rows that collide case-insensitively ('webmaster' and 'WEBMASTER'), and only
-- 'webmaster' has a matching AuthCredential. Resolving which admin account is
-- canonical is an operator decision, so the guard is deferred to a follow-up
-- migration once the duplicate is cleaned up. Enabling it now would abort the
-- deploy.
-- CREATE UNIQUE INDEX IF NOT EXISTS "AdminProfile_username_lower_key"
--   ON "AdminProfile" (lower(username));
