-- Burst-friendly student semester lookups (results / attendance reads)
CREATE INDEX IF NOT EXISTS "Grade_studentId_semesterId_idx" ON "Grade"("studentId", "semesterId");
CREATE INDEX IF NOT EXISTS "Attendance_studentId_semesterId_idx" ON "Attendance"("studentId", "semesterId");
