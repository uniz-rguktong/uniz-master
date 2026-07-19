-- Domain guard for Registration.status.
-- Application only ever writes 'REGISTERED' or 'DROPPED' (see analytics.routes
-- and semester-registration-import.service). This CHECK enforces that domain at
-- the database level so a bad write can never introduce a third, silently
-- unhandled state. Added NOT VALID first + VALIDATE to avoid a long lock, then
-- guaranteed valid because all existing rows are 'REGISTERED'.
--
-- NOTE: CHECK constraints are not expressible in the Prisma schema, so this
-- guard lives only in the migration. Prod applies it via `migrate deploy`;
-- local `prisma db push` will not recreate it (local DBs are disposable).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Registration_status_check'
  ) THEN
    ALTER TABLE "Registration"
      ADD CONSTRAINT "Registration_status_check"
      CHECK (status IN ('REGISTERED', 'DROPPED')) NOT VALID;
    ALTER TABLE "Registration" VALIDATE CONSTRAINT "Registration_status_check";
  END IF;
END $$;
