-- Role rename Stage 2: flip the DB role string 'webmaster' -> 'webadmin'.
--
-- Safe to run only AFTER both accept-both stages are live in production:
--   Stage 1 (backend, aliasWebadminRole) and Stage B (portal accepts both).
-- Login builds the JWT from AuthCredential.role, so flipping these rows makes
-- new logins issue role='webadmin'. Backend + portal both normalize it, and
-- old 'webmaster' JWTs (<=7d) keep working, so there is no lockout window.
--
-- Rows affected (verified pre-flight):
--   uniz_auth.AuthCredential : coe, webadmin
--   uniz_user.AdminProfile   : internal-service, webadmin
--   uniz_user.FacultyProfile : coe
--
-- Idempotent + atomic. Run against uniz_db (all schemas live there).
BEGIN;

UPDATE uniz_auth."AuthCredential"
   SET role = 'webadmin'
 WHERE role = 'webmaster';

UPDATE uniz_user."AdminProfile"
   SET role = 'webadmin'
 WHERE role = 'webmaster';

UPDATE uniz_user."FacultyProfile"
   SET role = 'webadmin'
 WHERE role = 'webmaster';

COMMIT;
