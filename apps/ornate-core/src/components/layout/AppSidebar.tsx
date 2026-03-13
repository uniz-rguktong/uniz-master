'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
    ChevronDown,
    ChevronRight,
    LogOut,
    X,
    UserCircle
} from 'lucide-react';
import { navigationConfig } from '@/config/navigation';
import type { User as BaseUser } from '@/lib/permissions';

// Extended User specific for frontend usage
interface User extends BaseUser {
    name?: string | null;
    email?: string | null;
    profilePicture?: string | null;
}

interface AppSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User;
    onLogout?: () => void;
    branding?: any; // Type strictly if possible, or keep loose for now if dynamic
}

export function AppSidebar({ isOpen, onClose, user, onLogout, branding: brandingOverride }: AppSidebarProps) {
    const pathname = usePathname();
    const [expandedSections, setExpandedSections] = useState(['dashboard', 'overview']);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Determine role key for config
    const getRoleKey = (user?: User): string | null => {
        if (!user) return null; // Handle null user gracefully
        const role = user.role?.toUpperCase() || '';

        if (role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
        if (role === 'HHO') return 'HHO';
        if (role === 'BRANCH_SPORTS_ADMIN') return 'BRANCH_SPORTS_ADMIN';
        if (role === 'SPORTS_ADMIN' || role === 'SPORTS') return 'SPORTS_ADMIN';
        if (role === 'CLUB_COORDINATOR' || role === 'CLUB') return 'CLUB_COORDINATOR';

        if (role === 'EVENT_COORDINATOR' || role === 'EC') return 'EVENT_COORDINATOR';

        // Default to branch admin if branch exists
        if (user.branch) return 'BRANCH_ADMIN';
        return 'BRANCH_ADMIN'; // Fallback
    };

    const roleKey = getRoleKey(user);
    // @ts-ignore - Config usage is strict, fallback handles empty
    const navItems = roleKey ? (navigationConfig[roleKey] || []) : [];

    // Branding Logic
    const getBranding = () => {
        if (brandingOverride) return brandingOverride;

        const branchMap = {
            'cse': { initials: 'CS', name: 'Computer Science' },
            'ece': { initials: 'EC', name: 'Electronics & Comm.' },
            'eee': { initials: 'EE', name: 'Electrical & Electronics' },
            'mech': { initials: 'ME', name: 'Mechanical' },
            'civil': { initials: 'CE', name: 'Civil Engineering' },
            'it': { initials: 'IT', name: 'Information Tech' },
            'ai&ds': { initials: 'AI', name: 'AI & Data Science' }
        };

        if (roleKey === 'EVENT_COORDINATOR') {
            return {
                initials: 'EC',
                name: 'Coordinator',
                sub: 'Events',
                color: 'bg-green-600'
            };
        }

        if (roleKey === 'SUPER_ADMIN') {
            return {
                initials: 'SA',
                name: 'Mission Control',
                sub: 'Super Admin',
                color: 'bg-gradient-to-br from-purple-600 to-indigo-600'
            };
        }

        if (roleKey === 'SPORTS_ADMIN') {
            return {
                initials: 'SA',
                name: 'Sports Admin',
                sub: 'Department',
                color: 'bg-blue-600'
            };
        }

        if (roleKey === 'HHO') {
            return {
                initials: 'HHO',
                name: 'Helping Hands',
                sub: 'Organization',
                color: 'bg-[#1A1A1A]'
            };
        }

        if (roleKey === 'CLUB_COORDINATOR') {
            const clubName = user?.clubId || user?.branch || 'Club';
            // Simple formatting: TechXcel
            const displayName = clubName === 'techexcel' ? 'TechXcel' : clubName.charAt(0).toUpperCase() + clubName.slice(1);
            return {
                initials: displayName.substring(0, 2).toUpperCase(),
                name: displayName,
                sub: 'Club Portal',
                color: 'bg-[#1A1A1A]'
            };
        }

        // Default branch info
        const branch = user?.branch?.toLowerCase();
        // @ts-ignore - Branch map access
        const details = (branch && branchMap[branch]) || { initials: 'OR', name: 'Ornate Dashboard' };

        return {
            initials: details.initials,
            name: details.name,
            sub: 'Department',
            color: 'bg-[#1A1A1A]' // Standard black for branches
        };
    };

    const branding = getBranding();
    const userNameRaw = user?.name || 'Administrator';
    const userName = userNameRaw.replace(/TechExcel/g, 'TechXcel');

    // Consistent role display logic
    const getRoleDisplay = () => {
        if (user?.role === 'SUPER_ADMIN') return 'SUPER ADMIN';
        if (user?.role === 'HHO') return 'HHO ADMIN';
        if (user?.role === 'SPORTS_ADMIN') return 'SPORTS ADMIN';
        if (user?.role === 'BRANCH_SPORTS_ADMIN') return 'BRANCH SPORTS ADMIN';
        if (user?.role === 'CLUB_COORDINATOR') {
            const clubName = branding.name || user?.clubId || user?.branch || 'CLUB';
            // If branding.name is already 'TechXcel', use it.
            return `${clubName.toUpperCase()} COORDINATOR`;
        }
        if (user?.branch) return `${user.branch.toUpperCase()} ADMIN`;
        return 'ADMIN';
    };

    const userRoleDisplay = getRoleDisplay();

    const getAccountProfilePath = () => {
        if (user?.role === 'CLUB_COORDINATOR') return '/clubs-portal/settings/profile';
        if (user?.role === 'HHO') return '/hho/profile';
        if (user?.role === 'SPORTS_ADMIN') return '/sports/admin-profile';
        if (user?.role === 'BRANCH_SPORTS_ADMIN') return '/sports-coordinator/settings/profile';
        return '/branch-admin/settings/profile';
    };

    // Helper active state
    const isActive = (path: string, exact = false) => {
        if (path.endsWith('/live-attendance') && pathname.includes('/events/') && pathname.endsWith('/attendance')) {
            const portalPrefix = path.split('/').slice(0, 2).join('/');
            if (pathname.startsWith(portalPrefix)) {
                return true;
            }
        }

        if (exact) return pathname === path;
        return pathname.startsWith(path);
    };

    // Auto-expand sections
    useEffect(() => {
        navItems.forEach((section: any) => {
            const hasActiveItem = section.items?.some((item: any) => isActive(item.href, item.exact));
            if (hasActiveItem && section.key) {
                setExpandedSections(prev => prev.includes(section.key) ? prev : [...prev, section.key]);
            }
        });
    }, [pathname, roleKey]);

    // Close sidebar on mobile when navigating
    useEffect(() => {
        if (isOpen) {
            onClose();
        }
    }, [pathname]); // Only trigger when the route actually changes

    const toggleSection = (key: string) => {
        setExpandedSections(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#E5E7EB] flex flex-col 
        transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>

                {/* Branding Header */}
                <div className="h-[88px] shrink-0 border-b border-[#E5E7EB] bg-[#F4F2F0] px-4 flex flex-col justify-center relative overflow-hidden">
                    <Link
                        href={navItems[0]?.items[0]?.href || '#'}
                        className="w-full min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white hover:bg-[#F3F4F6] transition-all shadow-sm border border-[#E5E7EB]/50 overflow-hidden"
                    >
                        <div className={`shrink-0 w-9 h-9 ${branding.color} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                            {branding.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-[#6B7280] font-medium uppercase tracking-wider">{branding.sub}</div>
                            <div className="text-sm font-bold text-[#1A1A1A] truncate">{branding.name}</div>
                        </div>
                    </Link>

                    <button
                        onClick={onClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#6B7280] hover:bg-[#E5E7EB] rounded-lg lg:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Content — hidden for EVENT_COORDINATOR */}
                {roleKey !== 'EVENT_COORDINATOR' && (
                    <nav className="flex-1 overflow-y-auto p-4 bg-[#F4F2F0] custom-scrollbar space-y-6">
                        {navItems.map((section: any, idx: number) => (
                            <div key={idx}>
                                {/* Section Header */}
                                {section.title && (
                                    section.key ? (
                                        <button
                                            onClick={() => toggleSection(section.key)}
                                            className="w-full flex items-center justify-between px-2 py-1 mb-2 text-xs font-semibold text-[#6B7280] hover:text-[#1A1A1A] transition-colors group"
                                        >
                                            <span>{section.title}</span>
                                            <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${expandedSections.includes(section.key) ? 'rotate-90' : ''}`} />
                                        </button>
                                    ) : (
                                        <div className="px-2 py-1.5 mb-1 text-xs font-semibold text-[#6B7280]">
                                            {section.title}
                                        </div>
                                    )
                                )}

                                {/* Section Items */}
                                <div className={`space-y-1 ${section.key && !expandedSections.includes(section.key) ? 'hidden' : ''}`}>
                                    {section.items.map((item: any, itemIdx: number) => {
                                        const active = isActive(item.href, item.exact);
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={itemIdx}
                                                href={item.href}
                                                onClick={() => {
                                                    if (window.innerWidth < 1024) {
                                                        onClose();
                                                    }
                                                }}
                                                className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1
                                            ${active
                                                        ? 'bg-[#1A1A1A] text-white font-medium'
                                                        : 'text-[#4B5563] hover:bg-[#FAFAFA] hover:text-[#1A1A1A]'
                                                    }
                                        `}
                                            >
                                                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#9CA3AF]'}`} />
                                                <span className="flex-1">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                )}

                {/* Empty spacer for EVENT_COORDINATOR sidebar */}
                {roleKey === 'EVENT_COORDINATOR' && (
                    <div className="flex-1 bg-[#F4F2F0]" />
                )}

                {/* User Footer — hidden for EVENT_COORDINATOR (moved to header) */}
                {roleKey !== 'EVENT_COORDINATOR' && (
                    <div className="p-4 border-t border-[#E5E7EB] bg-white relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#F7F8FA] transition-colors border border-transparent hover:border-[#E5E7EB]"
                        >
                            {user?.profilePicture ? (
                                <Image
                                    src={user.profilePicture}
                                    alt="User"
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center border border-[#E5E7EB]">
                                    <UserCircle className="w-6 h-6 text-gray-400" />
                                </div>
                            )}

                            <div className="flex-1 text-left min-w-0">
                                <div className="text-sm font-semibold text-[#1A1A1A] truncate">{userName}</div>
                                <div className="text-xs text-[#6B7280] truncate">{userRoleDisplay}</div>
                            </div>

                            <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* User Menu Dropdown */}
                        {showUserMenu && (
                            <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E5E7EB] py-2 z-50 animate-in fade-in zoom-in-95 duration-200 min-w-[200px]">

                                <div className="py-1">
                                    <Link
                                        href={getAccountProfilePath()}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#1A1A1A] transition-colors"
                                    >
                                        <UserCircle className="w-4 h-4" />
                                        <span>View Profile</span>
                                    </Link>
                                </div>

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
                                    <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
                                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
