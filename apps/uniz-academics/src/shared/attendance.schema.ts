import { z } from "zod";

export const AttendanceSchema = z.object({
  id: z.string().uuid().optional(),
  studentId: z.string(),
  subjectId: z.string(),
  semesterId: z.string(),
  totalClasses: z.number().int().min(0),
  attendedClasses: z.number().int().min(0),
});

export const AttendanceSummarySchema = z.object({
  studentId: z.string(),
  semesterId: z.string(),
  overallPercentage: z.number(),
  subjectDetails: z.array(
    z.object({
      subjectName: z.string(),
      total: z.number(),
      attended: z.number(),
      percentage: z.number(),
    }),
  ),
});

export type Attendance = z.infer<typeof AttendanceSchema>;
export type AttendanceSummary = z.infer<typeof AttendanceSummarySchema>;
