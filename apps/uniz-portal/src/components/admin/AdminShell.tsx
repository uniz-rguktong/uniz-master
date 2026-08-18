/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  LogOut,
  Search,
  ChevronLeft,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LandingMeshBackdrop } from "@/components/ui/landing-section";
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
  adminLogoutButtonClass,
  adminSearchInputClass,
} from "./admin-ui";
import { UnizLogo } from "./UnizLogo";

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
  headerAlign = "end",
  mobileNavItems,
  collapseBranding = "hide",
  sidebarVariant = "default",
  contentClassName,
  navSpacing = "default",
  showHeaderMenuToggle = false,
}: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
  const activeLabel = allNavItems.find((i) => i.id === activeTab)?.label;

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
      <div className="px-5 py-4 space-y-3">
        <div className="relative group">
          <Search
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-600 transition-colors",
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
              adminSearchInputClass,
              isSidebarOpen ? "pl-10 pr-8" : "px-0 text-center",
            )}
          />
          {isSidebarOpen && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white border border-zinc-200/60 rounded text-[9px] font-bold text-zinc-400 ">
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
  const shouldShowHeaderToggle = showHeaderMenuToggle || isMobileViewport;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncViewport = (matches: boolean) => {
      setIsMobileViewport(matches);
      if (!matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    syncViewport(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => syncViewport(event.matches);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const toggleSidebar = () => {
    if (isMobileViewport) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className={adminPageClass}>
      <LandingMeshBackdrop />

      <aside
        className={cn(
          adminSidebarClass,
          isMobileViewport
            ? cn(
                "fixed top-0 left-0 z-[70] w-72 transition-transform duration-300",
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
              )
            : isOverlayMobile
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
          onClick={toggleSidebar}
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
              <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-3">
                <Search size={20} className="text-zinc-300" />
              </div>
              <p className="text-[11px] font-bold text-zinc-400 tracking-[0.14em] px-4">
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
                      onClick={() => {
                        onTabChange(item.id);
                        if (isMobileViewport) setIsMobileSidebarOpen(false);
                      }}
                      title={!isSidebarOpen ? item.label : ""}
                      className={cn(
                        "w-full flex items-center py-2.5 rounded-lg text-left transition-colors duration-150 group relative",
                        isSidebarOpen
                          ? "space-x-3 px-3"
                          : "justify-center px-0",
                        isActive ? "text-white" : adminNavInactiveClass,
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="adminActiveTabGlow"
                          className="absolute inset-0 bg-navy-900 rounded-lg shadow-whisper-navy"
                          initial={false}
                          transition={{ type: "spring", stiffness: 420, damping: 38 }}
                        />
                      )}
                      <div className="flex items-center justify-center min-w-[20px] relative z-10">
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
                            "relative z-10 text-[13px] whitespace-nowrap tracking-[-0.01em] leading-none",
                            isActive ? "font-semibold" : "font-medium",
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

          <div className="pt-3 mt-1 border-t border-zinc-200/60">
            <button
              onClick={() => {
                onLogout();
                if (isMobileViewport) setIsMobileSidebarOpen(false);
              }}
              title={!isSidebarOpen ? "Logout" : ""}
              className={cn(
                "w-full flex items-center py-2.5 rounded-lg text-left transition-colors duration-150 group hover:bg-rose-50 hover:text-rose-600 text-zinc-500",
                isSidebarOpen ? "space-x-3 px-3" : "justify-center px-0",
              )}
            >
              <div className="flex items-center justify-center min-w-[20px]">
                <LogOut
                  size={18}
                  strokeWidth={2}
                  className="text-zinc-400 group-hover:text-rose-600 transition-colors"
                />
              </div>
              {isSidebarOpen && (
                <span className="text-[13px] font-medium whitespace-nowrap tracking-[-0.01em] leading-none">
                  Logout
                </span>
              )}
            </button>
          </div>
        </nav>

        <div className="mt-auto border-t border-zinc-100/80 p-3 pb-5 space-y-3">
          {sidebarFooter}
          {showSidebarProfile && (
            <div
              onClick={() => openProfile(avatarBtnRef)}
              className={cn(
                "flex items-center py-1.5 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer group",
                isSidebarOpen ? "justify-start px-2" : "justify-center",
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  ref={avatarBtnRef}
                  className="w-8 h-8 rounded-xl overflow-hidden border-2 border-white shrink-0 bg-zinc-100 flex items-center justify-center shadow-sm ring-1 ring-zinc-200/60 transition-transform group-hover:scale-105"
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="text-zinc-600 font-bold text-[11px]">
                      {initial}
                    </span>
                  )}
                </button>
                {isSidebarOpen && (
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-zinc-900 truncate leading-tight">
                      {profileName || username}
                    </p>
                    {roleLabel && (
                      <p className="text-[9px] font-bold text-zinc-400 tracking-wider truncate mt-0.5">
                        {roleLabel}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {isSidebarOpen && (
            <div className="px-2 pt-2 space-y-2">
              <div className="rounded-xl bg-gradient-to-br from-navy-900 to-navy-800 p-3.5 text-white">
                <p className="text-[10px] font-bold tracking-[0.12em] text-white/50 uppercase">
                  Platform
                </p>
                <p className="text-[13px] font-semibold mt-1 leading-tight">
                  uniZ Admin Console
                </p>
                <p className="text-[10px] text-white/40 font-medium mt-1.5 leading-relaxed">
                  RGUKT Ongole &middot; Microservices v1.3
                </p>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="flex justify-center">
              <UnizLogo collapsed abbreviate={false} />
            </div>
          )}
        </div>
      </aside>

      {isMobileViewport && isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-zinc-950/45 backdrop-blur-[1px] z-[60] md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <main
        className={cn(
          "flex-1 overflow-y-auto max-h-screen flex flex-col",
          isOverlayMobile && "w-full",
        )}
      >
        <header
          className={cn(
            adminHeaderClass,
            headerAlign === "between" || shouldShowHeaderToggle || headerLeft
              ? "justify-between"
              : "justify-end",
          )}
        >
          <div className="flex items-center gap-4">
            {shouldShowHeaderToggle && (
              <button
                onClick={toggleSidebar}
                className="w-10 h-10 flex items-center justify-center bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-white hover:shadow-lg transition-all text-zinc-400 hover:text-zinc-950 active:scale-95"
                aria-label="Toggle sidebar"
              >
                {isMobileViewport ? (
                  isMobileSidebarOpen ? (
                    <X size={18} />
                  ) : (
                    <Menu size={18} />
                  )
                ) : isSidebarOpen ? (
                  <ChevronLeft size={18} />
                ) : (
                  <Menu size={18} />
                )}
              </button>
            )}
            {headerLeft}
            {shouldShowHeaderToggle &&
              (isMobileViewport || !isSidebarOpen) &&
              activeLabel && (
              <h1 className="font-bold text-zinc-900 text-[15px] truncate max-w-[48vw]">
                {activeLabel}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-3.5 ml-auto pt-1.5">
            <div className="text-right hidden sm:block">
              <p className="text-[13.5px] font-semibold text-zinc-900 tracking-[-0.01em] leading-snug">
                {profileName || username}
              </p>
              <p className="text-[11px] text-zinc-400 font-medium mt-1 lowercase leading-normal">
                {headerSubtitle ||
                  profileEmail ||
                  `${username}@rguktong.ac.in`}
              </p>
            </div>

            <button
              ref={headerAvatarRef}
              onClick={() => openProfile(headerAvatarRef)}
              title="Profile"
              className={adminAvatarButtonClass}
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <div className={adminAvatarFallbackClass}>{initial}</div>
              )}
            </button>

            <button
              onClick={onLogout}
              title="Sign out"
              className={adminLogoutButtonClass}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

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

        <div className={cn("w-full px-4 sm:px-6 md:px-10 flex-1", contentClassName)}>
          {children}
        </div>

        {mobileNavItems && mobileNavItems.length > 0 && (
          <div className="md:hidden h-16 bg-white/90 backdrop-blur-xl border-t border-zinc-100 flex items-center justify-around px-2 sticky bottom-0 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex flex-col items-center justify-center h-full flex-1 gap-1 transition-all",
                    isActive ? "text-zinc-950" : "text-zinc-400",
                  )}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-xl transition-all",
                      isActive && "bg-zinc-100",
                    )}
                  >
                    <Icon size={isActive ? 20 : 18} />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-wider",
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
      </main>
    </div>
  );
}
