'use client';

import { useSession } from 'next-auth/react';
import { memo, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home, Rocket, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addAlpha } from '@/lib/utils';

interface UserProfile {
    id: string;
    name?: string | null;
    stdid?: string | null;
    branch?: string | null;
    currentYear?: string | null;
}

interface SectorHeaderProps {
    title?: string;
    subtitle?: string;
    userProfile?: UserProfile | null;
    accentColor?: string;
    rightElement?: React.ReactNode;
    hideProfile?: boolean;
    showTitle?: boolean;
    links?: { label: string; href: string }[];
    hideBack?: boolean;
    hideHome?: boolean;
    customNav?: React.ReactNode;
}

const SectorHeader = ({
    title = "",
    subtitle = "Operational Directives Terminal",
    userProfile: profileProp,
    accentColor = "var(--color-neon)",
    rightElement,
    hideProfile = false,
    showTitle = true,
    links = [],
    hideBack = true,
    hideHome = false,
    customNav
}: SectorHeaderProps) => {
    const { data: session } = useSession();
    const router = useRouter();
    const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);

    const userProfile = useMemo(() => {
        if (profileProp) return profileProp;
        if (session?.user) {
            return {
                id: session.user.id,
                name: session.user.name,
                stdid: (session.user as any).stdid || (session.user.email?.includes('@') ? session.user.email.split('@')[0].toUpperCase() : null),
                branch: (session.user as any).branch,
                currentYear: (session.user as any).currentYear
            };
        }
        return null;
    }, [profileProp, session]);

    // Fetch the user's cadet hub leaderboard rank
    useEffect(() => {
        if (!session?.user?.id) return;
        fetch('/api/me/rank')
            .then(r => r.json())
            .then(data => {
                if (data.rank != null) setLeaderboardRank(data.rank);
            })
            .catch(() => { });
    }, [session?.user?.id]);

    const rankLabel = leaderboardRank != null
        ? `#${leaderboardRank} CADET`
        : userProfile
            ? 'OPERATIVE'
            : 'CIVILIAN';

    return (
        <header className="relative w-full h-16 md:h-20 px-4 md:px-10 flex items-center justify-between z-50 border-b border-white/20 bg-black/40 backdrop-blur-2xl shrink-0">
            {/* Top Accent Line - ULTRA BRIGHT */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[var(--color-neon)] to-transparent shadow-[0_0_20px_var(--color-neon)]" />
            {/* Left: Navigation */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
                {customNav ? (
                    customNav
                ) : (
                    <>
                        {!hideBack && (
                            <button onClick={() => router.back()} className="group flex items-center gap-2 sm:gap-3 text-white/50 hover:text-white transition-colors">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 group-hover:border-white/60 flex items-center justify-center transition-all bg-black/50 shadow-md">
                                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
                                </div>
                                <span className="hidden md:block text-xs font-black tracking-widest uppercase">Back</span>
                            </button>
                        )}

                        {!hideBack && !hideHome && (
                            <div className="hidden sm:block w-px h-6 bg-white/10" />
                        )}

                        {!hideHome && (
                            <>
                                {/* Mobile: Menu Toggle */}
                                <button 
                                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-ornate-sidebar'))} 
                                    className="sm:hidden group flex items-center gap-2 text-white/50 hover:text-[var(--color-neon)] transition-colors mr-2"
                                    aria-label="Open Navigation Menu"
                                >
                                    <div className="w-8 h-8 rounded-full border border-white/20 group-hover:border-[var(--color-neon)] flex items-center justify-center transition-all bg-black/50 shadow-md">
                                        <Menu className="w-4 h-4" />
                                    </div>
                                </button>

                                {/* Desktop: Dashboard Link */}
                                <Link 
                                    href="/home" 
                                    className="hidden sm:flex group items-center gap-3 text-white/50 hover:text-[var(--color-neon)] transition-colors mr-4"
                                >
                                    <div className="w-10 h-10 rounded-full border border-white/20 group-hover:border-[var(--color-neon)] flex items-center justify-center transition-all bg-black/50 shadow-md">
                                        <Home className="w-5 h-5" />
                                    </div>
                                    <span className="hidden md:block text-xs font-black tracking-widest uppercase">Dashboard</span>
                                </Link>
                            </>
                        )}
                    </>
                )}

                {/* Additional Links (Desktop Only) */}
                <div className="hidden lg:flex items-center gap-1">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-[9px] font-black tracking-[0.2em] text-white/30 hover:text-[var(--color-neon)] hover:bg-white/5 px-3 py-2 rounded-full border border-transparent hover:border-white/5 transition-all text-glow-hover uppercase"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Center: Title */}
            {showTitle && (
                <div className="flex flex-col items-center flex-1 text-center shrink-0 px-2">
                    <h1 className="text-base sm:text-2xl md:text-3xl font-black tracking-[0.15em] sm:tracking-[0.25em] md:tracking-[0.3em] uppercase whitespace-nowrap" style={{ color: accentColor, textShadow: `0 0 15px ${addAlpha(accentColor, '60')}` }}>{title}</h1>
                    <p className="hidden md:block text-[10px] tracking-[0.6em] text-white/60 uppercase mt-1 font-bold">{subtitle}</p>
                </div>
            )}

            {/* Right: Profile & Optional Extra */}
            <div className="flex items-center justify-end gap-3 sm:gap-6 flex-1">
                {rightElement && <div>{rightElement}</div>}
                {!hideProfile && (
                    <Link href="/home/profile" className="group flex items-center gap-2 sm:gap-4 text-white/50 hover:text-white transition-all">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs sm:text-sm font-black tracking-widest drop-shadow-md transition-all group-hover:brightness-125" style={{ color: accentColor }}>
                                RANK: {rankLabel}
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold text-white/70 tracking-widest uppercase mt-0.5 group-hover:text-white transition-colors">
                                {userProfile ? `ID: ${(userProfile.stdid || userProfile.id).toUpperCase().slice(0, 12)}` : 'GUEST TERMINAL'}
                            </span>
                        </div>
                        <div className="w-9 h-9 sm:w-12 sm:h-12 border border-white/20 group-hover:border-[var(--color-neon)] relative flex items-center justify-center bg-white/5 rounded-md transition-all overflow-hidden shadow-lg group-hover:shadow-[0_0_15px_var(--color-neon)]">
                            <img
                                src="/cybernetic_astronaut_profile.png"
                                alt="Profile"
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/000?d=mp'; }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 pointer-events-none" />
                            <Rocket className="absolute w-3 h-3 bottom-0.5 right-0.5 animate-pulse" style={{ color: accentColor, filter: `drop-shadow(0 0 5px ${accentColor})` }} />
                        </div>
                    </Link>
                )}
            </div>
        </header>
    );
};


export default memo(SectorHeader);
