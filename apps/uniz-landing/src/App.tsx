import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Layout
import { RootLayout } from "./components/layout/RootLayout";

// Pages
import { HomePage } from "./pages/HomePage";
import { InstitutePage } from "./pages/InstitutePage";
import { AcademicsPage } from "./pages/AcademicsPage";
import { DepartmentPage } from "./pages/DepartmentPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="institute/:pageName" element={<InstitutePage />} />
          <Route path="academics/:pageName" element={<AcademicsPage />} />
          <Route path="departments/:deptCode" element={<DepartmentPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
