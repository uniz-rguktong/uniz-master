import { Suspense, lazy } from "react";
import { Route, Routes, Link, useNavigate, Navigate } from "react-router-dom";
import "./App.css";
import "./index.css";
import { PageTransition } from "./components/Transition";
import Toaster from "@/components/ui/toast";
import { toasterRef } from "@/utils/toast-ref";
import { useIsAuth } from "./hooks/is_authenticated";
import { Construction, FileQuestion, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "./components/Button";
import { motion } from "framer-motion";

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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-white text-center px-4 font-sans overflow-hidden selection:bg-zinc-100">
      {/* ── High-End Mesh Gradient Backdrop ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-50/40 via-blue-100/10 to-transparent blur-[120px] opacity-70" 
        />
        <div className="absolute inset-0 opacity-[0.015] grayscale contrast-150 brightness-150 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center max-w-lg mx-auto"
      >
        <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center mb-8 text-white shadow-xl shadow-zinc-200/50">
          <FileQuestion size={28} strokeWidth={2.5} />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-zinc-950 mb-3 tracking-tight leading-none">
          404 <span className="text-zinc-300 font-light tracking-[-0.04em]">Error</span>
        </h1>
        
        <p className="text-zinc-500 mb-10 font-medium text-[15px] leading-relaxed">
          The requested resource is unavailable, has been relocated, or is simply a glitch in the matrix.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="group relative h-12 px-8 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-900 text-[14px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          <Link to="/" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto group relative h-12 px-8 bg-zinc-950 hover:bg-black text-white text-[14px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              Return Home
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </motion.div>
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
                    <Home />
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
