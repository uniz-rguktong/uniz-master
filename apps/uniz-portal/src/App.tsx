import { Suspense, lazy } from "react";
import { Route, Routes, Link, useNavigate, Navigate } from "react-router-dom";
import "./App.css";
import "./index.css";
import { PageTransition } from "./components/Transition";
import Toaster from "@/components/ui/toast";
import { toasterRef } from "@/utils/toast-ref";
import { useIsAuth } from "./hooks/is_authenticated";
import { Construction, FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "./components/Button";

// Lazy imports
const Home = lazy(() => import("./pages/home"));
const Signin = lazy(() => import("./pages/auth/CommonSignin"));
const Admin = lazy(() => import("./pages/admin/index"));
const Sidebar = lazy(() => import("./components/Sidebar"));
const SEOLanding = lazy(() => import("./pages/seo-landing"));

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

import { Spinner } from "./components/ui/ios-spinner";

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
    <Spinner size="lg" />
  </div>
);

export function Error() {
  useIsAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4">
      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 text-white">
        <FileQuestion size={32} />
      </div>
      <h1 className="text-4xl font-semibold text-black mb-2 uppercase tracking-[-0.02em]">
        Page Not Found
      </h1>
      <p className="text-slate-500 max-w-md mb-8 font-medium italic opacity-80">
        The requested resource is unavailable or has been relocated.
      </p>
      <div className="flex gap-4">
        <Button
          variant="outline"
          onclickFunction={() => navigate(-1)}
          className="rounded-none border-2 border-black font-bold uppercase"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
        <Link to="/">
          <Button className="rounded-none bg-black text-white px-8 font-bold uppercase">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function Maintenance() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center px-4">
      <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 text-white animate-pulse">
        <Construction size={40} />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Under Maintenance
      </h1>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        We are currently updating the system to serve you better. Please check
        back later or contact administration if this persists.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onclickFunction={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    </div>
  );
}

const MaintenanceGuard = ({ children }: { children: JSX.Element }) => {
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

export default function App() {
  return (
    <>
      <InstallPWA />
      <Toaster ref={toasterRef} defaultPosition="top-center" />
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
                    <div className="flex justify-center">
                      <Home />
                    </div>
                  </PageTransition>
                )}
              </MaintenanceGuard>
            }
          />
          {/* SEO Marketing Pages */}
          <Route path="/student-project-management" element={<PageTransition><SEOLanding /></PageTransition>} />
          <Route path="/college-team-collaboration" element={<PageTransition><SEOLanding /></PageTransition>} />
          <Route path="/academic-task-tracker" element={<PageTransition><SEOLanding /></PageTransition>} />
          <Route path="/blog/*" element={<PageTransition><SEOLanding /></PageTransition>} />
          
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
            path="/student/grievance"
            element={
              <MaintenanceGuard>
                <PageTransition>
                  <Sidebar content="grievance" />
                </PageTransition>
              </MaintenanceGuard>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <PageTransition>
                <Admin />
              </PageTransition>
            }
          />
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
