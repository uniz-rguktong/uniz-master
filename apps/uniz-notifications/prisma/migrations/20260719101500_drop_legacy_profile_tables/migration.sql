-- Drop legacy tables left over from an earlier monolithic notifications schema.
-- These are no longer defined in schema.prisma and were empty (0 rows) in prod.
-- Canonical owners: StudentProfile/FacultyProfile/AdminProfile/Banner/Tender/
-- PublicNotification/UploadHistory all live in uniz-user.
DROP TABLE IF EXISTS "StudentProfile" CASCADE;
DROP TABLE IF EXISTS "FacultyProfile" CASCADE;
DROP TABLE IF EXISTS "AdminProfile" CASCADE;
DROP TABLE IF EXISTS "Banner" CASCADE;
DROP TABLE IF EXISTS "Tender" CASCADE;
DROP TABLE IF EXISTS "PublicNotification" CASCADE;
DROP TABLE IF EXISTS "UploadHistory" CASCADE;
