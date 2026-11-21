import { lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import { RootLayout } from "./components/layout/RootLayout";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const InstitutePage = lazy(() => import("./pages/InstitutePage").then((m) => ({ default: m.InstitutePage })));
const AcademicsPage = lazy(() => import("./pages/AcademicsPage").then((m) => ({ default: m.AcademicsPage })));
const DepartmentPage = lazy(() => import("./pages/DepartmentPage").then((m) => ({ default: m.DepartmentPage })));
const FacultyProfilePage = lazy(() => import("./pages/FacultyProfilePage").then((m) => ({ default: m.FacultyProfilePage })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const OfficialPage = lazy(() => import("./pages/OfficialPage").then((m) => ({ default: m.OfficialPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="institute/:pageName" element={<InstitutePage />} />
          <Route path="about/rti-act" element={<InstitutePage page="rtiinfo" title="Right to information act" />} />
          <Route path="about/:slug" element={<OfficialPage />} />
          <Route path="administration" element={<OfficialPage />} />
          <Route path="administration/:slug" element={<OfficialPage />} />
          <Route path="academics/dean" element={<OfficialPage />} />
          <Route path="academics/departments" element={<OfficialPage />} />
          <Route path="academics/examination-cell" element={<OfficialPage />} />
          <Route path="academics/:pageName" element={<AcademicsPage />} />
          <Route path="departments/:deptCode" element={<DepartmentPage />} />
          <Route path="departments/:deptCode/faculty/:facultyIndex" element={<FacultyProfilePage />} />
          <Route path="notifications/:type" element={<NotificationsPage />} />
          <Route path="uniz/:slug" element={<OfficialPage />} />
          <Route path="grievance/:slug" element={<OfficialPage />} />
          <Route path="information/:slug" element={<OfficialPage />} />
          <Route path="consultancy" element={<OfficialPage />} />
          <Route path="admissions" element={<OfficialPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
