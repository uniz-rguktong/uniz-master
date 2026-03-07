import { z } from "zod";

export const GradeSchema = z.object({
  id: z.string().uuid().optional(),
  studentId: z.string(),
  subjectId: z.string(),
  semesterId: z.string(),
  grade: z.number().min(0).max(10), // Assuming 0-10 based on analysis
  gradeLetter: z.string().optional(), // Computed helper
});

export const GradeSummarySchema = z.object({
  studentId: z.string(),
  semesterId: z.string(),
  gpa: z.number().nullable(),
  grades: z.array(
    z.object({
      subjectName: z.string(),
      grade: z.number(),
      credits: z.number(),
    }),
  ),
});

export type Grade = z.infer<typeof GradeSchema>;
export type GradeSummary = z.infer<typeof GradeSummarySchema>;
