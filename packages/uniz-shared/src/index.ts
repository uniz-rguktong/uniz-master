export { UserRole, ADMIN_ROLES } from "./roles.enum";
export { JwtPayloadSchema, type JwtPayload } from "./jwt.schema";
export { ErrorCode } from "./error-codes";
export {
  resolveEffectiveRole,
  aliasWebadminRole,
  isHodUser,
  resolveHodBranch,
} from "./admin-role";
export {
  formatGrievanceCategoryLabel,
  formatStudentDisplayName,
  isActionableGrievanceDescription,
} from "./grievance-email";
export {
  getInternalSecret,
  isValidInternalSecret,
} from "./internal-secret";
export {
  ENGINEERING_BRANCHES,
  BRANCH_NAME_MAP,
  normalizeBranchCode,
  resolveStudentBranch,
  DEFAULT_STUDENT_BRANCH,
  type EngineeringBranch,
} from "./branches";
