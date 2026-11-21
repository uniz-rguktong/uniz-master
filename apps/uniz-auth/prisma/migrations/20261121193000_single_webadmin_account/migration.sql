-- AuthCredential has no email and no previous-role column. The canonical
-- login is username webadmin, whose institutional mailbox is
-- webadmin@rguktong.ac.in. Every other credential whose role is webadmin,
-- or the legacy spelling webmaster, becomes faculty (least-privileged staff
-- role). passwordHash is not read or written. Accounts are not deleted.
--
-- A richer demotion (designation / faculty profile) lives on AdminProfile and
-- FacultyProfile in the user schema. This table can only see the username.

UPDATE "AuthCredential"
SET role = 'webadmin'
WHERE lower(trim(username)) = 'webadmin'
  AND lower(trim(role)) IN ('webadmin', 'webmaster');

UPDATE "AuthCredential"
SET role = 'faculty'
WHERE lower(trim(role)) IN ('webadmin', 'webmaster')
  AND lower(trim(username)) <> 'webadmin';
