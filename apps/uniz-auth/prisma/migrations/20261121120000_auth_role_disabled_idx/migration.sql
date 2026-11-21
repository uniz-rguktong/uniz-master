-- Webadmin overview summary aggregates accounts with
--   SELECT role, COUNT(*) FILTER (WHERE "isDisabled" = ...) GROUP BY role
-- from uniz_auth."AuthCredential". The composite serves that group.
CREATE INDEX IF NOT EXISTS "AuthCredential_role_isDisabled_idx"
  ON "AuthCredential" ("role", "isDisabled");
