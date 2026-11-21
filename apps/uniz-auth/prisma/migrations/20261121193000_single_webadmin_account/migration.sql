-- AuthCredential has no email, designation, or previous-role column.
-- The only webadmin credential is the exact username webadmin
-- (institutional mailbox webadmin@rguktong.ac.in). The mailbox string
-- itself is not a second username. passwordHash is not read or written.
-- Accounts are not deleted.
--
-- The July role flip (scripts/ops/rename-role-webmaster-to-webadmin.sql)
-- stored webadmin on the coe login as well as webadmin. Demotion order:
-- 1. Username webadmin stays webadmin.
-- 2. If lower(trim(username)) is itself a known staff role, restore it.
--    coe, dean, director, hod, ao, swo, dsw, warden, caretaker, librarian,
--    security, and the other staff roles in UserRole / ADMIN_ROLES.
-- 3. faculty. This table cannot see FacultyProfile or designation.

UPDATE "AuthCredential"
SET role = 'webadmin'
WHERE lower(trim(username)) = 'webadmin'
  AND lower(trim(role)) IN ('webadmin', 'webmaster');

UPDATE "AuthCredential"
SET role = lower(trim(username))
WHERE lower(trim(role)) IN ('webadmin', 'webmaster')
  AND lower(trim(username)) IN (
    'teacher', 'faculty', 'hod', 'dean', 'director', 'coe', 'ao', 'swo',
    'warden', 'warden_male', 'warden_female', 'caretaker', 'caretaker_male',
    'caretaker_female', 'security', 'librarian', 'dsw', 'admin'
  );

UPDATE "AuthCredential"
SET role = 'faculty'
WHERE lower(trim(role)) IN ('webadmin', 'webmaster')
  AND lower(trim(username)) <> 'webadmin';
