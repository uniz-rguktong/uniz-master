-- Additive only: anonymous course/faculty feedback.
CREATE TABLE IF NOT EXISTS "FeedbackForm" (
    "id" UUID NOT NULL,
    "semesterId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "facultyUsername" TEXT,
    "title" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FeedbackForm_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FeedbackForm_semesterId_subjectId_facultyUsername_key" ON "FeedbackForm"("semesterId", "subjectId", "facultyUsername");
CREATE INDEX IF NOT EXISTS "FeedbackForm_semesterId_idx" ON "FeedbackForm"("semesterId");
CREATE INDEX IF NOT EXISTS "FeedbackForm_facultyUsername_idx" ON "FeedbackForm"("facultyUsername");

CREATE TABLE IF NOT EXISTS "FeedbackResponse" (
    "id" UUID NOT NULL,
    "formId" UUID NOT NULL,
    "ratings" JSONB NOT NULL,
    "comment" TEXT,
    "createdAt" DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT "FeedbackResponse_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FeedbackResponse_formId_idx" ON "FeedbackResponse"("formId");

CREATE TABLE IF NOT EXISTS "FeedbackReceipt" (
    "formId" UUID NOT NULL,
    "voterHash" TEXT NOT NULL,
    CONSTRAINT "FeedbackReceipt_pkey" PRIMARY KEY ("formId", "voterHash")
);
