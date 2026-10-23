/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, type ReactNode } from "react";
import { LogOut, Search, ChevronLeft, Menu, type LucideIcon } from "lucide-react";
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
              "w-full min-h-10 rounded-[1px] border border-white/20 bg-white/10 text-[13px] font-medium text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30",
              isSidebarOpen ? "pl-10 pr-8" : "px-0 text-center",
            )}
          />
          {isSidebarOpen && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[1px] border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/50">
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
    <div className={adminPageClass}>
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
                <Search size={20} className="text-white/50" />
              </div>
              <p className="px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
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
                        isActive ? "text-white" : adminNavInactiveClass,
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="adminActiveTabGlow"
                          className="absolute inset-0 rounded-[2px] bg-white/15"
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

          <div className="mt-1 border-t border-white/15 pt-3">
            <button
              onClick={onLogout}
              title={!isSidebarOpen ? "Logout" : ""}
              className={cn(
                "group flex w-full items-center rounded-[2px] py-2.5 text-left text-white/70 transition-colors duration-150 hover:bg-[#EA2027] hover:text-white",
                isSidebarOpen ? "space-x-3 px-3" : "justify-center px-0",
              )}
            >
              <div className="flex min-w-[20px] items-center justify-center">
                <LogOut size={18} strokeWidth={2} className="transition-colors" />
              </div>
              {isSidebarOpen && (
                <span className="whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.5px] leading-none">
                  Logout
                </span>
              )}
            </button>
          </div>
        </nav>

        <div className="mt-auto space-y-3 border-t border-white/15 p-3 pb-5">
          {sidebarFooter}
          {showSidebarProfile && (
            <div
              onClick={() => openProfile(avatarBtnRef)}
              className={cn(
                "group flex cursor-pointer items-center rounded-[2px] py-1.5 transition-colors hover:bg-white/10",
                isSidebarOpen ? "justify-start px-2" : "justify-center",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <button
                  ref={avatarBtnRef}
                  className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[1px] border border-white/30 bg-white/10 transition-transform group-hover:scale-105"
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-white">
                      {initial}
                    </span>
                  )}
                </button>
                {isSidebarOpen && (
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold leading-tight text-white">
                      {profileName || username}
                    </p>
                    {roleLabel && (
                      <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wider text-white/50">
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
              <div className="rounded-[2px] border border-white/15 bg-white/10 p-3.5 text-white">
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                  Platform
                </p>
                <p className="mt-1 font-sans text-[13px] font-bold uppercase tracking-[1px] leading-tight">
                  Exam Cell Console
                </p>
                <p className="mt-1.5 font-form text-[10px] font-medium leading-relaxed text-white/40">
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
          "flex-1 overflow-y-auto max-h-screen flex flex-col",
          isOverlayMobile && "w-full",
        )}
      >
        <header
          className={cn(
            adminHeaderClass,
            headerAlign === "between" || showHeaderMenuToggle || headerLeft
              ? "justify-between"
              : "justify-end",
          )}
        >
          <div className="flex items-center gap-4">
            {showHeaderMenuToggle && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-[1px] border border-white/20 bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white active:scale-95"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
              </button>
            )}
            {headerLeft}
            {showHeaderMenuToggle && !isSidebarOpen && activeLabel && (
              <h1 className="hidden font-sans text-[15px] font-bold uppercase tracking-[1px] text-white md:block">
                {activeLabel}
              </h1>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3.5 pt-1.5">
            <div className="hidden text-right sm:block">
              <p className="text-[13.5px] font-bold uppercase tracking-[0.5px] leading-snug text-white">
                {profileName || username}
              </p>
              <p className="mt-1 text-[11px] font-medium lowercase leading-normal text-white/60">
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
      </main>
    </div>
  );
}
