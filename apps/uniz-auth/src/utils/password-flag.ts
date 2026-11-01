import { isLoadTestAccount } from "@uniz/shared";
import { isOwnCampusDefaultPassword } from "./password.util";

export function resolveLoginPasswordFlag(input: {
  enforce: boolean;
  submittedPassword: string;
  username: string;
  passwordChangedAt: Date | null;
  alreadyFlagged: boolean;
}): { persistFlag: boolean; expose: boolean } {
  if (isLoadTestAccount(input.username)) {
    return { persistFlag: false, expose: false };
  }

  const stillOnCampusDefault =
    input.passwordChangedAt == null &&
    isOwnCampusDefaultPassword(input.submittedPassword, input.username);

  const flagged = input.alreadyFlagged || stillOnCampusDefault;
  return {
    persistFlag: stillOnCampusDefault && !input.alreadyFlagged,
    expose: input.enforce && flagged,
  };
}
