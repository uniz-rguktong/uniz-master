"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  Search,
  Bell,
  User,
  Send,
  Plus,
  Clock,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { navigationConfig } from "@/config/navigation";
import { NotificationPopover } from "@/components/NotificationPopover";
import { NotificationModal } from "@/components/NotificationModal";

import type { User as BaseUser } from "@/lib/permissions";

// Extended User specific for frontend usage
interface User extends BaseUser {
  name?: string | null;
  email?: string | null;
  profilePicture?: string | null;
  image?: string | null;
}

interface AppHeaderProps {
  onMenuClick: () => void;
  user?: User;
  onLogout?: () => void;
}

interface SearchSuggestion {
  label: string;
  path: string;
  description: string;
  keywords: string[];
}

type RoleNavigationKey = keyof typeof navigationConfig;

export function AppHeader({ onMenuClick, user, onLogout }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] =
    useState(-1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const searchContainerRef = useRef<HTMLFormElement | null>(null);

  // Dynamic Breadcrumbs
  const getBreadcrumb = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";

    const isLikelyResourceId = (segment: string) => {
      if (!segment) return false;
      if (/^[0-9]+$/.test(segment)) return true;
      if (/^[a-z0-9]{16,}$/i.test(segment)) return true;
      if (/^[a-z0-9_-]{24,}$/i.test(segment)) return true;
      return false;
    };

    // Map common segments to readable names
    const readabilityMap: Record<string, string> = {
      "super-admin": "Mission Control",
      "branch-admin": "Overview",
      hho: "HHO Dashboard",
      sports: "Sports Admin",
      "clubs-portal": "Club Dashboard",
      events: "Events",
      create: "Create New",
      analytics: "Analytics",
      registrations: "Registrations",
      settings: "Settings",
      profile: "Profile",
      notifications: "Notifications",
      content: "Content",
      schedule: "Schedule",
      support: "Support",
      users: "Users",
      fest: "Fest",
    };

    // Construct breadcrumb string
    // Skip the first part if it's the role root (except when it's the only part)
    const startIndex = parts.length > 1 ? 1 : 0;
    // @ts-ignore - Index signature for readabilityMap
    const breadcrumbParts = parts
      .slice(startIndex)
      .filter((segment) => !isLikelyResourceId(segment))
      .map(
        (p) =>
          readabilityMap[p] ||
          p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "),
      );

    return breadcrumbParts.length > 0
      ? breadcrumbParts.join(" › ")
      : "Dashboard";
  };

  const userName = user?.name || "Administrator";

  // Role Badge
  const getRoleBadge = () => {
    if (user?.role === "SUPER_ADMIN") return "SUPER ADMIN";
    if (user?.role === "HHO") return "HHO ADMIN";
    if (user?.role === "EVENT_COORDINATOR") return "COORDINATOR";
    if (user?.role === "SPORTS_ADMIN") {
      return "SPORTS ADMIN";
    }
    if (user?.role === "BRANCH_SPORTS_ADMIN") {
      if (user?.branch) return `${user.branch.toUpperCase()} SPORTS ADMIN`;
      return "BRANCH SPORTS ADMIN";
    }
    if (user?.role === "CLUB_COORDINATOR") {
      const clubName = user.branch || user.clubId || "CLUB";
      return `${clubName.toUpperCase()} COORDINATOR`;
    }
    if (user?.branch) return `${user.branch.toUpperCase()} ADMIN`;
    return "ADMIN";
  };

  // Role-based path mapping for navigation
  const getRoleBasePath = (): string => {
    switch (user?.role) {
      case "SUPER_ADMIN":
        return "/super-admin";
      case "BRANCH_ADMIN":
        return "/branch-admin";
      case "CLUB_COORDINATOR":
        return "/clubs-portal";
      case "HHO":
        return "/hho";
      case "SPORTS_ADMIN":
        return "/sports";
      case "BRANCH_SPORTS_ADMIN":
        return "/sports";
      case "EVENT_COORDINATOR":
        return "/coordinator";
      default:
        return "/branch-admin";
    }
  };

  const getRoleNavigationKey = (): RoleNavigationKey => {
    const role = user?.role?.toUpperCase();

    if (role === "SUPER_ADMIN") return "SUPER_ADMIN";
    if (role === "HHO") return "HHO";
    if (role === "BRANCH_SPORTS_ADMIN") return "BRANCH_SPORTS_ADMIN";
    if (role === "SPORTS_ADMIN" || role === "SPORTS") return "SPORTS_ADMIN";
    if (role === "CLUB_COORDINATOR" || role === "CLUB")
      return "CLUB_COORDINATOR";
    if (role === "EVENT_COORDINATOR" || role === "EC")
      return "EVENT_COORDINATOR";
    if (role === "BRANCH_ADMIN") return "BRANCH_ADMIN";

    if (user?.branch) return "BRANCH_ADMIN";
    return "BRANCH_ADMIN";
  };

  const basePath = getRoleBasePath();
  const isEventCoordinator = user?.role === "EVENT_COORDINATOR";
  const isHho = user?.role === "HHO";
  const isMainSportsAdmin = user?.role === "SPORTS_ADMIN";
  const isBranchSportsAdmin = user?.role === "BRANCH_SPORTS_ADMIN";
  const quickProfilePath = isMainSportsAdmin
    ? "/sports/admin-profile"
    : isHho
      ? "/hho/profile"
      : `${basePath}/settings/profile`;

  const headerSearchOptions = useMemo<SearchSuggestion[]>(() => {
    const roleKey = getRoleNavigationKey();
    const roleSections = navigationConfig[roleKey] || [];
    const deduped = new Map<string, SearchSuggestion>();

    for (const section of roleSections) {
      for (const item of section.items) {
        const cleanedSectionTitle = section.title
          .replace(/&/g, "and")
          .toLowerCase();
        const cleanedItemLabel = item.label.toLowerCase();
        const keywords = [
          ...cleanedItemLabel.split(/\s+/),
          ...cleanedSectionTitle.split(/\s+/),
          cleanedItemLabel,
          cleanedSectionTitle,
        ].filter(Boolean);

        deduped.set(item.href, {
          label: item.label,
          path: item.href,
          description: section.title,
          keywords,
        });
      }
    }

    return Array.from(deduped.values());
  }, [user?.role, user?.branch]);

  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [] as SearchSuggestion[];

    const ranked = headerSearchOptions
      .map((option) => {
        const label = option.label.toLowerCase();
        const description = option.description.toLowerCase();
        const keywords = option.keywords.map((keyword) =>
          keyword.toLowerCase(),
        );

        const labelStarts = label.startsWith(query);
        const labelIncludes = label.includes(query);
        const keywordStarts = keywords.some((keyword) =>
          keyword.startsWith(query),
        );
        const keywordIncludes = keywords.some((keyword) =>
          keyword.includes(query),
        );
        const descriptionIncludes = description.includes(query);

        const isMatch = labelIncludes || keywordIncludes || descriptionIncludes;
        if (!isMatch) return null;

        let score = 100;
        if (labelStarts) score = 1;
        else if (labelIncludes) score = 2;
        else if (keywordStarts) score = 3;
        else if (keywordIncludes) score = 4;
        else score = 5;

        return { option, score };
      })
      .filter(
        (entry): entry is { option: SearchSuggestion; score: number } =>
          entry !== null,
      )
      .sort(
        (a, b) =>
          a.score - b.score || a.option.label.localeCompare(b.option.label),
      );

    return ranked.slice(0, 8).map((entry) => entry.option);
  }, [headerSearchOptions, searchQuery]);

  useEffect(() => {
    if (!isSearchFocused) {
      setHighlightedSuggestionIndex(-1);
      return;
    }

    if (searchSuggestions.length === 0) {
      setHighlightedSuggestionIndex(-1);
      return;
    }

    setHighlightedSuggestionIndex(0);
  }, [isSearchFocused, searchSuggestions]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchContainerRef.current) return;
      if (!searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const navigateToSuggestion = (suggestion: SearchSuggestion) => {
    router.push(suggestion.path);
    setSearchQuery("");
    setIsSearchFocused(false);
    setHighlightedSuggestionIndex(-1);
  };

  const handleHeaderSearch = () => {
    if (searchSuggestions.length === 0) return;

    if (
      highlightedSuggestionIndex >= 0 &&
      highlightedSuggestionIndex < searchSuggestions.length
    ) {
      navigateToSuggestion(searchSuggestions[highlightedSuggestionIndex]!);
      return;
    }

    navigateToSuggestion(searchSuggestions[0]!);
  };

  return (
    <header
      className={`bg-[#F4F2F0] border-b border-[#E5E7EB] h-[88px] shrink-0 flex flex-col justify-center z-40 relative ${isEventCoordinator ? "px-6 md:px-12 lg:px-20" : "px-4 md:px-8"}`}
    >
      <div className="flex items-center justify-between gap-3 min-w-0">
        {/* Left: Menu & Welcome */}
        <div className={`flex items-center gap-3 min-w-0`}>
          {!isEventCoordinator && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 text-[#6B7280] hover:bg-[#E5E7EB] rounded-lg lg:hidden transition-colors"
              aria-label="Toggle Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <div className="hidden sm:block min-w-0">
            <h2 className="text-lg font-semibold text-[#1A1A1A] truncate">
              {user?.role === "SUPER_ADMIN"
                ? `Mission Control, ${userName}`
                : isBranchSportsAdmin
                  ? "Welcome back"
                  : `Welcome back, ${userName}`}
            </h2>
            <div className="flex items-center gap-2 mt-1 min-w-0">
              <div className="text-xs text-[#6B7280] font-medium truncate max-w-[32vw] lg:max-w-[42vw]">
                {getBreadcrumb()}
              </div>
              <div className="px-2 py-0.5 bg-[#DBEAFE] text-[#1E40AF] text-xs font-medium rounded uppercase shrink-0">
                {getRoleBadge()}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        {!isEventCoordinator && (
          <div className="hidden md:flex flex-1 justify-center px-4">
            <form
              ref={searchContainerRef}
              className="relative group w-full max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                handleHeaderSearch();
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-[#1A1A1A] transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (searchSuggestions.length > 0) {
                      setIsSearchFocused(true);
                      setHighlightedSuggestionIndex((prev) => {
                        const next = prev + 1;
                        return next >= searchSuggestions.length ? 0 : next;
                      });
                    }
                  }

                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (searchSuggestions.length > 0) {
                      setIsSearchFocused(true);
                      setHighlightedSuggestionIndex((prev) => {
                        if (prev <= 0) return searchSuggestions.length - 1;
                        return prev - 1;
                      });
                    }
                  }

                  if (e.key === "Escape") {
                    setIsSearchFocused(false);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent transition-all placeholder:text-gray-400"
              />
              {isSearchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.28)] z-50 overflow-hidden">
                  {searchSuggestions.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto">
                      {searchSuggestions.map((suggestion, index) => {
                        const isActive = index === highlightedSuggestionIndex;
                        return (
                          <button
                            key={`${suggestion.path}-${index}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => navigateToSuggestion(suggestion)}
                            className={`w-full px-4 py-3 text-left border-b border-[#F3F4F6] last:border-b-0 transition-colors ${isActive ? "bg-[#F3F4F6]" : "hover:bg-[#F9FAFB]"}`}
                          >
                            <div className="text-sm font-medium text-[#1A1A1A]">
                              {suggestion.label}
                            </div>
                            <div className="text-xs text-[#6B7280] mt-0.5">
                              {suggestion.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-[#6B7280]">
                      No related pages found
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          {/* Action Buttons */}
          {user?.role === "SUPER_ADMIN" ? (
            <>
              {/* 1. Announcement (Black) */}
              <Link
                href="/super-admin/announcements/create"
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Announcement</span>
              </Link>

              {/* 2. Add User (Green) */}
              <Link
                href="/super-admin/users/create"
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add User</span>
              </Link>
            </>
          ) : user?.role === "EVENT_COORDINATOR" ||
            isBranchSportsAdmin /* EVENT_COORDINATOR/BRANCH_SPORTS_ADMIN: no action buttons here, user section moved after notifications below */ ? null : (
            <>
              {/* Actions for BRANCH_ADMIN, CLUB_COORDINATOR, HHO, SPORTS_ADMIN */}
              <Link
                href={
                  isMainSportsAdmin
                    ? "/sports/all-updates?create=true"
                    : isHho
                      ? "/hho/updates?create=true"
                      : `${basePath}/content/announcements?create=true`
                }
                className="hidden xl:flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-[#F3F4F6] transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Send Update</span>
              </Link>

              {basePath !== "/sports-coordinator" && !isMainSportsAdmin && (
                <Link
                  href={
                    isHho
                      ? "/hho/add-event?mode=create"
                      : `${basePath}/events/create`
                  }
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Event</span>
                </Link>
              )}

              {user?.role === "CLUB_COORDINATOR" && (
                <Link
                  href={`${basePath}/live-attendance`}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#2D2D2D] transition-colors shadow-sm"
                >
                  <Clock className="w-4 h-4" />
                  <span>Live Attendance</span>
                </Link>
              )}
            </>
          )}

          {/* Notifications */}
          <NotificationPopover
            onNavigate={() => router.push(`${basePath}/notifications`)}
          />
          <NotificationModal
            isOpen={showNotificationModal}
            onClose={() => setShowNotificationModal(false)}
          />

          {/* User section: Avatar for other roles, Aravind dropdown for EVENT_COORDINATOR */}
          {user?.role === "EVENT_COORDINATOR" ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E5E7EB] shadow-sm hover:bg-[#F3F4F6] transition-colors"
              >
                {user?.profilePicture || user?.image ? (
                  <Image
                    src={(user.profilePicture || user.image)!}
                    alt={userName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {userName.charAt(0)}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <div className="text-sm font-semibold text-[#1A1A1A] leading-tight">
                    {userName}
                  </div>
                  <div className="text-[11px] text-[#6B7280] font-medium">
                    COORDINATOR
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#6B7280] transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-[#E5E7EB] py-2 z-50 min-w-[200px]">
                  <Link
                    href={`${basePath}/settings/profile`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#1A1A1A] transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>View Profile</span>
                  </Link>
                  <div className="h-px bg-[#F3F4F6] my-1" />
                  <button
                    disabled={isLoggingOut}
                    onClick={async () => {
                      setIsLoggingOut(true);
                      setShowUserMenu(false);
                      if (onLogout) await onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut
                      className={`w-4 h-4 ${isLoggingOut ? "animate-spin" : ""}`}
                    />
                    <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href={quickProfilePath}>
              {user?.profilePicture || user?.image ? (
                <Image
                  src={(user.profilePicture || user.image)!}
                  alt={userName}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover border border-gray-200 hover:ring-2 hover:ring-[#1A1A1A] transition-all"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm hover:ring-2 hover:ring-[#1A1A1A] transition-all">
                  {userName.charAt(0)}
                </div>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
