-- One-time data migration: consolidate the duplicate webmaster/WEBMASTER admin
-- identities into a single canonical 'webadmin' login.
--
-- Background: production had ONE AuthCredential ('webmaster') but TWO AdminProfiles
-- ('webmaster' = Mallikarjuna, 'WEBMASTER' = webadmin). Case-insensitive login let
-- the single password serve both identities; downstream rows were tagged by the
-- case typed at login (NotificationInbox/PushSubscription -> 'webmaster';
-- UploadHistory/OtpLog -> 'WEBMASTER').
--
-- End state: a single admin, username 'webadmin', that logs in with the existing
-- password. ROLE string is intentionally left as 'webmaster' here — it is renamed
-- separately via the staged, backward-compatible role rename.
--
-- Idempotent + atomic. Run against uniz_db (all schemas live there).
BEGIN;

-- 1. Rename the single login. Password hash + role preserved.
UPDATE uniz_auth."AuthCredential"
   SET username = 'webadmin'
 WHERE username = 'webmaster';

-- 2. Delete the old 'webmaster' (Mallikarjuna) admin profile.
DELETE FROM uniz_user."AdminProfile"
 WHERE username = 'webmaster';

-- 3. Promote the surviving 'WEBMASTER' profile to the canonical lowercase username.
UPDATE uniz_user."AdminProfile"
   SET username = 'webadmin'
 WHERE username = 'WEBMASTER';

-- 4. Migrate history keyed by the old usernames to 'webadmin'.
UPDATE uniz_notifications."NotificationInbox"
   SET username = 'webadmin'
 WHERE lower(username) = 'webmaster';

UPDATE uniz_user."UploadHistory"
   SET "uploadedBy" = 'webadmin'
 WHERE lower("uploadedBy") = 'webmaster';

UPDATE uniz_auth."OtpLog"
   SET username = 'webadmin'
 WHERE lower(username) = 'webmaster';

-- 5. Drop stale device push subscriptions for the old identity (device-bound;
--    webadmin re-subscribes on next login). Avoids pushing to old devices.
DELETE FROM uniz_notifications."PushSubscription"
 WHERE lower(username) = 'webmaster';

-- 6. Now that the collision is gone, add the deferred AdminProfile identity guard.
CREATE UNIQUE INDEX IF NOT EXISTS "AdminProfile_username_lower_key"
  ON uniz_user."AdminProfile" (lower(username));

COMMIT;
