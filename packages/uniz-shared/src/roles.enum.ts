export enum UserRole {
  STUDENT = "student",

  TEACHER = "teacher",
  FACULTY = "faculty",
  HOD = "hod",

  // Canonical highest-privilege role.
  WEBADMIN = "webadmin",
  // Legacy alias for WEBADMIN, retained only while pre-flip 'webmaster' JWTs
  // may still be in flight. Remove once those tokens have expired.
  WEBMASTER = "webmaster",
  DEAN = "dean",
  DIRECTOR = "director",
  COE = "coe",
  AO = "ao",

  SWO = "swo",
  WARDEN_MALE = "warden_male",
  WARDEN_FEMALE = "warden_female",
  CARETAKER_MALE = "caretaker_male",
  CARETAKER_FEMALE = "caretaker_female",

  SECURITY = "security",
  LIBRARIAN = "librarian",

  DSW = "dsw",
  WARDEN = "warden",
  CARETAKER = "caretaker",
}

export const ADMIN_ROLES: string[] = [
  UserRole.WEBMASTER,
  UserRole.WEBADMIN,
  UserRole.DEAN,
  UserRole.DIRECTOR,
  UserRole.COE,
  UserRole.AO,
  UserRole.SWO,
  UserRole.HOD,
  UserRole.FACULTY,
  UserRole.TEACHER,
  UserRole.SECURITY,
  UserRole.LIBRARIAN,
  UserRole.WARDEN_MALE,
  UserRole.WARDEN_FEMALE,
  UserRole.CARETAKER_MALE,
  UserRole.CARETAKER_FEMALE,
  UserRole.DSW,
  UserRole.WARDEN,
  UserRole.CARETAKER,
  "admin",
];
