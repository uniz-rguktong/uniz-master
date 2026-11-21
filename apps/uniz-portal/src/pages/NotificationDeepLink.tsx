import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signInWithReturn } from "@/utils/returnUrl";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Entry route from push notification clicks (`/notifications?n=...`).
 * Routes authenticated users to the correct portal inbox; otherwise sign-in.
 */
export default function NotificationDeepLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const returnPath = query ? `/notifications?${query}` : "/notifications";
    const n = searchParams.get("n");
    const highlightQs = n ? `?n=${encodeURIComponent(n)}` : "";

    const adminToken = localStorage.getItem("admin_token");
    const studentToken = localStorage.getItem("student_token");

    if (adminToken) {
      navigate(`/admin/notifications${highlightQs}`, { replace: true });
      return;
    }
    if (studentToken) {
      navigate(`/student/notifications${highlightQs}`, { replace: true });
      return;
    }

    sessionStorage.setItem("uniz_pending_notification", returnPath);
    navigate(signInWithReturn("student", returnPath), { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <div className="mx-auto max-w-md space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
