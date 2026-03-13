'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Rocket, User, LogOut, ChevronUp } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface SidebarNavItem {
    label: string;
    icon: React.ReactNode;
    url: string;
    onClick?: () => void;
}

interface HomeSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    sidebarSearch: string;
    setSidebarSearch: (val: string) => void;
    handleSidebarSearch: () => void;
    sidebarCoreLinks: SidebarNavItem[];
    sidebarEventsLinks: SidebarNavItem[];
    sidebarSystemLinks: SidebarNavItem[];
}

export const HomeSidebar: React.FC<HomeSidebarProps> = ({
    isOpen,
    onClose,
    sidebarSearch,
    setSidebarSearch,
    handleSidebarSearch,
    sidebarCoreLinks,
    sidebarEventsLinks,
    sidebarSystemLinks
}) => {
    const { data: session } = useSession();
    const [showUserMenu, setShowUserMenu] = React.useState(false);

    // Normalize user name for display
    const displayName = session?.user?.name || 'Commander';
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[200] pointer-events-auto"
            />
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-[240px] bg-[#050508] border-r border-[var(--color-neon)]/30 z-[201] flex flex-col pt-3 shadow-[10px_0_50px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.1)] pointer-events-auto"
            >
                {/* Cyber Grid Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-neon) 0.5px, transparent 0.5px)', backgroundSize: '15px 15px' }} />

                <div className="px-5 mb-3 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/50 flex items-center justify-center shadow-[0_0_15px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.2)]">
                            <Rocket size={14} className="text-[var(--color-neon)]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black tracking-widest text-[var(--color-neon)] text-glow">ORNATE_OS</span>
                            <span className="text-[5px] font-bold text-[var(--color-neon)]/50 tracking-[0.4em]">v2.6.0</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-[var(--color-neon)] transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Sidebar Search Bar */}
                <div className="px-5 mb-4 relative z-10">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[var(--color-neon)] transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="SEARCH..."
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSidebarSearch();
                                }
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-[9px] font-black tracking-widest outline-none focus:border-[var(--color-neon)]/40 focus:bg-[var(--color-neon)]/5 transition-all"
                        />
                        <button
                            type="button"
                            onClick={handleSidebarSearch}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md border border-white/10 bg-black/40 text-white/50 hover:text-[var(--color-neon)] hover:border-[var(--color-neon)]/40 transition-all"
                            aria-label="Search and navigate"
                        >
                            <Search size={12} />
                        </button>
                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[var(--color-neon)] group-focus-within:w-full transition-all duration-500" />
                    </div>
                </div>

                <div className="flex-1 px-4 space-y-6 overflow-y-auto no-scrollbar relative z-10">
                    {/* Sections and Links */}
                    {[
                        { title: 'Core_Protocols', links: sidebarCoreLinks },
                        { title: 'Events', links: sidebarEventsLinks },
                        { title: 'External_Nodes', links: sidebarSystemLinks }
                    ].map((section) => (
                        <div key={section.title} className="space-y-1">
                            <div className="px-4 flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black text-[var(--color-neon)]/40 tracking-[0.3em] uppercase">{section.title}</p>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-neon)]/20 to-transparent ml-4" />
                            </div>
                            {section.links.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.url}
                                    onClick={(e) => {
                                        if (link.onClick) {
                                            e.preventDefault();
                                            link.onClick();
                                        } else {
                                            onClose();
                                        }
                                    }}
                                    className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[var(--color-neon)]/5 transition-all group border border-transparent hover:border-[var(--color-neon)]/10"
                                >
                                    <div className="text-white/30 group-hover:text-[var(--color-neon)] transition-colors drop-shadow-[0_0_8px_rgba(var(--color-neon-rgb, 57, 255, 20), 0)] group-hover:drop-shadow-[0_0_8px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)]">
                                        {link.icon}
                                    </div>
                                    <span className="text-[11px] font-black tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Sidebar Footer - User Identity Dropdown */}
                <div className="mt-auto border-t border-[var(--color-neon)]/10 bg-black/60 relative z-10">
                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-4 right-4 mb-2 bg-[#0A0A0F] border border-[var(--color-neon)]/20 rounded-xl overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20"
                            >
                                <div className="p-2 space-y-1">
                                    <Link
                                        href="/home/profile"
                                        onClick={onClose}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[var(--color-neon)]/5 text-white/50 hover:text-white transition-all group"
                                    >
                                        <User size={14} className="group-hover:text-[var(--color-neon)]" />
                                        <span className="text-[10px] font-black tracking-widest uppercase">My Profile</span>
                                    </Link>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/5 text-white/50 hover:text-red-500 transition-all group"
                                    >
                                        <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                        <span className="text-[10px] font-black tracking-widest uppercase whitespace-nowrap">Terminate Session</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`w-full p-4 flex items-center justify-between transition-all ${showUserMenu ? 'bg-[var(--color-neon)]/5' : 'hover:bg-white/[0.02]'}`}
                    >
                        <div className="flex items-center gap-2.5 text-left">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-neon)]/20 to-blue-500/20 border border-[var(--color-neon)]/30 flex items-center justify-center text-[var(--color-neon)]">
                                    <User size={16} />
                                </div>
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-neon)] rounded-full border border-[#050508] animate-pulse" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black tracking-[0.1em] text-white/90 uppercase truncate max-w-[100px]">{displayName}</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[7px] font-bold text-[var(--color-neon)]/60 tracking-widest uppercase truncate max-w-[80px]">LVL: ALPHA</span>
                                </div>
                            </div>
                        </div>

                        <motion.div
                            animate={{ rotate: showUserMenu ? 0 : 180 }}
                            className="text-white/20"
                        >
                            <ChevronUp size={14} />
                        </motion.div>
                    </button>
                </div>
            </motion.div>
        </>
    );
};
