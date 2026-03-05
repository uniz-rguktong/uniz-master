// Set this to your Azure VM IP or Domain in .env as VITE_API_URL
export const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

// Notification service URL - routes through same-origin nginx proxy
export const NOTIFICATION_SERVICE_URL = `${BASE_URL}/notifications`;

// New Microservices Architecture Endpoints
// Auth
export const SIGNIN = (type: "student" | "admin" | "faculty") =>
  type === "admin" ? `${BASE_URL}/auth/login/admin` : `${BASE_URL}/auth/login`;
export const SIGNUP = (_type: "student" | "admin" | "faculty") =>
  `${BASE_URL}/auth/signup`;
export const FORGOT_PASS_ENDPOINT = `${BASE_URL}/auth/otp/request`;
export const REQUEST_OTP_EMAIL_ENDPOINT = `${BASE_URL}/auth/otp/request-email`;
export const VERIFY_OTP_ENDPOINT = `${BASE_URL}/auth/otp/verify`;
export const SET_NEW_PASS_ENDPOINT = `${BASE_URL}/auth/password/reset`;

// Profile (User Service)
export const STUDENT_INFO = `${BASE_URL}/profile/student/me`;
export const UPDATE_DETAILS = `${BASE_URL}/profile/student/update`;
export const FACULTY_INFO = `${BASE_URL}/profile/faculty/me`;
export const ADMIN_INFO = `${BASE_URL}/profile/admin/me`;
export const SEARCH_STUDENTS = `${BASE_URL}/profile/student/search`;

// Outpass (Requests Service)
export const REQUEST_OUTING = `${BASE_URL}/requests/outing`;
export const REQUEST_OUTPASS = `${BASE_URL}/requests/outpass`;
export const STUDENT_HISTORY = `${BASE_URL}/requests/history`;
export const ADMIN_STUDENT_HISTORY = (id: string) =>
  `${BASE_URL}/requests/history/${id}`;

// Admin / Approvals (Through Requests Service)
export const APPROVE_OUTING = (id: string) =>
  `${BASE_URL}/requests/${id}/approve`;
export const REJECT_OUTING = (id: string) =>
  `${BASE_URL}/requests/${id}/reject`;
export const FORWARD_OUTING = (id: string) =>
  `${BASE_URL}/requests/${id}/forward`;
export const APPROVE_OUTPASS = (id: string) =>
  `${BASE_URL}/requests/${id}/approve`;
export const REJECT_OUTPASS = (id: string) =>
  `${BASE_URL}/requests/${id}/reject`;
export const FORWARD_OUTPASS = (id: string) =>
  `${BASE_URL}/requests/${id}/forward`;

// Bulk fetch
export const GET_OUTING_REQUESTS = `${BASE_URL}/requests/outing/all`;
export const GET_OUTPASS_REQUESTS = `${BASE_URL}/requests/outpass/all`;
export const SECURITY_SUMMARY = `${BASE_URL}/requests/security/summary`;
export const SECURITY_CHECKOUT = (id: string) =>
  `${BASE_URL}/requests/${id}/checkout`;
export const SECURITY_CHECKIN = (id: string) =>
  `${BASE_URL}/requests/${id}/checkin`;

// Notes:
// The frontend expects many endpoints that were present in the monolith.
// The new Microservices (Phase 3) implemented the CORE flow: Login, Profile, Request, History, Approve.
// Some admin bulk fetch endpoints are not yet in uniz-outpass-service (Phase 3 constraint was "Core Business Logic").
// This file is updated to point to the AVAILABLE microservices endpoints.
// Endpoints that are missing in MS are marked or mapped to stubs/comments.

// Legacy / Placeholder Endpoints for Build Compatibility
export const ADMIN_RESET_PASS = `${BASE_URL}/auth/admin/reset-password`;
export const RESET_PASS = `${BASE_URL}/auth/reset-password`;

// Academic / Grades (Pending Microservice Migration)
export const GET_ATTENDANCE = `${BASE_URL}/academics/attendance`;
export const GET_GRADES = `${BASE_URL}/academics/grades`;
export const DOWNLOAD_GRADES = (semesterId: string) =>
  `${BASE_URL}/academics/grades/download/${semesterId}`;
export const DOWNLOAD_ATTENDANCE = (semesterId: string) =>
  `${BASE_URL}/academics/attendance/download/${semesterId}`;

// Additional Legacy Endpoints
export const UPDATE_STUDENT_STATUS = `${BASE_URL}/profile/student/status`;
export const STUDENT_OUTSIDE_CAMPUS = `${BASE_URL}/requests/outside`;
export const CREATE_FACULTY = `${BASE_URL}/profile/faculty/create`;
export const SEARCH_FACULTY = `${BASE_URL}/profile/faculty/search`;
export const UPDATE_FACULTY = (username: string) =>
  `${BASE_URL}/profile/admin/faculty/${username}`;
export const ADMIN_SUSPEND_FACULTY = (username: string) =>
  `${BASE_URL}/profile/admin/faculty/${username}/suspend`;
export const BULK_CREATE_FACULTY = `${BASE_URL}/profile/admin/faculty/bulk-create`;
export const BULK_UPDATE_FACULTY = `${BASE_URL}/profile/admin/faculty/bulk-update`;
export const BULK_DELETE_FACULTY = `${BASE_URL}/profile/admin/faculty/bulk-delete`;

// Webmaster / Specialized Admin Endpoints
export const ADMIN_VIEW_STUDENT = (id: string) =>
  `${BASE_URL}/profile/admin/student/${id}`;
