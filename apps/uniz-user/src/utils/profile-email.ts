export type EmailAccount = {
  id: string;
  username: string;
  email: string;
};

export const EMAIL_IN_USE_MESSAGE = "Email already in use by another account.";

export function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/** Same person: matching profile id, or the same username as the auth identity. */
export function sameAccount(a: EmailAccount, b: EmailAccount): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  const left = String(a.username || "").trim().toLowerCase();
  const right = String(b.username || "").trim().toLowerCase();
  return left.length > 0 && left === right;
}

export type EmailWrite =
  | { status: "omit" }
  | { status: "set"; email: string }
  | { status: "conflict" };

/**
 * Decide whether a profile write should touch email.
 * An unchanged address (case-insensitive) is omitted, so a phone-only save
 * never rewrites the caller's own unique email.
 * A real change is rejected when another account already owns that address.
 * The caller's own row is excluded by id. A second row with the same
 * username (the auth identity, or another profile for the same person)
 * is not treated as someone else.
 */
export function planEmailWrite(input: {
  self: EmailAccount;
  requestedEmail: unknown;
  owners: EmailAccount[];
}): EmailWrite {
  if (input.requestedEmail === undefined || input.requestedEmail === null) {
    return { status: "omit" };
  }
  const next = normalizeEmail(input.requestedEmail);
  const current = normalizeEmail(input.self.email);
  if (next === current) return { status: "omit" };
  if (!next) return { status: "set", email: "" };
  const taken = input.owners.some(
    (owner) =>
      !sameAccount(owner, input.self) && normalizeEmail(owner.email) === next,
  );
  if (taken) return { status: "conflict" };
  return { status: "set", email: next };
}

const BLOCKED_PATCH_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function planProfilePatch(input: {
  self: EmailAccount;
  patch: Record<string, unknown>;
  owners: EmailAccount[];
}):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string } {
  const entries: Array<[string, unknown]> = [];
  for (const [key, value] of Object.entries(input.patch)) {
    if (key === "email" || BLOCKED_PATCH_KEYS.has(key)) continue;
    if (value !== undefined) entries.push([key, value]);
  }
  const data: Record<string, unknown> = Object.fromEntries(entries);
  if (!Object.prototype.hasOwnProperty.call(input.patch, "email")) {
    return { ok: true, data };
  }
  const decision = planEmailWrite({
    self: input.self,
    requestedEmail: input.patch.email,
    owners: input.owners,
  });
  if (decision.status === "conflict") {
    return { ok: false, message: EMAIL_IN_USE_MESSAGE };
  }
  if (decision.status === "set") data.email = decision.email;
  return { ok: true, data };
}
