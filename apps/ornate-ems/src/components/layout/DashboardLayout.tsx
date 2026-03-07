"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import type { User } from "next-auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  branding?: any;
}

export function DashboardLayout({
  children,
  user,
  onLogout,
  branding,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F7F8FA] overflow-hidden text-black">
      {/* Mobile Sidebar Overlay — hidden for EVENT_COORDINATOR */}
      {(user as any)?.role !== "EVENT_COORDINATOR" && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden for EVENT_COORDINATOR */}
      {(user as any)?.role !== "EVENT_COORDINATOR" && (
        <AppSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          onLogout={onLogout}
          branding={branding}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative">
        <AppHeader
          user={user as any}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 overflow-y-auto w-full custom-scrollbar bg-white ${(user as any)?.role === "EVENT_COORDINATOR" ? "px-6 md:px-12 lg:px-20 pt-6 md:pt-8" : ""}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
