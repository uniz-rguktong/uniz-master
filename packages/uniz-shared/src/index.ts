export { UserRole, ADMIN_ROLES } from "./roles.enum";
export { JwtPayloadSchema, type JwtPayload } from "./jwt.schema";
export { ErrorCode } from "./error-codes";
export { API_ATTRIBUTION, applyApiAttribution } from "./attribution";
export {
  resolveEffectiveRole,
  aliasWebadminRole,
  isHodUser,
  resolveHodBranch,
  isWebadmin,
  accessRole,
  isCanonicalWebadminAccount,
  isCanonicalWebadminUsername,
  demoteStoredWebadminRole,
  demoteAcademicsDisplayRole,
  STAFF_ROLE_USERNAMES,
  webadminAssignmentRejection,
  institutionalEmail,
  resolveAccountEmail,
  normalizeAccountEmail,
  WEBADMIN_EMAIL,
  WEBADMIN_ASSIGNMENT_MESSAGE,
} from "./admin-role";
export {
  formatGrievanceCategoryLabel,
  formatStudentDisplayName,
  isActionableGrievanceDescription,
} from "./grievance-email";
export { getInternalSecret, isValidInternalSecret } from "./internal-secret";
export {
  UNIZ_EMAIL_LOGO_URL,
  UNIZ_PORTAL_URL,
  campusFooterLine,
  escapeEmailHtml,
  renderUnizEmail,
  type UnizEmailButton,
  type UnizEmailInput,
} from "./email-layout";
export {
  buildAdminActionEmail,
  buildAdminAlertEmail,
  buildAttendanceEmail,
  buildCheckpointEmail,
  buildGrievanceResolvedEmail,
  buildGrievanceSubmissionEmail,
  buildLoginAlertEmail,
  buildOtpEmail,
  buildOutingApprovalEmail,
  buildOutingRequestEmail,
  buildOutpassApprovalEmail,
  buildOutpassRequestEmail,
  buildPasswordChangeEmail,
  buildPlainNoticeEmail,
  buildProfileUpdateEmail,
  buildResultsEmail,
  previewCampusEmails,
  type CampusEmail,
} from "./email-messages";
export {
  PASSWORD_CHANGE_REQUIRED,
  AUTH_TOKEN_REVOKED,
  isPasswordChangeExempt,
  rejectStaleSession,
  encodeCredentialStatus,
  decodeCredentialStatus,
  type SessionRejection,
  type CredentialStatusSnapshot,
} from "./session-gate";
export {
  ENGINEERING_BRANCHES,
  BRANCH_NAME_MAP,
  normalizeBranchCode,
  resolveStudentBranch,
  DEFAULT_STUDENT_BRANCH,
  type EngineeringBranch,
} from "./branches";

export { routerLimiterOptions, clientKey } from "./router-limiter";
