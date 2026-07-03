import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarCheck,
  GraduationCap,
  KeyRound,
  LogIn,
  Megaphone,
  Shield,
  UserPen,
} from "lucide-react";

export type NotificationVisualType =
  | "LOGIN"
  | "PASSWORD"
  | "PROFILE"
  | "OTP"
  | "RESULTS"
  | "ATTENDANCE"
  | "BROADCAST"
  | "SYSTEM"
  | "GENERIC";

type Meta = {
  label: string;
  Icon: LucideIcon;
  iconClass: string;
  bgClass: string;
};

const META: Record<NotificationVisualType, Meta> = {
  LOGIN: {
    label: "Login activity",
    Icon: LogIn,
    iconClass: "text-sky-700",
    bgClass: "bg-sky-50 ring-sky-100",
  },
  PASSWORD: {
    label: "Password",
    Icon: KeyRound,
    iconClass: "text-amber-700",
    bgClass: "bg-amber-50 ring-amber-100",
  },
  PROFILE: {
    label: "Profile",
    Icon: UserPen,
    iconClass: "text-violet-700",
    bgClass: "bg-violet-50 ring-violet-100",
  },
  OTP: {
    label: "Verification",
    Icon: Shield,
    iconClass: "text-indigo-700",
    bgClass: "bg-indigo-50 ring-indigo-100",
  },
  RESULTS: {
    label: "Results",
    Icon: GraduationCap,
    iconClass: "text-emerald-700",
    bgClass: "bg-emerald-50 ring-emerald-100",
  },
  ATTENDANCE: {
    label: "Attendance",
    Icon: CalendarCheck,
    iconClass: "text-teal-700",
    bgClass: "bg-teal-50 ring-teal-100",
  },
  BROADCAST: {
    label: "Announcement",
    Icon: Megaphone,
    iconClass: "text-navy-800",
    bgClass: "bg-navy-50 ring-navy-100",
  },
  SYSTEM: {
    label: "System",
    Icon: Bell,
    iconClass: "text-navy-600",
    bgClass: "bg-zinc-50 ring-zinc-100",
  },
  GENERIC: {
    label: "Alert",
    Icon: Bell,
    iconClass: "text-navy-600",
    bgClass: "bg-zinc-50 ring-zinc-100",
  },
};

function normalizeType(raw: string): string {
  return raw.trim().toUpperCase().replace(/-/g, "_");
}

/** Infer visual type from stored type + title (legacy SYSTEM rows). */
export function resolveNotificationVisualType(
  rawType: string,
  title = "",
): NotificationVisualType {
  const t = normalizeType(rawType || "GENERIC");
  const hay = `${title}`.toLowerCase();

  if (t === "LOGIN" || t === "AUTH_LOGIN") return "LOGIN";
  if (t === "PASSWORD" || t === "PASSWORD_CHANGE" || t === "AUTH_PASSWORD") {
    return "PASSWORD";
  }
  if (t === "PROFILE" || t === "PROFILE_UPDATE") return "PROFILE";
  if (t === "OTP" || t === "VERIFICATION") return "OTP";
  if (t === "RESULTS" || t === "GRADES" || t === "GRADE") return "RESULTS";
  if (t === "ATTENDANCE") return "ATTENDANCE";
  if (t === "BROADCAST") return "BROADCAST";

  if (hay.includes("login") || hay.includes("signed in")) return "LOGIN";
  if (hay.includes("password")) return "PASSWORD";
  if (hay.includes("profile")) return "PROFILE";
  if (hay.includes("verification code") || hay.includes("otp")) return "OTP";
  if (hay.includes("result") || hay.includes("grade")) return "RESULTS";
  if (hay.includes("attendance")) return "ATTENDANCE";

  if (t === "SYSTEM") return "SYSTEM";
  return "GENERIC";
}

export function getNotificationTypeMeta(
  rawType: string,
  title = "",
): Meta & { visualType: NotificationVisualType } {
  const visualType = resolveNotificationVisualType(rawType, title);
  return { visualType, ...META[visualType] };
}
