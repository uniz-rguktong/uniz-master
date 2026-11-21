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
  ENGINEERING_BRANCHES,
  BRANCH_NAME_MAP,
  normalizeBranchCode,
  resolveStudentBranch,
  DEFAULT_STUDENT_BRANCH,
  type EngineeringBranch,
} from "./branches";
