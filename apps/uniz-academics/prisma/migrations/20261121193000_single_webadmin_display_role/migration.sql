-- Public faculty-directory role. This table has no password and no role
-- history. WEBADMIN, webadmin, or the legacy spelling webmaster on any row
-- whose email is not webadmin@rguktong.ac.in becomes FACULTY, the column
-- default and least-privileged value. The canonical mailbox stays WEBADMIN.

UPDATE "Faculty"
SET role = 'WEBADMIN'
WHERE lower(trim(role)) IN ('webadmin', 'webmaster')
  AND lower(trim(email)) = 'webadmin@rguktong.ac.in';

UPDATE "Faculty"
SET role = 'FACULTY'
WHERE lower(trim(role)) IN ('webadmin', 'webmaster')
  AND COALESCE(lower(trim(email)), '') <> 'webadmin@rguktong.ac.in';
