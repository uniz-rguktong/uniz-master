// Set this to your Azure VM IP or Domain in .env as VITE_API_URL
export const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

// Notification service URL - routes through same-origin nginx proxy
export const NOTIFICATION_SERVICE_URL = `${BASE_URL}/notifications`;

// New Microservices Architecture Endpoints
// Auth
export const SIGNIN = (_type: "student" | "admin" | "faculty") =>
  `${BASE_URL}/auth/login`;
export const SIGNUP = (_type: "student" | "admin" | "faculty") =>
  `${BASE_URL}/auth/signup`;
export const FORGOT_PASS_ENDPOINT = `${BASE_URL}/auth/otp/request`;
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

// Additional Legacy Endpoints
export const UPDATE_STUDENT_STATUS = `${BASE_URL}/profile/student/status`;
export const STUDENT_OUTSIDE_CAMPUS = `${BASE_URL}/requests/outside`;
export const CREATE_FACULTY = `${BASE_URL}/profile/faculty/create`;
