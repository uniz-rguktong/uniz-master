export type RegistrationAllocation = {
  subjectId: string;
  isMandatory: boolean;
  electiveGroupId: string | null;
  electiveGroupName: string | null;
  electiveLimit: number | null;
  subject: { name: string };
};

export type RegistrationValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateRegistrationSubjectIds(
  subjectIds: string[],
  allocations: RegistrationAllocation[],
): RegistrationValidationResult {
  const selected = new Set(subjectIds);

  const mandatoryMissing = allocations
    .filter((a) => a.isMandatory)
    .filter((a) => !selected.has(a.subjectId));

  if (mandatoryMissing.length > 0) {
    return {
      ok: false,
      error: `Missing mandatory subjects: ${mandatoryMissing
        .map((m) => m.subject.name)
        .join(", ")}`,
    };
  }

  const electiveGroups: Record<
    string,
    { limit: number; names: string[]; selectedCount: number }
  > = {};

  for (const alloc of allocations) {
    const groupId = (alloc.electiveGroupId || "").trim();
    if (!groupId) continue;

    if (!electiveGroups[groupId]) {
      electiveGroups[groupId] = {
        limit: alloc.electiveLimit || 1,
        names: [],
        selectedCount: 0,
      };
    }
    electiveGroups[groupId].names.push(alloc.subject.name);
    if (selected.has(alloc.subjectId)) {
      electiveGroups[groupId].selectedCount++;
    }
  }

  for (const [groupId, group] of Object.entries(electiveGroups)) {
    if (group.selectedCount > group.limit) {
      return {
        ok: false,
        error: `Group ${groupId}: select at most ${group.limit} from ${group.names.join(", ")}`,
      };
    }
    if (group.selectedCount < group.limit) {
      return {
        ok: false,
        error: `Group ${groupId}: select exactly ${group.limit} from ${group.names.join(", ")}`,
      };
    }
  }

  return { ok: true };
}
