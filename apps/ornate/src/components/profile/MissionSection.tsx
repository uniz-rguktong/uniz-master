'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Download, Dumbbell, Users, Gamepad2, Medal, ExternalLink, Shield } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type MissionType = 'EVENT' | 'SPORT_INDIVIDUAL' | 'SPORT_TEAM_LEADER' | 'SPORT_TEAM_MEMBER';

interface Mission {
    id: string;
    title: string;
    subTitle?: string;
    date: string;
    venue: string;
    status: string;
    paymentStatus?: string;
    certificateUrl?: string | null;
    certificateIssuedAt?: string | null;
    rank?: number | null;
    type: MissionType;
    role?: string;
    teamName?: string;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
    PENDING: 'text-amber-400   bg-amber-950/50  border-amber-500/30  shadow-[0_0_5px_rgba(251,191,36,0.5)]',
    CONFIRMED: 'text-[#D6FF00]   bg-[#D6FF00]/10  border-[#D6FF00]/30  shadow-[0_0_5px_rgba(214,255,0,0.5)]',
    WAITLISTED: 'text-orange-400  bg-orange-950/50 border-orange-500/30 shadow-[0_0_5px_rgba(249,115,22,0.5)]',
    ATTENDED: 'text-cyan-400    bg-cyan-950/50   border-cyan-500/30   shadow-[0_0_5px_rgba(34,211,238,0.5)]',
    COMPLETED: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30 shadow-[0_0_5px_rgba(52,211,153,0.5)]',
    CANCELLED: 'text-red-400     bg-red-950/50    border-red-500/30    shadow-[0_0_5px_rgba(248,113,113,0.5)]',
    REJECTED: 'text-red-500     bg-red-950/50    border-red-600/30    shadow-[0_0_5px_rgba(239,68,68,0.5)]',
    ACCEPTED: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30 shadow-[0_0_5px_rgba(52,211,153,0.5)]',
    REGISTRATION_OPEN: 'text-sky-400 bg-sky-950/50   border-sky-500/30    shadow-[0_0_5px_rgba(56,189,248,0.5)]',
    ONGOING: 'text-violet-400  bg-violet-950/50 border-violet-500/30 shadow-[0_0_5px_rgba(167,139,250,0.5)]',
    UPCOMING: 'text-blue-400    bg-blue-950/50   border-blue-500/30   shadow-[0_0_5px_rgba(96,165,250,0.5)]',
};

const MISSION_ICONS: Record<MissionType, React.ReactNode> = {
    EVENT: <Gamepad2 className="w-8 h-8 text-[#D6FF00]  drop-shadow-[0_0_8px_rgba(214,255,0,0.6)]" />,
    SPORT_INDIVIDUAL: <Dumbbell className="w-8 h-8 text-sky-400    drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />,
    SPORT_TEAM_LEADER: <Trophy className="w-8 h-8 text-amber-400  drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />,
    SPORT_TEAM_MEMBER: <Users className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />,
};

const MISSION_BADGE_COLORS: Record<MissionType, string> = {
    EVENT: 'bg-[#D6FF00]/20  text-[#D6FF00]',
    SPORT_INDIVIDUAL: 'bg-sky-400/20    text-sky-400',
    SPORT_TEAM_LEADER: 'bg-amber-400/20  text-amber-400',
    SPORT_TEAM_MEMBER: 'bg-emerald-400/20 text-emerald-400',
};

const MISSION_LABELS: Record<MissionType, string> = {
    EVENT: 'EVENT',
    SPORT_INDIVIDUAL: 'SPORT',
    SPORT_TEAM_LEADER: 'SPORT · LEADER',
    SPORT_TEAM_MEMBER: 'SPORT · MEMBER',
};

function StatusBadge({ status }: { status: string }) {
    return (
        <div className={`flex flex-shrink-0 items-center justify-center px-3 py-0.5 border clip-status ${STATUS_STYLES[status] || STATUS_STYLES['PENDING']}`}>
            <span className="text-[9px] font-black tracking-widest uppercase italic">{status.replace(/_/g, ' ')}</span>
        </div>
    );
}



