-- Role rename Stage 4: make 'webadmin' the default for new AdminProfile rows.
-- Existing rows were already flipped webmaster -> webadmin in the DB (Stage 2).
-- Idempotent: SET DEFAULT is safe to re-run.
ALTER TABLE "AdminProfile" ALTER COLUMN "role" SET DEFAULT 'webadmin';
