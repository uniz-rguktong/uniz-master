import { Skeleton } from "@/components/ui/Skeleton";
import StudentDashboardSkeleton from "../pages/admin/Webmaster/StudentDashboardSkeleton";

type StudentPageSkeletonVariant = "dashboard" | "form" | "table";

function FormPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-10 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="md:bg-white md:rounded-xl md:border md:border-zinc-100 md:shadow-sm md:p-8">
        <div className="space-y-5 md:space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-xl md:w-48" />
        </div>
      </div>
    </div>
  );
}

function TablePageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-full sm:w-40 rounded-xl" />
      </div>
      <div className="rounded-xl border border-zinc-100 bg-white p-4 md:p-6 space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function StudentPageSkeleton({
  variant = "table",
}: {
  variant?: StudentPageSkeletonVariant;
}) {
  if (variant === "dashboard") {
    return <StudentDashboardSkeleton />;
  }
  if (variant === "form") {
    return <FormPageSkeleton />;
  }
  return <TablePageSkeleton />;
}

export function studentContentSkeletonVariant(
  content: string,
): StudentPageSkeletonVariant {
  if (content === "dashboard") return "dashboard";
  if (
    content === "resetpassword" ||
    content === "requestOuting" ||
    content === "requestOutpass" ||
    content === "grievance" ||
    content === "help" ||
    content === "notifications"
  ) {
    return "form";
  }
  return "table";
}