export const GET_SUBJECTS = `${BASE_URL}/academics/subjects`;
export const ADD_SUBJECT = `${BASE_URL}/academics/subjects/add`;
export const UPLOAD_ATTENDANCE = `${BASE_URL}/academics/attendance/upload`;
export const UPLOAD_GRADES = `${BASE_URL}/academics/grades/upload`;

export const GET_ATTENDANCE_TEMPLATE = (
  branch: string,
  year: string,
  semesterId: string,
) =>
  `${BASE_URL}/academics/attendance/template?branch=${branch}&year=${year}&semesterId=${semesterId}`;

export const GET_GRADES_TEMPLATE = (
  branch: string,
  year: string,
  semesterId: string,
  subjectCode: string,
  remedialsOnly: boolean,
) =>
  `${BASE_URL}/academics/grades/template?branch=${branch}&year=${year}&semesterId=${semesterId}&subjectCode=${subjectCode}&remedialsOnly=${remedialsOnly}`;

export const ADMIN_SUSPEND_STUDENT = (id: string) =>
  `${BASE_URL}/profile/admin/student/${id}/suspend`;
export const ADMIN_UPDATE_STUDENT = (id: string) =>
  `${BASE_URL}/profile/admin/student/${id}`;

// Student Bulk Management
export const ADMIN_STUDENT_UPLOAD = `${BASE_URL}/profile/admin/student/upload`;
export const ADMIN_STUDENT_TEMPLATE = `${BASE_URL}/profile/admin/student/template`;
export const ADMIN_STUDENT_PROGRESS = `${BASE_URL}/profile/admin/student/upload/progress`;
export const ADMIN_STUDENT_EXPORT = (
  branch?: string,
  year?: string,
  fields?: string,
) => {
  let url = `${BASE_URL}/profile/admin/student/export?`;
  if (branch) url += `branch=${branch}&`;
  if (year) url += `year=${year}&`;
  if (fields) url += `fields=${fields}&`;
  return url.endsWith("&") || url.endsWith("?") ? url.slice(0, -1) : url;
};

// System & Logs
export const ADMIN_UPLOAD_HISTORY = `${BASE_URL}/profile/admin/upload-history`;
export const TRIGGER_CRON = `${BASE_URL}/cron/api/cron`;
export const ACADEMICS_PROGRESS = (uploadId: string) =>
  `${BASE_URL}/academics/upload/progress?uploadId=${uploadId}`;

export const GET_GRIEVANCES_LIST = `${BASE_URL}/requests/grievance/list`;

export const BANNERS_BASE = `${BASE_URL}/cms/admin/banners`;
export const UPDATE_BANNER_VISIBILITY = (id: string) =>
  `${BASE_URL}/cms/admin/visibility/banner/${id}`;

export const UPDATES_BASE = `${BASE_URL}/cms/admin/updates`;
// // export const TENDERS_BASE = `${BASE_URL}/cms/admin/tenders`;
export const GET_NOTIFICATIONS = `${BASE_URL}/cms/notifications`;
export const PUBLIC_BANNERS = `${BASE_URL}/cms/banners/public`;
export const SYSTEM_HEALTH = `${BASE_URL}/system/health`;

// Push Notifications
export const PUSH_SUBSCRIBE = `${BASE_URL}/notifications/subscribe`;
export const PUSH_SUBSCRIBERS = `${BASE_URL}/notifications/push/subscribers`;
export const PUSH_SEND = `${BASE_URL}/notifications/push/send`;

export const BULK_UPDATE_GRADES = `${BASE_URL}/academics/grades/bulk-update`;
export const GET_BATCH_GRADES = `${BASE_URL}/academics/grades/batch`;
export const ADD_MANUAL_GRADE = `${BASE_URL}/academics/grades/add`;

// Faculty Management (Academics Service)
export const ACADEMIC_FACULTY = `${BASE_URL}/academics/faculty`;
export const ACADEMIC_FACULTY_BY_ID = (id: string) =>
  `${BASE_URL}/academics/faculty/${id}`;
export const ACADEMIC_FACULTY_ROLE = (id: string) =>
  `${BASE_URL}/academics/faculty/${id}/role`;

// Subject Management (v2)
export const SUBJECT_BY_ID = (id: string) =>
  `${BASE_URL}/academics/subjects/${id}`;

// Registration Workflow
export const SEMESTERS = `${BASE_URL}/academics/semester`;
export const INIT_SEMESTER = `${BASE_URL}/academics/semester/init`;
export const UPDATE_SEMESTER_STATUS = (id: string) =>
  `${BASE_URL}/academics/semester/status/${id}`;
export const DELETE_SEMESTER = (id: string) =>
  `${BASE_URL}/academics/semester/${id}`;

export const DEAN_REVIEW = (branch: string) =>
  `${BASE_URL}/academics/dean/review/${branch}`;
export const APPROVE_ALLOCATION = `${BASE_URL}/academics/dean/approve`;
export const DEAN_APPROVE = APPROVE_ALLOCATION;

export const GET_AVAILABLE_SUBJECTS = (branch: string, year: string) =>
  `${BASE_URL}/academics/student/available?branch=${branch}&year=${year}`;
export const REGISTER_SUBJECTS = `${BASE_URL}/academics/student/register`;
export const GET_CURRENT_SUBJECTS = (studentId: string) =>
  `${BASE_URL}/academics/student/current/${studentId}`;
export const GET_REGISTRATIONS = `${BASE_URL}/academics/registrations`;
