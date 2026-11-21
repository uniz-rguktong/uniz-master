-- One webadmin account: exact username webadmin (mailbox
-- webadmin@rguktong.ac.in) or a row whose email is that address.
-- Every other AdminProfile / FacultyProfile whose role is webadmin, or the
-- legacy spelling webmaster, is demoted. Rows are not deleted. These tables
-- have no password column; passwords are not read or written.
--
-- The July role flip stored webadmin on the coe FacultyProfile. Demotion
-- order, first match:
-- 1. Username (case-insensitive) is itself a known staff role, so coe stays
--    coe and dean stays dean. Staff roles are those in UserRole / ADMIN_ROLES
--    except student and webadmin.
-- 2. FacultyProfile.role for the same username when it is already a known
--    non-webadmin staff role (AdminProfile only; faculty rows are demoted first).
-- 3. designation, when it is itself one of those staff roles.
-- 4. hod, when the username is hod_<branch> or hod-<branch>.
-- 5. faculty, the least-privileged staff role in this schema.
--
-- New AdminProfile rows no longer default to webadmin, so an omitted role
-- cannot mint another webadmin.

UPDATE "AdminProfile"
SET role = 'webadmin'
WHERE lower(trim(role)) IN ('webadmin', 'webmaster')
  AND (
    lower(trim(username)) = 'webadmin'
    OR lower(trim(email)) = 'webadmin@rguktong.ac.in'
  );

UPDATE "FacultyProfile"
SET role = 'webadmin'
WHERE lower(trim(role)) IN ('webadmin', 'webmaster')
  AND (
    lower(trim(username)) = 'webadmin'
    OR lower(trim(email)) = 'webadmin@rguktong.ac.in'
  );

UPDATE "FacultyProfile" AS f
SET role = CASE
  WHEN lower(trim(f.username)) IN (
    'teacher', 'faculty', 'hod', 'dean', 'director', 'coe', 'ao', 'swo',
    'warden', 'warden_male', 'warden_female', 'caretaker', 'caretaker_male',
    'caretaker_female', 'security', 'librarian', 'dsw', 'admin'
  ) THEN lower(trim(f.username))
  WHEN lower(trim(f.username)) ~ '^hod[_-]' THEN 'hod'
  WHEN lower(trim(f.designation)) IN (
    'teacher', 'faculty', 'hod', 'dean', 'director', 'coe', 'ao', 'swo',
    'warden', 'warden_male', 'warden_female', 'caretaker', 'caretaker_male',
    'caretaker_female', 'security', 'librarian', 'dsw', 'admin'
  ) THEN lower(trim(f.designation))
  ELSE 'faculty'
END
WHERE lower(trim(f.role)) IN ('webadmin', 'webmaster')
  AND lower(trim(f.username)) <> 'webadmin'
  AND COALESCE(lower(trim(f.email)), '') <> 'webadmin@rguktong.ac.in';

UPDATE "AdminProfile" AS a
SET role = CASE
  WHEN lower(trim(a.username)) IN (
    'teacher', 'faculty', 'hod', 'dean', 'director', 'coe', 'ao', 'swo',
    'warden', 'warden_male', 'warden_female', 'caretaker', 'caretaker_male',
    'caretaker_female', 'security', 'librarian', 'dsw', 'admin'
  ) THEN lower(trim(a.username))
  ELSE COALESCE(
    (
      SELECT lower(trim(fp.role))
      FROM "FacultyProfile" fp
      WHERE lower(trim(fp.username)) = lower(trim(a.username))
        AND lower(trim(fp.role)) IN (
          'teacher', 'faculty', 'hod', 'dean', 'director', 'coe', 'ao', 'swo',
          'warden', 'warden_male', 'warden_female', 'caretaker', 'caretaker_male',
          'caretaker_female', 'security', 'librarian', 'dsw', 'admin'
        )
      LIMIT 1
    ),
    CASE
      WHEN lower(trim(a.username)) ~ '^hod[_-]' THEN 'hod'
      WHEN lower(trim(a.designation)) IN (
        'teacher', 'faculty', 'hod', 'dean', 'director', 'coe', 'ao', 'swo',
        'warden', 'warden_male', 'warden_female', 'caretaker', 'caretaker_male',
        'caretaker_female', 'security', 'librarian', 'dsw', 'admin'
      ) THEN lower(trim(a.designation))
      ELSE 'faculty'
    END
  )
END
WHERE lower(trim(a.role)) IN ('webadmin', 'webmaster')
  AND lower(trim(a.username)) <> 'webadmin'
  AND COALESCE(lower(trim(a.email)), '') <> 'webadmin@rguktong.ac.in';

ALTER TABLE "AdminProfile" ALTER COLUMN "role" SET DEFAULT 'faculty';
