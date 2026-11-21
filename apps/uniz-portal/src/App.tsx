import { Suspense, lazy, type ReactElement } from "react";
import { Route, Routes, Link, useNavigate, Navigate } from "react-router-dom";
import "./App.css";
import "./index.css";
import { PageTransition } from "./components/Transition";
import Toaster from "@/components/ui/toast";
import { useIsAuth } from "./hooks/is_authenticated";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "./components/Button";
import { Skeleton } from "./components/ui/Skeleton";
import { CampusIllustration } from "./components/public/PublicFrame";

// Lazy imports
const Home = lazy(() => import("./pages/home"));
const Signin = lazy(() => import("./pages/auth/CommonSignin"));
const Admin = lazy(() => import("./pages/admin/index"));
const Sidebar = lazy(() => import("./components/Sidebar"));
const SEOLanding = lazy(() => import("./pages/seo-landing"));
const Developers = lazy(() => import("./pages/Developers"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotificationDeepLink = lazy(() => import("./pages/NotificationDeepLink"));
const AdminNotificationsPage = lazy(
  () => import("./pages/admin/AdminNotificationsPage"),
);
const WebadminGuidePrint = lazy(
  () => import("./pages/admin/Webadmin/HelpPrintPage"),
);

// Admin Components
const AddStudents = lazy(() => import("./pages/admin/AddStudents"));
const ToasterDemo = lazy(() => import("./pages/student/ToasterDemo"));
const FacultyDashboard = lazy(() => import("./pages/faculty/dashboard"));
const AddGrades = lazy(() => import("./pages/admin/AddGrades"));
const AddAttendance = lazy(() => import("./pages/attendance/AddAttendance"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const RoleManagement = lazy(() => import("./pages/admin/RoleManagement"));
const BannerManager = lazy(() => import("./pages/admin/BannerManager"));
const CurriculumManager = lazy(() => import("./pages/admin/Curriculum"));
const SearchStudents = lazy(() => import("./pages/admin/searchstudents"));
const UpdateStatus = lazy(() => import("./components/UpdateStudentStatus"));
// const ApproveComp = lazy(() => import("./pages/admin/approve-comp"));
const AddFaculty = lazy(() => import("./pages/admin/AddFaculty"));
const SecurityPortal = lazy(() => import("./pages/admin/SecurityPortal"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));
const CurrentSemesterAdmin = lazy(
  () => import("./pages/admin/CurrentSemesterAdmin"),
);
// Public Info Pages deleted

export const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === "true";

const LoadingFallback = () => (
  <div className="min-h-screen bg-bg px-4 py-10 min-[821px]:px-10">
    <div className="mx-auto max-w-[1280px] space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-80" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-5 min-[821px]:grid-cols-4">
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-36 rounded-lg" />
      </div>
    </div>
  </div>
);

export function Error() {
  useIsAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="h-64 w-[280px] overflow-hidden rounded-xl bg-tint">
        <CampusIllustration />
      </div>
      <h1 className="mt-8 font-serif text-[28px] font-normal leading-9 tracking-[-0.01em] text-head">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-body leading-6 text-text-2">
        The requested resource is unavailable or has been relocated.
      </p>
      <Button size="default" className="mt-8" asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}

export function Maintenance() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <section className="w-full max-w-lg rounded-xl border border-border bg-panel p-8 text-center">
        <Construction className="mx-auto text-text-2" size={32} strokeWidth={1.5} aria-hidden />
        <h1 className="mt-4 font-serif text-[28px] font-normal leading-9 tracking-[-0.01em] text-head">
          Under maintenance
        </h1>
        <p className="mt-3 text-body leading-6 text-text-2">
          We are currently updating the system to serve you better. Please check
          back later or contact administration if this persists.
        </p>
        <Button variant="outline" className="mt-8" onclickFunction={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Go back
        </Button>
      </section>
    </div>
  );
}

const MaintenanceGuard = ({ children }: { children: ReactElement }) => {
  const token = localStorage.getItem("admin_token");
  if (isMaintenance && !token) {
    return (
      <PageTransition>
        <Maintenance />
      </PageTransition>
    );
  }
  return children;
};

const AuthRedirect = () => {
  const studentToken = localStorage.getItem("student_token");
  const adminToken = localStorage.getItem("admin_token");
  const facultyToken = localStorage.getItem("faculty_token");
  if (adminToken) return <Navigate to="/admin" replace />;
  if (facultyToken) return <Navigate to="/faculty" replace />;
  if (studentToken) return <Navigate to="/student" replace />;
  return <Navigate to="/" replace />;
};

import { InstallPWA } from "./components/InstallPWA";
import { usePushNavigation } from "./hooks/usePushNavigation";

function PushNavigationBridge() {
  usePushNavigation();
  return null;
}

export default function App() {
  return (
    <>
      <PushNavigationBridge />
      <InstallPWA />
      <Toaster defaultPosition="bottom-right" />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public & Auth */}
          <Route
            path="/"
            element={
              <MaintenanceGuard>
                {localStorage.getItem("admin_token") ||
                localStorage.getItem("student_token") ||
                localStorage.getItem("faculty_token") ? (
                  <AuthRedirect />
                ) : (
                  <PageTransition>
                    <Home />
                  </PageTransition>
                )}
              </MaintenanceGuard>
            }
          />
          <Route
            path="/developers"
            element={
              <PageTransition>
                <Developers />
              </PageTransition>
            }
          />
          <Route
            path="/notifications"
            element={
              <PageTransition>
                <NotificationDeepLink />
              </PageTransition>
            }
          />
          <Route
            path="/privacy"
            element={
              <PageTransition>
                <PrivacyPolicy />
              </PageTransition>
            }
          />
          {/* SEO Marketing Pages */}
          <Route
            path="/student-project-management"
            element={
              <PageTransition>
                <SEOLanding />
              </PageTransition>
            }
          />
          <Route
            path="/college-team-collaboration"
            element={
              <PageTransition>
                <SEOLanding />
              </PageTransition>
            }
          />
          <Route
            path="/academic-task-tracker"
            element={
              <PageTransition>
                <SEOLanding />
              </PageTransition>
            }
          />
          <Route
            path="/blog/*"
            element={
              <PageTransition>
                <SEOLanding />
              </PageTransition>
            }
          />

          {/* Institutional and Academic routes deleted */}
          <Route
            path="/login"
            element={<Navigate to="/student/signin" replace />}
          />
          <Route
            path="/signin"
            element={<Navigate to="/student/signin" replace />}
          />
          <Route
            path="/student/signin"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Signin type="student" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/admin/signin"
            element={
              <PageTransition>
                <Signin type="admin" />
              </PageTransition>
            }
          />

          {/* Student Protected Routes */}
          <Route
            path="/student/help"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="help" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student/toast-demo"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <ToasterDemo />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="dashboard" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          {/*
          <Route
            path="/student/outpass"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="outpass" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student/outing"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="outing" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student/outing/requestouting"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="requestOuting" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student/outpass/requestoutpass"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="requestOutpass" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          */}
          <Route
            path="/student/resetpassword"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="resetpassword" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          {/*
          <Route
            path="/studyspace"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="studyspace" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/campushub"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="campushub" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          */}
          <Route
            path="/student/attendance"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="attendance" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student/gradehub"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="gradehub" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student/current-semester"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="currentSemester" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student/registration"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="registration" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student/grievance"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="grievance" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="notifications" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />

          {/* Admin Protected Routes — legacy pages first, then shell catch-all */}
          <Route
            path="/admin/addstudents"
            element={
              <PageTransition>
                <AddStudents />
              </PageTransition>
            }
          />
          <Route
            path="/admin/addgrades"
            element={
              <PageTransition>
                <AddGrades />
              </PageTransition>
            }
          />
          <Route
            path="/admin/current-semester"
            element={
              <PageTransition>
                <CurrentSemesterAdmin />
              </PageTransition>
            }
          />
          <Route
            path="/admin/addattendance"
            element={
              <PageTransition>
                <AddAttendance />
              </PageTransition>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <PageTransition>
                <Settings />
              </PageTransition>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <PageTransition>
                <AdminProfile />
              </PageTransition>
            }
          />
          <Route
            path="/admin/curriculum"
            element={
              <PageTransition>
                <CurriculumManager />
              </PageTransition>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <PageTransition>
                <RoleManagement />
              </PageTransition>
            }
          />
          <Route
            path="/admin/banners"
            element={
              <PageTransition>
                <BannerManager />
              </PageTransition>
            }
          />
          {/*
          <Route
            path="/admin/approveouting"
            element={
              <PageTransition>
                <ApproveComp type="outing" />
              </PageTransition>
            }
          />
          <Route
            path="/admin/approveoutpass"
            element={
              <PageTransition>
                <ApproveComp type="outpass" />
              </PageTransition>
            }
          />
          */}
          <Route
            path="/admin/updatestudentstatus"
            element={
              <PageTransition>
                <UpdateStatus />
              </PageTransition>
            }
          />
          <Route
            path="/admin/searchstudents"
            element={
              <PageTransition>
                <SearchStudents />
              </PageTransition>
            }
          />
          <Route
            path="/admin/security"
            element={
              <PageTransition>
                <SecurityPortal />
              </PageTransition>
            }
          />
          <Route
            path="/admin/addfaculty"
            element={
              <PageTransition>
                <AddFaculty />
              </PageTransition>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <PageTransition>
                <AdminNotificationsPage />
              </PageTransition>
            }
          />

          <Route
            path="/admin/help/print"
            element={
              <PageTransition>
                <WebadminGuidePrint />
              </PageTransition>
            }
          />

          {/* Admin shell sections (webadmin, dean, director, etc.) */}
          <Route
            path="/admin/*"
            element={
              <PageTransition>
                <Admin />
              </PageTransition>
            }
          />

          {/* Faculty Routes */}
          <Route
            path="/faculty"
            element={
              <PageTransition>
                <FacultyDashboard />
              </PageTransition>
            }
          />

          {/* Catch All */}
          <Route
            path="*"
            element={
              <PageTransition>
                <Error />
              </PageTransition>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}
