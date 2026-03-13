'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, X, Zap } from 'lucide-react';
import { PanelSVG, MissionItem, UpdateItem } from './HomeHUD';

interface MissionsPanelProps {
    isDesktop: boolean;
    isVisible: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onClose: () => void;
    todaysMissions: any[];
    announcements: any[];
}

export const MissionsPanel: React.FC<MissionsPanelProps> = React.memo(({
    isDesktop,
    isVisible,
    activeTab,
    setActiveTab,
    onClose,
    todaysMissions,
    announcements
}) => {
    return (
        <motion.div
            id="missions-left-panel"
            initial={false}
            animate={isVisible ? "visible" : "hidden"}
            variants={{
                visible: {
                    opacity: 1,
                    scale: 1,
                    x: isDesktop ? 0 : "-50%",
                    y: isDesktop ? 0 : "-50%",
                    filter: "blur(0px)",
                    transition: {
                        type: "spring",
                        damping: 25,
                        stiffness: 200,
                        mass: 0.5
                    }
                },
                hidden: {
                    opacity: 0,
                    scale: isDesktop ? 0.95 : 0.95,
                    x: isDesktop ? "-100vw" : "-50%",
                    y: isDesktop ? 0 : "-30%",
                    filter: "blur(10px)",
                    transition: {
                        duration: 0.4,
                        ease: [0.19, 1, 0.22, 1]
                    }
                }
            }}
            className={`absolute z-[70] will-change-transform ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'} ${isDesktop ? 'bottom-1 left-1 w-[18rem] lg:w-[28rem] h-[16rem] lg:h-[22rem] scale-100 origin-bottom-left' : 'top-1/2 left-1/2 w-[95vw] aspect-[85/55] max-h-[50vh] origin-center'}`}
        >
            {isDesktop ? (
                <>
                    <PanelSVG />
                    {/* Content Container */}
                    <div className="absolute inset-0 flex flex-col z-10 pt-2 pl-3 pr-3 pb-[3.5rem] lg:pt-3 lg:pl-6 lg:pr-6 lg:pb-[5rem] pointer-events-auto">
                        <div className="relative w-full h-[40px] border-b border-[var(--color-neon)]/30 flex items-stretch shrink-0 mb-4">
                            <button
                                className={`flex-1 flex justify-center items-center text-[10px] lg:text-[12px] font-bold tracking-[0.2em] transition-all ${activeTab === 'missions' ? 'text-[var(--color-neon)] text-glow bg-[var(--color-neon)]/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                                onClick={() => setActiveTab('missions')}
                            >
                                MISSIONS
                            </button>
                            <div className="w-[1px] bg-[var(--color-neon)]/20 my-2" />
                            <button
                                className={`flex-1 flex justify-center items-center text-[10px] lg:text-[12px] font-bold tracking-[0.2em] transition-all ${activeTab === 'updates' ? 'text-[var(--color-neon)] text-glow bg-[var(--color-neon)]/5' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                                onClick={() => setActiveTab('updates')}
                            >
                                UPDATES
                            </button>
                        </div>

                        {/* ── MISSIONS TAB ── */}
                        {activeTab === 'missions' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 mb-2">
                                    <div className="space-y-3">
                                        {todaysMissions && todaysMissions.length > 0 ? todaysMissions.map((mission: any, i: number) => (
                                            <MissionItem key={i} item={{ time: mission.eventDay || 'Today', label: mission.title, date: mission.eventDate, active: true }} i={i} />
                                        )) : <div className="text-white/20 text-center py-8 text-[10px] tracking-[0.3em] uppercase font-black">NO MISSIONS TODAY</div>}
                                    </div>
                                </div>
                                <Link href="/home/missions" className="mt-auto flex items-center justify-center gap-2 p-3 border border-[var(--color-neon)]/30 hover:bg-[var(--color-neon)]/10 transition-all group pointer-events-auto text-[10px] font-bold tracking-[0.2em] text-[var(--color-neon)] rounded-sm bg-black/20 shadow-[0_0_10px_rgba(var(--color-neon-rgb),0.05)] shrink-0">
                                    ACCESS FULL HUB
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        )}

                        {/* ── UPDATES TAB ── */}
                        {activeTab === 'updates' && (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 mb-2">
                                    <div className="space-y-3">
                                        {announcements && announcements.length > 0 ? announcements.map((u: any, i: number) => {
                                            const colorMap: Record<string, string> = { INFO: '#22d3ee', ALERT: '#f97316', SUCCESS: '#a3e635', CRITICAL: '#f43f5e', NORMAL: '#fbbf24' };
                                            const uColor = colorMap[u.priority] || colorMap[u.category] || '#fbbf24';
                                            return <UpdateItem key={i} u={{ tag: u.category || 'INFO', color: uColor, time: u.time, title: u.title, desc: u.desc }} i={i} />;
                                        }) : <div className="text-white/20 text-center py-8 text-[10px] tracking-[0.3em] uppercase font-black">NO NEW UPDATES</div>}
                                    </div>
                                </div>
                                <Link href="/home/updates" className="mt-auto flex items-center justify-center gap-2 p-3 border border-[var(--color-neon)]/30 hover:bg-[var(--color-neon)]/10 transition-all group pointer-events-auto text-[10px] font-bold tracking-[0.2em] text-[var(--color-neon)] rounded-sm bg-black/20 shadow-[0_0_10px_rgba(var(--color-neon-rgb),0.05)] shrink-0">
                                    VIEW MORE UPDATES
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center font-orbitron">
                    {/* Mobile SVG and Logic */}
                    <svg className="absolute inset-0 w-full h-full opacity-95 pointer-events-none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" width="854" height="550" viewBox="0 0 854 550" fill="none">
                        <foreignObject x="-10" y="-10" width="873.5" height="570">
                            <div style={{ backdropFilter: 'blur(5px)', clipPath: 'url(#bgblur_missions_mobile)', height: '100%', width: '100%' }}></div>
                        </foreignObject>
                        <g data-figma-bg-blur-radius="10">
                            <path d="M847.501 516L821.501 550L380.5 550L338.001 526L55.501 526L0.501 476.5L0.501 63L55.501 29L273.501 29L298.5 0L827 0L854 29L847.501 516Z" fill="#C4C4C4" fillOpacity="0.08" />
                            <path d="M299.875 2.99932L275.773 30.9578L274.874 31.9998L273.499 32.0001L56.352 31.9995L3.501 64.6705L3.501 475.161L56.654 523L338.003 523L338.791 523L339.478 523.388L381.293 547L820.021 547L844.514 514.969L850.985 30.1645L825.693 2.9996L299.875 2.99932Z" stroke="url(#paint0_linear_missions_mobile)" strokeOpacity="0.8" strokeWidth="6" />
                            <path d="M299.875 2.99932L275.773 30.9578L274.874 31.9998L273.499 32.0001L56.352 31.9995L3.501 64.6705L3.501 475.161L56.654 523L338.003 523L338.791 523L339.478 523.388L381.293 547L820.021 547L844.514 514.969L850.985 30.1645L825.693 2.9996L299.875 2.99932Z" stroke="url(#paint1_linear_missions_mobile)" strokeOpacity="0.8" strokeWidth="6" />
                        </g>
                        <defs>
                            <clipPath id="bgblur_missions_mobile" transform="translate(10 10)">
                                <path d="M847.501 516L821.501 550L380.5 550L338.001 526L55.501 526L0.501 476.5L0.501 63L55.501 29L273.501 29L298.5 0L827 0L854 29L847.501 516Z" />
                            </clipPath>
                            <linearGradient id="paint0_linear_missions_mobile" x1="498.806" y1="151.697" x2="497.355" y2="-31.1325" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#231E1E" />
                                <stop offset="0.325058" stopColor="var(--color-neon)" />
                            </linearGradient>
                            <linearGradient id="paint1_linear_missions_mobile" x1="490.864" y1="-24.3707" x2="485.297" y2="389.66" gradientUnits="userSpaceOnUse">
                                <stop offset="0.532521" stopColor="#231E1E" stopOpacity="0" />
                                <stop offset="1" stopColor="var(--color-neon)" stopOpacity="0.8" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div className="absolute inset-0 z-10 flex flex-col">
                        <div className="flex w-full h-[18%] items-end justify-end pr-[15%] pb-2 relative border-b border-[var(--color-neon)]/10">
                            <div className="flex gap-6">
                                <button
                                    onClick={() => setActiveTab('missions')}
                                    className={`relative pb-2 transition-all duration-300 text-[2.2vw] font-black tracking-[0.3em] uppercase ${activeTab === 'missions' ? 'text-[var(--color-neon)] text-glow' : 'text-white/30 hover:text-white/60'}`}
                                >
                                    MISSIONS
                                    {activeTab === 'missions' && (
                                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--color-neon)] shadow-[0_0_10px_var(--color-neon)]" />
                                    )}
                                </button>
                                <div className="w-[1px] h-[3vw] bg-[var(--color-neon)]/20 self-center mb-2" />
                                <button
                                    onClick={() => setActiveTab('updates')}
                                    className={`relative pb-2 transition-all duration-300 text-[2.2vw] font-black tracking-[0.3em] uppercase ${activeTab === 'updates' ? 'text-[var(--color-neon)] text-glow' : 'text-white/30 hover:text-white/60'}`}
                                >
                                    UPDATES
                                    {activeTab === 'updates' && (
                                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--color-neon)] shadow-[0_0_10px_var(--color-neon)]" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 w-full flex flex-col items-center px-[8%] pb-[6%] pt-[1%] overflow-hidden">
                            {activeTab === 'missions' ? (
                                <div className="flex-1 w-full flex flex-col overflow-hidden">
                                    <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2 py-4" style={{ touchAction: 'pan-y' }}>
                                        <div className="space-y-4">
                                            {todaysMissions && todaysMissions.length > 0 ? todaysMissions.map((mission: any, i: number) => (
                                                <MissionItem key={i} item={{ time: mission.eventDay || 'Today', label: mission.title, date: mission.eventDate, active: true }} i={i} />
                                            )) : <div className="text-white/20 text-center py-10 text-[3.5vw] tracking-[0.3em] font-black w-full uppercase">NO MISSIONS TODAY</div>}
                                        </div>
                                    </div>
                                    <div className="w-full mt-auto pt-4 relative flex items-center justify-center pb-4">
                                        <Link href="/home/missions" className="w-full flex items-center justify-center py-[2.8vw] border border-[var(--color-neon)]/30 hover:border-[var(--color-neon)] hover:bg-[var(--color-neon)]/10 transition-all duration-300 group rounded bg-black/40 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--color-neon-rgb,57,255,20),0.05)]">
                                            <span className="text-[2.4vw] font-black tracking-[0.3em] text-[var(--color-neon)] group-hover:drop-shadow-[0_0_8px_var(--color-neon)] transition-all">ACCESS FULL HUB</span>
                                            <Zap className="w-[3.5vw] h-[3.5vw] text-[var(--color-neon)] ml-1.5 group-hover:drop-shadow-[0_0_8px_var(--color-neon)]" />
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 w-full flex flex-col overflow-hidden">
                                    <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2 py-4" style={{ touchAction: 'pan-y' }}>
                                        <div className="space-y-4">
                                            {announcements && announcements.length > 0 ? announcements.map((u: any, i: number) => {
                                                const colorMap: Record<string, string> = { INFO: '#22d3ee', ALERT: '#f97316', SUCCESS: '#a3e635', CRITICAL: '#f43f5e', NORMAL: '#fbbf24' };
                                                const uColor = colorMap[u.priority] || colorMap[u.category] || '#fbbf24';
                                                return <UpdateItem key={i} u={{ tag: u.category || 'INFO', color: uColor, time: u.time, title: u.title, desc: u.desc }} i={i} />;
                                            }) : <div className="text-white/20 text-center py-10 text-[3.2vw] tracking-[0.3em] font-black w-full uppercase">NO NEW UPDATES</div>}
                                        </div>
                                    </div>
                                    <div className="w-full mt-auto pt-4 relative flex items-center justify-center pb-4">
                                        <Link href="/home/updates" className="w-full flex items-center justify-center py-[2.8vw] border border-[var(--color-neon)]/30 hover:border-[var(--color-neon)] hover:bg-[var(--color-neon)]/10 transition-all duration-300 group rounded bg-black/40 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--color-neon-rgb,57,255,20),0.05)]">
                                            <span className="text-[2.4vw] font-black tracking-[0.3em] text-[var(--color-neon)] group-hover:drop-shadow-[0_0_8px_var(--color-neon)] transition-all">VIEW MORE UPDATES</span>
                                            <ArrowRight className="w-[3.5vw] h-[3.5vw] text-[var(--color-neon)] ml-1.5 group-hover:drop-shadow-[0_0_8px_var(--color-neon)]" />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
});
MissionsPanel.displayName = 'MissionsPanel';
