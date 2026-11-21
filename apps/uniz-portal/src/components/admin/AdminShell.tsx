import { useState, useRef, type ReactNode } from "react";
import { LogOut, Search, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfilePopup from "@/pages/admin/ProfilePopup";
import {
  adminNavGroupLabelClass,
  adminNavInactiveClass,
  adminSearchInputClass,
} from "./admin-ui";
import { AppIcon, Lockup } from "@/components/brand/Mark";
import { Avatar } from "@/components/ui/avatar";
import { rememberAdminProfile, useAdminProfile } from "@/api/adminProfile";

function AccountLine({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const at = value.indexOf("@");
  if (at <= 0) {
    return (
      <p className={cn("break-words", className)} title={value}>
        {value}
      </p>
    );
  }
  return (
    <p className={className} title={value}>
      <span className="block">{value.slice(0, at + 1)}</span>
      <span className="block break-all">{value.slice(at + 1)}</span>
    </p>
  );
}

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
  headerExtra?: ReactNode;
  mobileHeaderExtra?: ReactNode;
  headerAlign?: "between" | "end";
  mobileNavItems?: AdminNavItem[];
  /** Accepted from existing dashboards. The collapsed rail always centers the app icon. */
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
  headerExtra,
  mobileHeaderExtra,
  headerAlign = "end",
  contentClassName,
  navSpacing = "default",
  showHeaderMenuToggle = false,
}: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const { profile } = useAdminProfile();
  const [profileOverride, setProfileOverride] = useState<{
    profile_url?: string | null;
    name?: string | null;
    email?: string | null;
  } | null>(null);
  const profilePhoto = profileOverride?.profile_url ?? profile?.profile_url ?? null;
  const profileName = profileOverride?.name ?? profile?.name ?? null;
  const profileEmail = profileOverride?.email ?? profile?.email ?? null;
  const [searchQuery, setSearchQuery] = useState("");

  const headerAvatarRef = useRef<HTMLButtonElement>(null);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);
  const [activeAnchor, setActiveAnchor] =
    useState<React.RefObject<HTMLButtonElement | null>>(headerAvatarRef);

  const displayName = profileName || username;

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
    setMenuOpen(false);
  };

  const selectTab = (id: string) => {
    onTabChange(id);
    setMobileOpen(false);
  };

  const sidebar = (mobile: boolean) => (
    <aside
      className={cn(
        "flex h-full min-h-0 w-[248px] shrink-0 flex-col border-r border-[var(--sb-border)] bg-navy-900 text-navy-300",
        mobile ? "h-dvh w-[280px]" : isSidebarOpen ? "w-[248px]" : "w-[72px]",
      )}
      data-admin-chrome=""
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-[var(--sb-div)] px-3",
          !mobile && !isSidebarOpen && "justify-center",
        )}
      >
        {!mobile && !isSidebarOpen ? (
          <AppIcon title="uniZ" />
        ) : (
          <Lockup height={32} tone="chrome" title="uniZ" />
        )}
        {mobile ? (
          <button
            type="button"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>

      {enableNavSearch && (mobile || isSidebarOpen) ? (
        <div className="shrink-0 px-3 py-3">
          <div className="relative">
            <Search
              size={16}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search sections"
              className={cn(adminSearchInputClass, "bg-navy-800 pl-9 text-white placeholder:text-navy-300")}
            />
          </div>
          {searchExtra}
        </div>
      ) : null}

      <nav
        className={cn(
          "admin-nav-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3",
          navSpacing === "default" ? "py-2" : "py-1",
        )}
        aria-label="Administration"
      >
        {filteredGroups.length === 0 && searchQuery ? (
          <p className="px-3 py-6 text-small text-navy-300">No sections found</p>
        ) : (
          filteredGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {group.group && (mobile || isSidebarOpen) ? (
                <h4 className={adminNavGroupLabelClass}>{group.group}</h4>
              ) : null}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectTab(item.id)}
                      title={!mobile && !isSidebarOpen ? item.label : undefined}
                      className={cn(
                        "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-dense transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        !mobile && !isSidebarOpen && "justify-center px-0",
                        isActive
                          ? "bg-navy-800 font-semibold text-white"
                          : adminNavInactiveClass,
                      )}
                    >
                      <Icon size={18} strokeWidth={1.75} aria-hidden className="shrink-0" />
                      {mobile || isSidebarOpen ? (
                        <span className="truncate">{item.label}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      <div className="mt-auto shrink-0 border-t border-[var(--sb-div)] p-3">
        {sidebarFooter}
        <div className={cn("flex items-center gap-3", !mobile && !isSidebarOpen && "flex-col")}>
          <button
            ref={avatarBtnRef}
            type="button"
            className="rounded-full"
            aria-label="Profile"
            onClick={() => showSidebarProfile && openProfile(avatarBtnRef)}
          >
            <Avatar
              size={36}
              src={profilePhoto}
              alt={displayName ? `${displayName} profile photo` : "Profile photo"}
              name={displayName}
            />
          </button>
          {mobile || isSidebarOpen ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-dense font-semibold text-white">{displayName}</p>
              <AccountLine
                className="text-small leading-4 text-navy-300"
                value={roleLabel || headerSubtitle || profileEmail || username}
              />
            </div>
          ) : null}
          <button type="button" onClick={onLogout} className="flex h-10 w-10 items-center justify-center rounded-full text-navy-300 hover:bg-white/[0.06] hover:text-white" aria-label="Log out">
            <LogOut size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {mobile ? null : (
          <button
            type="button"
            onClick={() => setIsSidebarOpen((value) => !value)}
            className="mt-2 flex h-10 w-full items-center justify-center rounded-md text-small font-medium text-navy-300 hover:bg-white/[0.06] hover:text-white"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="fixed inset-x-0 top-0 z-20 flex h-app-frame w-full overflow-hidden bg-bg text-text">
      <div className="sticky top-0 hidden h-full shrink-0 self-start min-[821px]:flex">{sidebar(false)}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 min-[821px]:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-overlay"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute bottom-0 left-0 top-0 h-full">{sidebar(true)}</div>
        </div>
      ) : null}

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header data-admin-chrome="" className="z-30 flex h-[60px] shrink-0 items-center gap-2 bg-navy-900 px-3 text-white min-[821px]:hidden">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} strokeWidth={1.75} aria-hidden />
          </button>
          <AppIcon title="uniZ" />
          <p className="min-w-0 flex-1 truncate text-[17px] font-semibold leading-6">
            {activeLabel || "Admin"}
          </p>
          {mobileHeaderExtra}
          <button
            type="button"
            aria-label="Account menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Avatar size={32} src={profilePhoto} alt="" name={displayName} />
          </button>
        </header>

        <header
          data-admin-chrome=""
          className={cn(
            "z-30 hidden h-16 shrink-0 items-center gap-3 border-b border-border bg-bg px-10 min-[821px]:flex",
            headerAlign === "between" || headerLeft ? "justify-between" : "justify-end",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            {showHeaderMenuToggle ? (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full text-text-2 hover:bg-tint"
                aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                onClick={() => setIsSidebarOpen((value) => !value)}
              >
                <Menu size={18} strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
            {headerLeft}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {headerExtra}
            {searchSlot}
            <button
              ref={headerAvatarRef}
              type="button"
              className="rounded-full"
              aria-label="Account menu"
              aria-expanded={profilePopupOpen}
              onClick={() => openProfile(headerAvatarRef)}
            >
              <Avatar
                size={36}
                src={profilePhoto}
                alt={displayName ? `${displayName} profile photo` : "Profile photo"}
                name={displayName}
              />
            </button>
          </div>
        </header>

        {menuOpen ? (
          <div className="fixed right-3 top-16 z-50 w-56 rounded-lg border border-border bg-surface p-2 shadow-md dark:shadow-none min-[821px]:hidden">
            <p className="px-3 py-2 text-dense font-semibold text-head">{displayName}</p>
            <AccountLine
              className="px-3 pb-2 text-small leading-4 text-text-2"
              value={headerSubtitle || profileEmail || username}
            />
            <button
              type="button"
              className="flex h-10 w-full items-center rounded-sm px-3 text-left text-dense font-medium text-text-2 hover:bg-tint"
              onClick={onLogout}
            >
              Log out
            </button>
          </div>
        ) : null}

        <ProfilePopup
          username={username}
          anchorRef={activeAnchor}
          open={profilePopupOpen}
          onClose={() => setProfilePopupOpen(false)}
          onProfileUpdate={(p) => {
            setProfileOverride({
              profile_url: p.profile_url ?? null,
              name: p.name ?? null,
              email: p.email ?? null,
            });
            rememberAdminProfile({
              profile_url: p.profile_url,
              name: p.name,
              email: p.email,
            });
          }}
          onLogout={onLogout}
          initialPhoto={profilePhoto}
        />

        <div className={cn("min-h-0 min-w-0 w-full flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 min-[821px]:px-10 min-[821px]:py-8", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
