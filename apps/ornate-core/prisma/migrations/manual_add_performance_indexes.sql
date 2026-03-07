-- AlterTable: Add performance indexes
-- Migration: add_performance_indexes
-- Created: 2026-02-16

-- Add indexes to Admin table for role-based scoping
CREATE INDEX IF NOT EXISTS "Admin_role_idx" ON "Admin"("role");
CREATE INDEX IF NOT EXISTS "Admin_branch_idx" ON "Admin"("branch");
CREATE INDEX IF NOT EXISTS "Admin_clubId_idx" ON "Admin"("clubId");

-- Add indexes to Registration table for user queries and payment filtering
CREATE INDEX IF NOT EXISTS "Registration_userId_idx" ON "Registration"("userId");
CREATE INDEX IF NOT EXISTS "Registration_paymentStatus_idx" ON "Registration"("paymentStatus");

-- Add indexes to Announcement table for creator filtering
CREATE INDEX IF NOT EXISTS "Announcement_creatorId_idx" ON "Announcement"("creatorId");

-- Add indexes to GalleryAlbum table for creator filtering
CREATE INDEX IF NOT EXISTS "GalleryAlbum_creatorId_idx" ON "GalleryAlbum"("creatorId");

-- Add indexes to Match table for fixture queries (sport-model schema)
CREATE INDEX IF NOT EXISTS "Match_sportId_status_idx" ON "Match"("sportId", "status");
CREATE INDEX IF NOT EXISTS "Match_status_idx" ON "Match"("status");
CREATE INDEX IF NOT EXISTS "Match_matchId_sportId_idx" ON "Match"("matchId", "sportId");

-- Add indexes to sport registration and team-linking tables for coordinator dashboards
CREATE INDEX IF NOT EXISTS "SportRegistration_sportId_studentId_idx" ON "SportRegistration"("sportId", "studentId");
CREATE INDEX IF NOT EXISTS "SportRegistration_status_idx" ON "SportRegistration"("status");
CREATE INDEX IF NOT EXISTS "TeamMember_teamId_role_idx" ON "TeamMember"("teamId", "role");
CREATE INDEX IF NOT EXISTS "SportTeam_sportId_createdAt_idx" ON "SportTeam"("sportId", "createdAt");
