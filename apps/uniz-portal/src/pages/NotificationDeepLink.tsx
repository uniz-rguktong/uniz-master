import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { signInWithReturn } from "@/utils/returnUrl";
import { Spinner } from "@/components/ui/ios-spinner";

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
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
