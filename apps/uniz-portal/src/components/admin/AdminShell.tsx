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
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(min-width: 1024px)").matches,
  );
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
              "absolute top-1/2 -translate-y-1/2 text-ink-subtle transition-colors group-focus-within:text-navy",
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
              "w-full min-h-10 rounded-lg border border-line bg-white text-sm font-medium text-navy-900 placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-navy/20",
              isSidebarOpen ? "pl-10 pr-8" : "px-0 text-center",
            )}
          />
          {isSidebarOpen && (
 <div className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 text-xs text-ink-subtle">
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

  const isOverlayMobile =
    sidebarVariant === "overlay-mobile" || sidebarVariant === "default";
  const closeIfNarrow = () => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={cn(adminPageClass, "h-screen flex-col")}>
      <header
        className={cn(
          adminHeaderClass,
          "z-[80] justify-between",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
 className="inline-flex h-10 w-10 items-center justify-center rounded-md text-navy-900 hover:bg-surface-2 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
 <a href="/" className="flex items-center gap-3 text-navy-900 no-underline">
            <img
              src="/rgukt-logo.png"
              alt="RGUKT Ongole"
              className="h-10 w-10 shrink-0 object-contain"
            />
 <span className="truncate font-serif text-[1.35rem] font-semibold leading-none tracking-tight">
              uniZ
            </span>
          </a>
          {headerLeft}
        </div>
        <div className="ml-auto flex items-center gap-3">
 <div className="hidden min-w-0 max-w-[42vw] text-right sm:block">
 <p className="truncate text-sm font-medium leading-none text-navy-900">
              {profileName || username}
            </p>
 <p className="mt-1 text-xs text-ink-muted">
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
      <div className="flex min-h-0 min-w-0 flex-1">
      {isOverlayMobile && isSidebarOpen && (
        <button
          type="button"
 className="fixed inset-0 z-[60] bg-navy-950/45 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          adminSidebarClass,
          "max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-[68px] max-lg:z-[70] max-lg:h-[calc(100dvh-68px)] max-lg:w-72 max-lg:transition-transform",
          isSidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          "lg:sticky lg:top-0 lg:flex lg:h-auto lg:translate-x-0",
          sidebarWidth,
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
 <Search size={20} className="text-navy-400" />
              </div>
 <p className="px-4 text-[11px] font-medium text-navy-400">
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
                        closeIfNarrow();
                      }}
                      title={!isSidebarOpen ? item.label : ""}
                      className={cn(
                        "group relative flex w-full items-center rounded-lg py-2.5 text-left text-sm font-medium transition-colors duration-150",
                        isSidebarOpen
                          ? "space-x-3 px-3"
                          : "justify-center px-0",
                        isActive ? "text-navy" : adminNavInactiveClass,
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="adminActiveTabGlow"
 className="absolute inset-0 rounded-lg bg-surface-2"
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
                            "relative z-10 whitespace-nowrap text-sm font-medium leading-none",
                            isActive ? "font-medium" : "font-semibold",
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
                "group flex cursor-pointer items-center rounded-lg py-1.5 transition-colors hover:bg-white",
                isSidebarOpen ? "justify-start px-2" : "justify-center",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <button
                  ref={avatarBtnRef}
 className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#d9d9d9] bg-white"
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : (
 <span className="text-[11px] font-medium text-navy">
                      {initial}
                    </span>
                  )}
                </button>
                {isSidebarOpen && (
                  <div className="min-w-0">
 <p className="truncate text-[13px] font-medium leading-tight text-navy">
                      {profileName || username}
                    </p>
                    {roleLabel && (
 <p className="mt-0.5 truncate text-[9px] font-medium text-navy-400">
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
 <div className="rounded-lg border border-line bg-surface p-3.5 text-navy-900">
 <p className="text-sm text-ink-muted">Portal</p>
 <p className="mt-1 font-serif text-lg font-medium leading-tight">uniZ</p>
 <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  RGUKT Ongole campus
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

 <div className={cn("w-full min-w-0 flex-1 px-3 py-4 sm:px-4 md:px-8 lg:px-10", contentClassName)}>
          {children}
        </div>

        {mobileNavItems && mobileNavItems.length > 0 && (
 <div className="sticky bottom-0 z-50 flex h-16 items-center justify-around border-t border-line bg-white px-2 md:hidden">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex h-full flex-1 flex-col items-center justify-center gap-1 transition-all",
                    isActive ? "text-navy" : "text-navy-400",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-md p-1.5 transition-colors duration-150",
                      isActive && "bg-surface",
                    )}
                  >
                    <Icon size={isActive ? 20 : 18} />
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium",
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
