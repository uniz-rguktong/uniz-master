-- Remove duplicated models from uniz-outpass. Both were empty (0 rows) in prod.
-- AuthCredential is owned solely by uniz-auth; Grievance moved to uniz-user.
DROP TABLE IF EXISTS "AuthCredential" CASCADE;
DROP TABLE IF EXISTS "Grievance" CASCADE;
