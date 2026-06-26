import { JwtPayload } from "../shared/jwt.schema";

export function resolveHodBranch(user: JwtPayload | undefined): string {
  if (!user) return "";
  const fromJwt = String(user.department || "")
    .trim()
    .toUpperCase();
  if (fromJwt && fromJwt !== "GENERAL") return fromJwt;
  return String(user.username.split(/[_-]/)[1] || "")
    .trim()
    .toUpperCase();
}
