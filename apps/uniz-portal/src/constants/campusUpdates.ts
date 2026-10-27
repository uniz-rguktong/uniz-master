import type { CampusUpdate } from "@/hooks/useCampusUpdates";

/** Shown when the CMS API returns no visible updates. */
export const CAMPUS_UPDATES_FALLBACK: CampusUpdate[] = [
  {
    id: "exam-results-transcript",
    title: "End-Semester Examination Results & Official Grade Sheets (AY 2026–27)",
    content:
      "Students across PUC (P1–P2) and B.Tech (E1–E4) branches may view verified semester grade reports, SGPA/CGPA calculations, and download official PDF grade transcripts after signing in with university credentials.",
    link: "/student/signin",
    isVisible: true,
    createdAt: "COE / Academic Records",
  },
  {
    id: "course-registration-sem",
    title: "Semester Subject Registration & Departmental Credit Verification",
    content:
      "Online course registration for regular and elective subjects is active in the Student Portal. Ensure all core departmental credits are confirmed prior to the registration deadline.",
    link: "/student/signin",
    isVisible: true,
    createdAt: "Office of Academic Affairs",
  },
  {
    id: "attendance-ledger-notice",
    title: "Subject-Wise Attendance Ledger & Examination Eligibility",
    content:
      "Monthly and cumulative attendance percentages across lecture and laboratory sessions are synchronized directly from departmental biometric and faculty logs.",
    link: "/student/signin",
    isVisible: true,
    createdAt: "Academic Section",
  },
  {
    id: "hostel-outpass-protocol",
    title: "Digital Campus Outpass & Residence Hall Clearance Protocol",
    content:
      "All day-outings and home-leave requests must be submitted through the UniZ Residence Module for automated Caretaker, Warden, and Security Gate verification.",
    link: "/student/signin",
    isVisible: true,
    createdAt: "Chief Warden Office",
  },
];
