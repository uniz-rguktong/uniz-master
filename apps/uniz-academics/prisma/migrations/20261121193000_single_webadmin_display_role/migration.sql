-- Public faculty-directory role. This table has no password and no role
-- history. The role column stores uppercase labels (FACULTY, HOD, DEAN,
-- WEBADMIN). There is no Postgres enum; COE is the same uppercase label.
--
-- webadmin@rguktong.ac.in stays WEBADMIN. Any other row whose role is
-- WEBADMIN, webadmin, or the legacy spelling webmaster is mapped from the
-- email's local part, then designation, then FACULTY:
-- 1. Local part is a known staff role (coe -> COE, dean -> DEAN, ...).
-- 2. Local part is hod_<branch> or hod-<branch> -> HOD.
-- 3. designation is a known staff role -> that uppercase label.
-- 4. FACULTY, the column default.

UPDATE "Faculty"
SET role = 'WEBADMIN'
WHERE lower(trim(role)) IN ('webadmin', 'webmaster')
  AND lower(trim(email)) = 'webadmin@rguktong.ac.in';

UPDATE "Faculty"
SET role = CASE
  WHEN split_part(lower(trim(email)), '@', 1) IN (
    'teacher', 'faculty', 'hod', 'dean', 'director', 'coe', 'ao', 'swo',
    'warden', 'warden_male', 'warden_female', 'caretaker', 'caretaker_male',
    'caretaker_female', 'security', 'librarian', 'dsw', 'admin'
  ) THEN upper(split_part(lower(trim(email)), '@', 1))
  WHEN split_part(lower(trim(email)), '@', 1) ~ '^hod[_-]' THEN 'HOD'
  WHEN lower(trim(designation)) IN (
    'teacher', 'faculty', 'hod', 'dean', 'director', 'coe', 'ao', 'swo',
    'warden', 'warden_male', 'warden_female', 'caretaker', 'caretaker_male',
    'caretaker_female', 'security', 'librarian', 'dsw', 'admin'
  ) THEN upper(lower(trim(designation)))
  ELSE 'FACULTY'
END
WHERE lower(trim(role)) IN ('webadmin', 'webmaster')
  AND COALESCE(lower(trim(email)), '') <> 'webadmin@rguktong.ac.in';
