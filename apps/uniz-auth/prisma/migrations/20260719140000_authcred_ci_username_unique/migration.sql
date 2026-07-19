-- Case-insensitive identity guard for AuthCredential.
-- Usernames are stored uppercase (roll numbers) and matched case-insensitively
-- across services. A plain @unique(username) still allows "O21CS001" and
-- "o21cs001" to coexist as two logins for one person; this functional unique
-- index closes that gap at the database level.
--
-- NOTE: expression indexes are not expressible in the Prisma schema, so this
-- guard lives only in the migration. Prod applies it via `migrate deploy`;
-- local `prisma db push` will not recreate it (local DBs are disposable).
CREATE UNIQUE INDEX IF NOT EXISTS "AuthCredential_username_lower_key"
  ON "AuthCredential" (lower(username));
