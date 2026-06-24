/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Lock,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import SecuritySection from "../Webmaster/SecuritySection";
import { useIsAuth } from "../../../hooks/is_authenticated";
import { useLogout } from "../../../hooks/useLogout";
import RequestManagement from "./RequestManagement";
import GrievanceList from "./GrievanceList";
import WebmasterOverview from "../Webmaster/WebmasterOverview";

export default function SWODashboard() {
  useIsAuth();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "outing" | "outpass" | "grievance" | "security"
  >("dashboard");

  const username = (localStorage.getItem("username") || "SWO").replace(
    /"/g,
    "",
  );

  const navGroups = [
    {
      group: null,
      items: [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }],
    },
    {
      group: "Operations",
      items: [],
    },
    {
      group: "Feedback",
      items: [{ id: "grievance", label: "Grievances", icon: MessageSquare }],
    },
    {
      group: "Management",
      items: [{ id: "security", label: "Security", icon: Lock }],
    },
  ];

  const { logout } = useLogout();

  const renderContent = () => {
    switch (activeTab) {
      case "outing":
        return <RequestManagement type="outing" />;
      case "outpass":
        return <RequestManagement type="outpass" />;
      case "grievance":
        return <GrievanceList />;
      case "security":
        return <SecuritySection username={username} />;
      default:
        return (
          <div className="animate-in fade-in duration-500">
            <WebmasterOverview username={username} />
          </div>
        );
    }
  };

  return (
    <AdminShell
      navGroups={navGroups}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as any)}
      onLogout={logout}
      username={username}
      collapseBranding="hide"
      navSpacing="compact"
    >
      {renderContent()}
    </AdminShell>
  );
}
