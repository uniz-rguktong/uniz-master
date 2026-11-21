import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Lockup } from "@/components/brand/Mark";

interface LoginScreenProps {
  isLogin?: boolean;
  onToggleMode?: () => void;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  heroTitle?: string;
  bottomText?: string;
  role?: "student" | "admin" | "faculty";
  stepKey?: string;
}

const statements: Record<NonNullable<LoginScreenProps["role"]>, string> = {
  student: "RGUKT Ongole's student portal.",
  admin: "RGUKT Ongole's staff portal.",
  faculty: "RGUKT Ongole's staff portal.",
};

export default function LoginScreen({
  title,
  subtitle,
  children,
  role = "student",
  onBack,
}: LoginScreenProps) {
  const other =
    role === "student"
      ? { href: "/admin/signin", label: "Faculty and admin sign in" }
      : { href: "/student/signin", label: "Student sign in" };

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text min-[821px]:flex-row">
      <aside className="flex flex-col bg-navy-900 text-white min-[821px]:min-h-screen min-[821px]:w-[41.666%] min-[821px]:px-14 min-[821px]:py-14">
        <div className="flex h-[60px] items-center px-5 min-[821px]:h-auto min-[821px]:px-0">
          <Lockup
            height={32}
            tone="chrome"
            title="uniZ"
            className="min-[821px]:hidden"
          />
          <Lockup
            height={44}
            tone="chrome"
            title="uniZ"
            className="hidden min-[821px]:block"
          />
        </div>
        <div className="hidden flex-1 flex-col justify-end min-[821px]:flex">
          <h2 className="max-w-[16ch] font-serif text-[36px] font-normal leading-[46px] tracking-[-0.01em] text-white">
            {statements[role]}
          </h2>
          <p className="mt-4 max-w-[28ch] text-[17px] leading-[26px] text-navy-300">
            Results, attendance, registration and notices.
          </p>
        </div>
        <p className="mt-auto hidden text-small text-navy-300 min-[821px]:block">
          © 2026 uniZ · RGUKT Ongole
        </p>
      </aside>

      <div className="relative flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-5 py-10 min-[821px]:px-10">
          <div className="w-full max-w-[400px]">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="mb-6 inline-flex min-h-11 items-center gap-1 text-small font-medium text-text-2 hover:text-head"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Back
              </button>
            ) : null}
            <h1 className="font-serif text-[28px] font-normal leading-9 tracking-[-0.01em] text-head min-[821px]:text-[32px] min-[821px]:leading-10">
              {title || "Sign in"}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-body leading-6 text-text-2">{subtitle}</p>
            ) : null}
            <div className="mt-8">{children}</div>
            <div className="mt-8 border-t border-border pt-6">
              <Link
                to={other.href}
                className="text-dense font-medium text-link underline-offset-[1px] hover:underline"
              >
                {other.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