// ─── Component ────────────────────────────────────────────────────────────────
export default function MissionSection({ profile }: { profile?: any }) {
    const [filter, setFilter] = useState<'ALL' | 'EVENT' | 'SPORT'>('ALL');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // ── Gather all missions ──────────────────────────────────────────────────
    const allMissions: Mission[] = [
        // 1. Event registrations
        ...(profile?.registrations || []).map((r: any): Mission => ({
            id: r.id,
            title: r.eventTitle,
            date: new Date(r.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
            venue: r.venue || 'TBA',
            status: r.status,
            paymentStatus: r.paymentStatus,
            certificateUrl: r.certificateUrl,
            certificateIssuedAt: r.certificateIssuedAt,
            rank: r.rank,
            type: 'EVENT',
        })),

        // 2. Individual sport registrations
        ...(profile?.sportRegistrations || []).map((sr: any): Mission => ({
            id: sr.id,
            title: sr.sportName,
            subTitle: `${sr.category} · ${sr.gender}`,
            date: 'TBA',
            venue: 'Sports Complex',
            status: sr.sportStatus || sr.status,
            type: 'SPORT_INDIVIDUAL',
        })),

        // 3. Sport teams where user is LEADER
        ...(profile?.teams || [])
            .filter((t: any) => t.isSport)
            .map((t: any): Mission => ({
                id: t.id,
                title: t.sportName || t.eventTitle,
                subTitle: `Team: ${t.teamName}`,
                date: t.eventDate ? new Date(t.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'TBA',
                venue: t.venue || 'Sports Complex',
                status: t.sportStatus || t.status,
                teamName: t.teamName,
                role: 'LEADER',
                type: 'SPORT_TEAM_LEADER',
            })),

        // 4. Sport teams where user is MEMBER
        ...(profile?.teamMemberships || [])
            .filter((tm: any) => tm.isSport)
            .map((tm: any): Mission => ({
                id: tm.id,
                title: tm.sportName || tm.eventTitle,
                subTitle: `Team: ${tm.teamName} · ${tm.role}`,
                date: tm.eventDate ? new Date(tm.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'TBA',
                venue: tm.venue || 'Sports Complex',
                status: tm.sportStatus || tm.status,
                teamName: tm.teamName,
                role: tm.role,
                type: 'SPORT_TEAM_MEMBER',
            })),

        // 5. Non-sport event teams (team events)
        ...(profile?.teams || [])
            .filter((t: any) => !t.isSport)
            .map((t: any): Mission => ({
                id: t.id,
                title: t.eventTitle,
                subTitle: `Team: ${t.teamName} · LEADER`,
                date: t.eventDate ? new Date(t.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'TBA',
                venue: t.venue || 'TBA',
                status: t.status,
                teamName: t.teamName,
                role: 'LEADER',
                type: 'EVENT',
            })),

        // 6. Non-sport event memberships
        ...(profile?.teamMemberships || [])
            .filter((tm: any) => !tm.isSport)
            .map((tm: any): Mission => ({
                id: tm.id,
                title: tm.eventTitle,
                subTitle: `Team: ${tm.teamName} · ${tm.role}`,
                date: tm.eventDate ? new Date(tm.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'TBA',
                venue: tm.venue || 'TBA',
                status: tm.status,
                teamName: tm.teamName,
                role: tm.role,
                type: 'EVENT',
            })),
    ];

    // Achievements = any mission with a certificate
    const achievements: Mission[] = (profile?.registrations || [])
        .filter((r: any) => r.certificateUrl)
        .map((r: any): Mission => ({
            id: r.id,
            title: r.eventTitle,
            date: new Date(r.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
            venue: r.venue || 'TBA',
            status: r.status,
            certificateUrl: r.certificateUrl,
            certificateIssuedAt: r.certificateIssuedAt,
            rank: r.rank,
            type: 'EVENT',
        }));

    const filters: Array<'ALL' | 'EVENT' | 'SPORT'> = ['ALL', 'EVENT', 'SPORT'];
    const filterLabels: Record<string, string> = {
        ALL: 'All',
        EVENT: 'Events',
        SPORT: 'Sports',
    };

    const displayed = filter === 'ALL' 
        ? allMissions 
        : allMissions.filter(m => {
            if (filter === 'EVENT') return m.type === 'EVENT';
            if (filter === 'SPORT') return m.type.startsWith('SPORT');
            return false;
        });

    return (
        <div className="flex flex-col gap-6 font-orbitron">

            {/* ─── LOG RECORD ─────────────────────────────────────────────────── */}
            <div className="p-5 md:p-8 relative"
                style={{
                    background: 'rgba(10, 10, 20, 0.7)',
                    border: '1.5px solid rgba(214, 255, 0, 0.2)',
                    clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
                    backdropFilter: 'blur(16px)'
                }}>

                {/* Corner decorations */}
                <div className="absolute top-0 right-0 w-12 h-[1px] bg-[#D6FF00]/30" />
                <div className="absolute top-0 right-0 w-[1px] h-12 bg-[#D6FF00]/30" />
                <div className="absolute bottom-0 left-0 w-12 h-[1px] bg-[#D6FF00]/30" />
                <div className="absolute bottom-0 left-0 w-[1px] h-12 bg-[#D6FF00]/30" />

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#D6FF00]/20 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-[#D6FF00] drop-shadow-[0_0_8px_#D6FF00]" />
                        <h2 className="text-base sm:text-lg font-black text-white tracking-widest uppercase">LOG RECORD</h2>
                        <span className="ml-2 text-[10px] bg-[#D6FF00]/15 text-[#D6FF00] px-3 py-1 font-black tracking-widest border border-[#D6FF00]/20">
                            {allMissions.length} TOTAL
                        </span>
                    </div>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 text-[9px] sm:text-[10px] font-black tracking-widest uppercase border transition-all cursor-pointer
                                ${filter === f
                                    ? 'bg-[#D6FF00]/15 border-[#D6FF00]/50 text-[#D6FF00] shadow-[0_0_10px_rgba(214,255,0,0.2)]'
                                    : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 hover:bg-white/[0.06]'}`}
                            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                        >
                            {filterLabels[f]}
                        </button>
                    ))}
                </div>

                {/* Mission list */}
                <div className="space-y-3 relative z-10 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                    {!mounted ? (
                        <div className="text-gray-400 text-center py-6 text-xs tracking-widest font-black uppercase animate-pulse">LOADING MISSIONS...</div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {displayed.length === 0 ? (
                                <div className="text-gray-500 text-center py-8 text-sm tracking-widest font-black uppercase">
                                    NO MISSIONS FOUND
                                </div>
                            ) : displayed.map((mission, i) => (
                                <motion.div
                                    key={mission.id + mission.type}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2, delay: i * 0.03 }}
                                    className="relative p-4 sm:p-5 hover:translate-y-[-2px] transition-all group/item"
                                    style={{
                                        background: 'rgba(8, 8, 18, 0.6)',
                                        border: '1px solid rgba(214, 255, 0, 0.15)',
                                        clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
                                    }}
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#D6FF00]/30 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity" />

                                    <div className="flex gap-3 items-start">
                                        {/* Icon */}
                                        <div className="relative flex-shrink-0 mt-0.5">
                                            <div className="absolute inset-0 bg-white/5 blur-md rounded-full" />
                                            <div className="relative z-10">{MISSION_ICONS[mission.type]}</div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-1 flex-wrap">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                        <h3 className="text-sm sm:text-base font-black text-white tracking-wider sm:tracking-widest uppercase leading-tight truncate">{mission.title}</h3>
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-sm tracking-wider font-black flex-shrink-0 ${MISSION_BADGE_COLORS[mission.type]}`}>
                                                            {MISSION_LABELS[mission.type]}
                                                        </span>
                                                        {mission.rank && mission.rank > 0 && (
                                                            <span className="text-[8px] bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded-sm tracking-wider font-black flex-shrink-0">
                                                                #{mission.rank} PLACE
                                                            </span>
                                                        )}
                                                    </div>
                                                    {mission.subTitle && (
                                                        <p className="text-[9px] text-[#D6FF00]/60 font-mono tracking-widest uppercase">{mission.subTitle}</p>
                                                    )}
                                                    <p className="text-[9px] text-white/40 font-mono tracking-widest mt-0.5">{mission.date}</p>
                                                </div>
                                                <StatusBadge status={mission.status} />
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between border-t border-[#D6FF00]/10 pt-2 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-3 bg-[#D6FF00]/30" />
                                                    <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">{mission.venue}</span>
                                                </div>
                                                {mission.certificateUrl && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#D6FF00]/10 border border-[#D6FF00]/20 text-[#D6FF00] text-[8px] font-black tracking-[0.2em] uppercase rounded-sm shadow-[0_0_10px_rgba(214,255,0,0.1)]">
                                                        <Shield className="w-2.5 h-2.5" /> ISSUED
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* ─── ACHIEVEMENTS ───────────────────────────────────────────────── */}
            <div className="p-5 md:p-6 relative"
                style={{
                    background: 'rgba(10, 10, 20, 0.7)',
                    border: '1.5px solid rgba(214, 255, 0, 0.2)',
                    clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
                    backdropFilter: 'blur(16px)'
                }}>

                <div className="absolute top-0 right-0 w-12 h-[1px] bg-amber-400/30" />
                <div className="absolute top-0 right-0 w-[1px] h-12 bg-amber-400/30" />

                <div className="flex items-center gap-3 mb-5">
                    <Medal className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    <h2 className="text-base sm:text-lg font-black tracking-widest text-white uppercase">
                        MISSION <span className="text-[#D6FF00]">ACHIEVEMENTS</span>
                    </h2>
                    <span className="text-[10px] bg-amber-400/15 text-amber-400 px-3 py-1 font-black tracking-widest border border-amber-400/20">
                        {achievements.length} CERT{achievements.length !== 1 ? 'S' : ''}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto custom-scrollbar">
                    {achievements.length === 0 ? (
                        <div className="text-gray-500 text-center py-8 text-sm tracking-widest font-black uppercase">
                            NO CERTIFICATES ISSUED YET
                        </div>
                    ) : achievements.map((ach, i) => (
                        <motion.div
                            key={ach.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.06 }}
                            className="p-4 sm:p-5 hover:translate-y-[-2px] transition-all flex gap-3 items-start"
                            style={{
                                background: 'rgba(8, 8, 18, 0.6)',
                                border: '1px solid rgba(214, 255, 0, 0.15)',
                                clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
                            }}
                        >
                            {/* Trophy icon */}
                            <div className="relative flex-shrink-0 mt-0.5">
                                <div className="absolute inset-0 bg-amber-400/10 blur-md rounded-full" />
                                <Trophy className="w-8 h-8 text-amber-400 relative z-10 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                                    <div>
                                        <h4 className="text-[13px] font-black text-white tracking-widest uppercase italic leading-tight">{ach.title}</h4>
                                        <p className="text-[9px] text-[#D6FF00]/60 font-mono tracking-widest uppercase mt-0.5">{ach.date}</p>
                                    </div>
                                    {ach.rank && ach.rank > 0 && (
                                        <span className="text-[9px] bg-amber-400/20 text-amber-400 border border-amber-400/30 px-2 py-0.5 font-black tracking-widest flex-shrink-0">
                                            🏆 RANK #{ach.rank}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-[#D6FF00]/10 pt-2 mt-2">
                                    <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">{ach.venue}</span>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#D6FF00]/10 border border-[#D6FF00]/20 text-[#D6FF00] text-[9px] font-black tracking-[0.2em] uppercase rounded-sm shadow-[0_0_10px_rgba(214,255,0,0.1)]">
                                        <Medal className="w-3 h-3" /> CERTIFICATE ISSUED
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .clip-button {
                    clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
                }
                .clip-item {
                    clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
                }
                .clip-status {
                    clip-path: polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%);
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(214,255,0,0.3); border-radius: 4px; }
            `}</style>
        </div>
    );
}
