/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, type ReactNode } from "react";
import { LogOut, Search, Menu, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import ProfilePopup from "@/pages/admin/ProfilePopup";
import {
  adminPageClass,
  adminSidebarClass,
  adminSidebarOpenWidth,
  adminSidebarClosedWidth,
  adminSidebarToggleClass,
  adminNavGroupLabelClass,
  adminNavInactiveClass,
  adminNavIconActiveClass,
  adminNavIconInactiveClass,
  adminHeaderClass,
  adminAvatarButtonClass,
  adminAvatarFallbackClass,
  adminLogoutPillClass,
  adminSearchInputClass,
} from "./admin-ui";
import { UnizLogo } from "./UnizLogo";
import { SiteLegalFooter } from "@/components/SiteLegalFooter";

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  group: string | null;
  items: AdminNavItem[];
}

export interface AdminShellProps {
  navGroups: AdminNavGroup[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout: () => void;
  children: ReactNode;
  username: string;

  roleLabel?: string;
  headerSubtitle?: string;
  searchSlot?: ReactNode;
  searchExtra?: ReactNode;
  enableNavSearch?: boolean;
  sidebarFooter?: ReactNode;
  showSidebarProfile?: boolean;
  headerLeft?: ReactNode;
  headerAlign?: "between" | "end";
  mobileNavItems?: AdminNavItem[];
  collapseBranding?: "hide" | "abbreviate";
  sidebarVariant?: "default" | "overlay-mobile";
  contentClassName?: string;
  navSpacing?: "compact" | "default";
  showHeaderMenuToggle?: boolean;
}

export default function AdminShell({
  navGroups,
  activeTab,
  onTabChange,
  onLogout,
  children,
  username,
  roleLabel,
  headerSubtitle,
  searchSlot,
  searchExtra,
  enableNavSearch = false,
  sidebarFooter,
  showSidebarProfile = false,
  headerLeft,
  headerAlign: _headerAlign = "end",
  mobileNavItems,
  collapseBranding = "hide",
  sidebarVariant = "default",
  contentClassName,
  navSpacing = "default",
  showHeaderMenuToggle: _showHeaderMenuToggle = false,
}: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const headerAvatarRef = useRef<HTMLButtonElement>(null);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const [activeAnchor, setActiveAnchor] =
    useState<React.RefObject<HTMLButtonElement | null>>(headerAvatarRef);

  const initial = (profileName || username)[0]?.toUpperCase() ?? "A";

  useEffect(() => {
    const token = (localStorage.getItem("admin_token") || "").replace(/"/g, "");
    if (token) {
      import("@/api/endpoints").then(({ BASE_URL }) => {
        fetch(`${BASE_URL}/profile/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setProfilePhoto(data.data.profile_url ?? null);
              setProfileName(data.data.name ?? null);
              setProfileEmail(data.data.email ?? null);
            }
          })
          .catch(() => {});
      });
    }
  }, []);

  const allNavItems = navGroups.flatMap((g) => g.items);
  const _activeLabel = allNavItems.find((i) => i.id === activeTab)?.label;
  void _headerAlign;
  void _showHeaderMenuToggle;
  void _activeLabel;

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const openProfile = (ref: React.RefObject<HTMLButtonElement | null>) => {
    setActiveAnchor(ref);
    setProfilePopupOpen(true);
  };

  const renderSearch = () => {
    if (searchSlot) return searchSlot;
    if (!enableNavSearch) return null;

    return (
      <div className="space-y-3 px-5 py-4">
        <div className="group relative">
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-white/50 transition-colors group-focus-within:text-white",
              isSidebarOpen ? "left-3" : "left-1/2 -translate-x-1/2",
            )}
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isSidebarOpen ? "Search operations..." : ""}
            className={cn(
              "w-full min-h-10 rounded-[1px] border border-[#d9d9d9] bg-white text-[13px] font-medium text-[#0A2540] placeholder:text-[#5A7A94] focus:outline-none focus:ring-1 focus:ring-[#0A2540]/20",
              isSidebarOpen ? "pl-10 pr-8" : "px-0 text-center",
            )}
          />
          {isSidebarOpen && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[1px] border border-[#E8E8E8] bg-[#FAFAFA] px-1.5 py-0.5 text-[9px] font-bold text-[#5A7A94]">
              /
            </div>
          )}
        </div>
        {searchExtra && isSidebarOpen && searchExtra}
      </div>
    );
  };

  const sidebarWidth = isSidebarOpen
    ? adminSidebarOpenWidth
    : adminSidebarClosedWidth;

  const isOverlayMobile = sidebarVariant === "overlay-mobile";

  return (
    <div className={cn(adminPageClass, "h-screen flex-col")}>
      <header
        className={cn(
          adminHeaderClass,
          "justify-between",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="inline-flex h-8 w-8 items-center justify-center text-white/80 hover:text-white md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <a href="/" className="flex items-center gap-2.5 text-white no-underline">
            <img
              src="/logo.png"
              alt="UniZ — RGUKT Ongole"
              className="h-8 w-8 shrink-0 rounded-full bg-white object-contain ring-1 ring-white/25 shadow-sm"
            />
            <span className="text-[15px] font-bold uppercase tracking-[1.5px]">Exam Cell</span>
          </a>
          {headerLeft}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-bold uppercase leading-none tracking-[0.4px] text-white">
              {profileName || username}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.5px] text-white/70">
              {headerSubtitle || profileEmail || `${username}@rguktong.ac.in`}
            </p>
          </div>
          <button
            ref={headerAvatarRef}
            onClick={() => openProfile(headerAvatarRef)}
            title="Profile"
            className={adminAvatarButtonClass}
          >
            {profilePhoto ? (
              <img src={profilePhoto} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className={adminAvatarFallbackClass}>{initial}</div>
            )}
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
      <aside
        className={cn(
          adminSidebarClass,
          isOverlayMobile
            ? cn(
                "flex fixed md:sticky top-0 z-[70]",
                isSidebarOpen
                  ? "translate-x-0 w-72"
                  : "-translate-x-full md:translate-x-0 w-72 md:w-20",
              )
            : cn("hidden md:flex sticky top-0", sidebarWidth),
        )}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={adminSidebarToggleClass}
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={isSidebarOpen ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
          </svg>
        </button>

        <div
          className={cn(
            "px-4 pt-5 pb-3 transition-all duration-300",
            collapseBranding === "hide" &&
              !isSidebarOpen &&
              "h-0 overflow-hidden pt-0 pb-0 opacity-0",
          )}
        >
          <UnizLogo
            variant="sidebar"
            collapsed={!isSidebarOpen}
            abbreviate={collapseBranding === "abbreviate"}
          />
        </div>

        {renderSearch()}

        <nav
          className={cn(
            "flex-1 overflow-y-auto custom-sidebar-scroll",
            isSidebarOpen ? "px-3" : "px-3",
            navSpacing === "default" ? "py-4 space-y-5" : "py-2 space-y-4",
          )}
        >
          {filteredGroups.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Search size={20} className="text-[#5A7A94]" />
              </div>
              <p className="px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5A7A94]">
                No operations found
              </p>
            </div>
          ) : (
            filteredGroups.map((group, gIdx) => (
              <div
                key={gIdx}
                className={navSpacing === "default" ? "space-y-1" : "space-y-0.5"}
              >
                {group.group && isSidebarOpen && (
                  <h4 className={adminNavGroupLabelClass}>{group.group}</h4>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={!isSidebarOpen ? item.label : ""}
                      className={cn(
                        "group relative flex w-full items-center rounded-[2px] py-2.5 text-left uppercase tracking-[0.5px] transition-colors duration-150",
                        isSidebarOpen
                          ? "space-x-3 px-3"
                          : "justify-center px-0",
                        isActive ? "text-[#0A2540]" : adminNavInactiveClass,
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="adminActiveTabGlow"
                          className="absolute inset-0 rounded-[2px] bg-white shadow-sm"
                          initial={false}
                          transition={{ type: "spring", stiffness: 420, damping: 38 }}
                        />
                      )}
                      <div className="relative z-10 flex min-w-[20px] items-center justify-center">
                        <Icon
                          size={18}
                          strokeWidth={2}
                          className={cn(
                            "shrink-0 transition-colors",
                            isActive
                              ? adminNavIconActiveClass
                              : adminNavIconInactiveClass,
                          )}
                        />
                      </div>
                      {isSidebarOpen && (
                        <span
                          className={cn(
                            "relative z-10 whitespace-nowrap text-[12px] font-bold leading-none",
                            isActive ? "font-bold" : "font-semibold",
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}

          <div className="mt-auto p-3">
            <button type="button" onClick={onLogout} className={adminLogoutPillClass}>
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </nav>

        <div className="mt-auto space-y-3 border-t border-[#d9d9d9] p-3 pb-5">
          {sidebarFooter}
          {showSidebarProfile && (
            <div
              onClick={() => openProfile(avatarBtnRef)}
              className={cn(
                "group flex cursor-pointer items-center rounded-[2px] py-1.5 transition-colors hover:bg-white",
                isSidebarOpen ? "justify-start px-2" : "justify-center",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <button
                  ref={avatarBtnRef}
                  className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[1px] border border-[#d9d9d9] bg-white"
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-[#0A2540]">
                      {initial}
                    </span>
                  )}
                </button>
                {isSidebarOpen && (
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold leading-tight text-[#0A2540]">
                      {profileName || username}
                    </p>
                    {roleLabel && (
                      <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wider text-[#5A7A94]">
                        {roleLabel}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {isSidebarOpen && (
            <div className="space-y-2 px-2 pt-2">
              <div className="rounded-[2px] border border-[#d9d9d9] bg-white p-3.5 text-[#0A2540]">
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-[#5A7A94]">
                  Platform
                </p>
                <p className="mt-1 font-sans text-[13px] font-bold uppercase tracking-[1px] leading-tight">
                  Exam Cell Console
                </p>
                <p className="mt-1.5 font-form text-[10px] font-medium leading-relaxed text-[#5A7A94]">
                  RGUKT Ongole · Examination Cell
                </p>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="flex justify-center">
              <UnizLogo variant="sidebar" collapsed abbreviate={false} />
            </div>
          )}
        </div>
      </aside>

      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto bg-white",
          isOverlayMobile && "w-full",
        )}
      >
        <ProfilePopup
          username={username}
          anchorRef={activeAnchor}
          open={profilePopupOpen}
          onClose={() => setProfilePopupOpen(false)}
          onProfileUpdate={(p) => {
            setProfilePhoto(p.profile_url ?? null);
            setProfileName(p.name ?? null);
            setProfileEmail(p.email ?? null);
          }}
          onLogout={onLogout}
          initialPhoto={profilePhoto}
        />

        <div className={cn("w-full px-6 md:px-10 flex-1", contentClassName)}>
          {children}
        </div>

        {mobileNavItems && mobileNavItems.length > 0 && (
          <div className="sticky bottom-0 z-50 flex h-16 items-center justify-around border-t border-[#EEEEEE] bg-white px-2 shadow-examcell md:hidden">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex h-full flex-1 flex-col items-center justify-center gap-1 transition-all",
                    isActive ? "text-[#0A2540]" : "text-[#5A7A94]",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-[2px] p-1.5 transition-all",
                      isActive && "bg-[#FAFAFA]",
                    )}
                  >
                    <Icon size={isActive ? 20 : 18} />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-wider",
                      isActive ? "opacity-100" : "opacity-60",
                    )}
                  >
                    {item.label.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <SiteLegalFooter />
      </main>
      </div>
    </div>
  );
}
