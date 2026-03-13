"use client";
import React, { useState, useEffect } from "react";
import { LogOut, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

interface SidebarProps {
  className?: string;
  items: NavigationItem[];
  activeItem: string;
  onItemClick: (itemId: string, href: string) => void;
  userData?: {
    name?: string;
    profile_url?: string;
  };
  onLogout: () => void;
}

export function ModernSidebar({
  className = "",
  items,
  activeItem,
  onItemClick,
  userData,
  onLogout,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleItemClickInternal = (item: NavigationItem) => {
    onItemClick(item.id, item.href);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-white shadow-md border border-slate-100 md:hidden hover:bg-slate-50 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <X className="h-5 w-5 text-slate-600" />
        ) : (
          <Menu className="h-5 w-5 text-slate-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-72"}
          md:translate-x-0 md:static md:z-auto
          ${className}
        `}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/60">
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
                <img
                  src="/assets/ongole_logo1.png"
                  className="h-full w-full object-contain"
                  alt="Ongole Logo"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-navy-900 text-lg tracking-tight">
                  uniZ
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Student Portal
                </span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mx-auto p-1 border border-slate-100">
              <img
                src="/assets/ongole_logo1.png"
                className="h-full w-full object-contain"
                alt="Ongole Logo"
              />
            </div>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-md hover:bg-slate-100 transition-all duration-200 ml-2"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-3">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClickInternal(item)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-3 rounded-md text-left transition-all duration-200 group relative
                      ${
                        isActive
                          ? "bg-navy-50 text-navy-900 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                      ${isCollapsed ? "justify-center px-2" : ""}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center min-w-[24px]">
                      <Icon
                        className={`
                          h-[22px] w-[22px] flex-shrink-0
                          ${
                            isActive
                              ? "text-navy-900"
                              : "text-slate-400 group-hover:text-slate-700"
                          }
                        `}
                      />
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-[16px] ${isActive ? "font-semibold" : "font-medium"}`}
                        >
                          {item.name}
                        </span>
                        {item.badge && (
                          <span
                            className={`
                            px-1.5 py-0.5 text-[10px] font-bold rounded-full
                            ${
                              isActive
                                ? "bg-navy-100 text-navy-900"
                                : "bg-slate-100 text-slate-600"
                            }
                          `}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Badge for collapsed state */}
                    {isCollapsed && item.badge && (
                      <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-navy-100 border border-white">
                        <span className="text-[10px] font-medium text-navy-900">
                          {parseInt(item.badge) > 9 ? "9+" : item.badge}
                        </span>
                      </div>
                    )}

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1.5 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                        {item.name}
                        {item.badge && (
                          <span className="ml-1.5 px-1 py-0.5 bg-slate-700 rounded-full text-[10px]">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-900 rotate-45" />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-slate-200">
          {/* Profile Section */}
          <div
            className={`border-b border-slate-200 bg-slate-50/30 ${isCollapsed ? "py-4 px-2" : "p-4"}`}
          >
            {!isCollapsed ? (
              <div className="flex items-center px-3 py-2.5 rounded-lg bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 group">
                <div className="w-9 h-9 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                  {userData?.profile_url ? (
                    <img
                      src={userData.profile_url}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-700 font-bold text-sm">
                      {userData?.name?.charAt(0) || "S"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 ml-3">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {userData?.name || "Student"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate uppercase tracking-wider">
                    Member
                  </p>
                </div>
                <div
                  className="w-2 h-2 bg-green-500 rounded-full ml-2 ring-4 ring-green-50"
                  title="Online"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative group cursor-pointer">
                  <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center overflow-hidden border border-slate-200 hover:border-navy-100 transition-colors">
                    {userData?.profile_url ? (
                      <img
                        src={userData.profile_url}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-800 font-bold text-sm">
                        {userData?.name?.charAt(0) || "S"}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />

                  {/* Tooltip for profile */}
                  <div className="absolute left-full ml-4 px-2 py-1.5 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                    {userData?.name || "Profile"}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-900 rotate-45" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-3">
            <button
              onClick={onLogout}
              className={`
                w-full flex items-center rounded-md text-left transition-all duration-200 group relative
                text-red-600 hover:bg-red-50 hover:text-red-700
                ${isCollapsed ? "justify-center p-2.5" : "space-x-2.5 px-3 py-2.5"}
              `}
              title={isCollapsed ? "Logout" : undefined}
            >
              <div className="flex items-center justify-center min-w-[24px]">
                <LogOut className="h-5 w-5 flex-shrink-0 text-red-500 group-hover:text-red-600" />
              </div>

              {!isCollapsed && (
                <span className="text-sm font-semibold">Logout</span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1.5 bg-slate-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                  Logout
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-900 rotate-45" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
