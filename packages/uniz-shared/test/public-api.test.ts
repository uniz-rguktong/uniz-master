import { describe, expect, it } from "vitest";
import {
  ADMIN_ROLES,
  DEFAULT_STUDENT_BRANCH,
  ENGINEERING_BRANCHES,
  ErrorCode,
  UserRole,
  formatGrievanceCategoryLabel,
  getInternalSecret,
  parseJwtPayload,
} from "../src/index";

describe("public exports", () => {
  it("exposes roles, errors, branches, and the helpers services import", () => {
    expect(ErrorCode.AUTH_UNAUTHORIZED).toBe("AUTH_UNAUTHORIZED");
    expect(ErrorCode.OUTPASS_ALREADY_APPROVED).toBe("OUTPASS_ALREADY_APPROVED");
    expect(ADMIN_ROLES).toContain(UserRole.WEBADMIN);
    expect(ADMIN_ROLES).toContain(UserRole.HOD);
    expect(ADMIN_ROLES).not.toContain(UserRole.STUDENT);
    expect(ENGINEERING_BRANCHES).toContain("CSE");
    expect(ENGINEERING_BRANCHES).toContain("AI/ML");
    expect(DEFAULT_STUDENT_BRANCH).toBe("N/A");
    expect(formatGrievanceCategoryLabel("hostel")).toBe("hostel / mess");
    expect(typeof getInternalSecret).toBe("function");
    expect(parseJwtPayload({ username: "o210008", role: "student" }).ok).toBe(
      true,
    );
  });

  it("keeps optional jwt fields when they are present", () => {
    const res = parseJwtPayload({
      id: "user-1",
      username: "o210008",
      role: UserRole.FACULTY,
      email: "o210008@rguktong.ac.in",
      iat: 10,
      exp: 20,
      jti: "jti-1",
      department: "CSE",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.department).toBe("CSE");
      expect(res.data.jti).toBe("jti-1");
      expect(res.data.email).toBe("o210008@rguktong.ac.in");
    }
  });
});
