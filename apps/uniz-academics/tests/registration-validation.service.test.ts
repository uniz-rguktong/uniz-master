import { describe, expect, it } from "vitest";
import {
  validateRegistrationSubjectIds,
  type RegistrationAllocation,
} from "../src/services/registration-validation.service";

function allocation(
  partial: Partial<RegistrationAllocation> &
    Pick<RegistrationAllocation, "subjectId">,
): RegistrationAllocation {
  return {
    isMandatory: false,
    electiveGroupId: null,
    electiveGroupName: null,
    electiveLimit: null,
    subject: { name: partial.subjectId },
    ...partial,
  };
}

describe("validateRegistrationSubjectIds", () => {
  it("accepts a selection that includes every mandatory subject", () => {
    const result = validateRegistrationSubjectIds(
      ["core-1", "core-2"],
      [
        allocation({
          subjectId: "core-1",
          isMandatory: true,
          subject: { name: "Math" },
        }),
        allocation({
          subjectId: "core-2",
          isMandatory: true,
          subject: { name: "Physics" },
        }),
      ],
    );
    expect(result).toEqual({ ok: true });
  });

  it("names the mandatory subjects that were left out", () => {
    const result = validateRegistrationSubjectIds(
      ["core-1"],
      [
        allocation({
          subjectId: "core-1",
          isMandatory: true,
          subject: { name: "Math" },
        }),
        allocation({
          subjectId: "core-2",
          isMandatory: true,
          subject: { name: "Physics" },
        }),
      ],
    );
    expect(result).toEqual({
      ok: false,
      error: "Missing mandatory subjects: Physics",
    });
  });

  it("requires each elective group to be filled to its limit", () => {
    const electives = [
      allocation({
        subjectId: "e1",
        electiveGroupId: "PE-1",
        electiveLimit: 1,
        subject: { name: "Compilers" },
      }),
      allocation({
        subjectId: "e2",
        electiveGroupId: "PE-1",
        electiveLimit: 1,
        subject: { name: "Graphics" },
      }),
    ];

    expect(validateRegistrationSubjectIds(["e1"], electives)).toEqual({
      ok: true,
    });
    expect(validateRegistrationSubjectIds(["e1", "e2"], electives)).toEqual({
      ok: false,
      error: "Group PE-1: select at most 1 from Compilers, Graphics",
    });
    expect(validateRegistrationSubjectIds([], electives)).toEqual({
      ok: false,
      error: "Group PE-1: select exactly 1 from Compilers, Graphics",
    });
  });

  it("treats a missing elective limit as one and ignores a blank group id", () => {
    const result = validateRegistrationSubjectIds(
      ["loose"],
      [
        allocation({
          subjectId: "loose",
          electiveGroupId: "   ",
          subject: { name: "Loose" },
        }),
        allocation({
          subjectId: "e1",
          electiveGroupId: "OPEN",
          electiveLimit: null,
          subject: { name: "French" },
        }),
        allocation({
          subjectId: "e2",
          electiveGroupId: "OPEN",
          electiveLimit: null,
          subject: { name: "German" },
        }),
      ],
    );
    expect(result).toEqual({
      ok: false,
      error: "Group OPEN: select exactly 1 from French, German",
    });
  });

  it("reports the first group that is short when several groups are present", () => {
    const result = validateRegistrationSubjectIds(
      ["a1"],
      [
        allocation({
          subjectId: "a1",
          electiveGroupId: "A",
          electiveLimit: 1,
          subject: { name: "A1" },
        }),
        allocation({
          subjectId: "b1",
          electiveGroupId: "B",
          electiveLimit: 1,
          subject: { name: "B1" },
        }),
      ],
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Group B");
  });
});
