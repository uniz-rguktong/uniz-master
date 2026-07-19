-- subjectId is a foreign key and Postgres does NOT auto-create an index for it.
-- Several hot paths filter by subjectId / subjectId+semesterId: the delete-subject
-- guard (count grades/attendance by subjectId), result & attendance publishing,
-- failed-student lookups, and the batch-grades subject-relation join. These are
-- cheap today (tables ~0 rows) but seq-scan once a full upload lands ~20k rows.
CREATE INDEX IF NOT EXISTS "Grade_subjectId_semesterId_idx" ON "Grade" ("subjectId", "semesterId");
CREATE INDEX IF NOT EXISTS "Attendance_subjectId_semesterId_idx" ON "Attendance" ("subjectId", "semesterId");
