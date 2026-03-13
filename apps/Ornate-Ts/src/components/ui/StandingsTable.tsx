'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, Activity } from 'lucide-react';
import type { StandingRow } from '@/lib/data/sports';

export const StandingsTable = memo(({ title, subtitle, data = [], categories = [], accentColor }: {
    title: string; subtitle: string; data?: StandingRow[]; categories?: string[]; accentColor: string;
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex flex-col relative group"
        >
            {/* Ambient aura */}
            <div
                className="absolute inset-x-0 -top-20 h-[500px] opacity-20 blur-[120px] pointer-events-none transition-all duration-1000 group-hover:opacity-30"
                style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
            />

            {/* Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 sm:mb-12 relative z-10 px-4 gap-4">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start sm:items-end">
                    <div className="relative w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full" />
                        <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-2 border border-white/5 rounded-full"
                            style={{ borderColor: `${accentColor}44` }} />
                        <Trophy className="w-6 h-6 sm:w-7 sm:h-7 relative z-10"
                            style={{ color: accentColor, filter: `drop-shadow(0 0 10px ${accentColor})` }} />
                    </div>
                    <div className="pb-0 sm:pb-2">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl sm:text-2xl font-black tracking-tighter text-white uppercase italic">{title}</h3>
                            <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full">
                                <span className="text-[7px] font-black tracking-widest text-[var(--color-neon)] animate-pulse">LIVE</span>
                            </div>
                        </div>
                        <p className="text-[10px] sm:text-[12px] tracking-[0.2em] sm:tracking-[0.4em] font-bold text-white/70 uppercase mt-2 font-orbitron">{subtitle}</p>

                    </div>
                </div>
            </div>

            {/* Card */}
            <div className="relative backdrop-blur-3xl rounded-[2rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-black/40">
                {/* HUD corners */}
                <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 opacity-20 pointer-events-none z-10"
                    style={{ borderColor: accentColor, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
                <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 opacity-20 pointer-events-none z-10"
                    style={{ borderColor: accentColor, clipPath: 'polygon(100% 100%, 0 100%, 100% 0)' }} />

                {/* Scrollable area */}
                <div className="overflow-x-auto custom-scroll-bright">
                    <table className="border-collapse w-full" style={{ minWidth: '600px' }}>
                        {/* THEAD */}
                        <thead>
                            <tr>
                                {/* Dept */}
                                <th className="text-left px-5 pt-7 pb-5" style={{ minWidth: 140 }}>
                                    <span className="text-[9px] font-black tracking-[0.4em] text-white/60 uppercase block mb-1">Dept</span>
                                    <div className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                                        <Target className="w-3.5 h-3.5" /> DEPARTMENT_ID
                                    </div>
                                </th>

                                {/* Categories columns */}
                                {(categories || []).map(cat => (
                                    <th key={cat} className="text-center px-4 pt-7 pb-5 border-l border-white/5" style={{ minWidth: 80 }}>
                                        <div className="flex items-center justify-center gap-2 text-white">
                                            <span className="text-[11px] font-black tracking-widest uppercase">{cat}</span>
                                        </div>
                                    </th>
                                ))}

                                {/* Total */}
                                <th className="text-right px-5 pt-7 pb-5 border-l border-white/5" style={{ minWidth: 80 }}>
                                    <span className="text-[9px] font-black tracking-[0.4em] text-white/60 uppercase block mb-1">Points</span>
                                    <div className="text-sm font-black tracking-wide text-white italic">TOTAL</div>
                                </th>
                            </tr>

                            {/* Header divider */}
                            <tr>
                                <td colSpan={2 + (categories?.length || 0)}
                                    style={{ height: 1, padding: 0, background: 'rgba(255,255,255,0.06)' }} />
                            </tr>
                        </thead>

                        {/* TBODY */}
                        <tbody>
                            {(data || []).map((row, idx) => {
                                const total = row.total || 0;

                                return (
                                    <motion.tr
                                        key={row.dept}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.08, duration: 0.45 }}
                                        className="group/row hover:bg-white/[0.04] transition-all duration-300 relative"
                                    >
                                        {/* Dept cell */}
                                        <td className="px-5 py-2.5 align-middle relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            {/* Row Glow Accent */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-0 group-hover/row:h-full transition-all duration-500 opacity-0 group-hover/row:opacity-100" style={{ backgroundColor: accentColor, boxShadow: `0 0 15px ${accentColor}` }} />

                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="p-2 bg-white/5 rounded-md border border-white/10 group-hover/row:border-current transition-all group-hover/row:scale-105"
                                                    style={{ color: accentColor }}>
                                                    <Activity className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-white tracking-wider italic">{row.dept}</div>
                                                    <div className="text-[8px] font-bold text-gray-600 tracking-widest uppercase">BRANCH</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Categories cell data */}
                                        {(categories || []).map(cat => {
                                            const val = row.scores ? (row.scores[cat] || 0) : 0;
                                            return (
                                                <td key={cat} className="px-4 py-2.5 align-middle border-l border-white/5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <DataNode value={val} color={accentColor} />
                                                </td>
                                            );
                                        })}

                                        {/* Total cell */}
                                        <td className="px-5 py-2.5 text-right align-middle border-l border-white/5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div className="inline-flex flex-col items-end">
                                                <span className="text-base font-black text-white tabular-nums tracking-tighter"
                                                    style={{ textShadow: total > 0 ? `0 0 15px ${accentColor}aa` : 'none' }}>
                                                    {total}
                                                </span>
                                                <div className="w-12 h-0.5 bg-white/10 mt-0.5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full"
                                                        style={{ backgroundColor: accentColor }}
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: '100%' }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 0.8, delay: 0.4 + idx * 0.08 }}
                                                    />
                                                </div>
                                                <div className="text-[7px] font-black text-white/20 tracking-tighter group-hover/row:text-white/40 transition-colors uppercase mt-0.5">SCORE</div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                .custom-scroll-bright::-webkit-scrollbar { height: 8px; }
                .custom-scroll-bright::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 10px; }
                .custom-scroll-bright::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); }
                .custom-scroll-bright::-webkit-scrollbar-thumb:hover { background: ${accentColor}cc; }
            `}</style>
        </motion.div>
    );
});
StandingsTable.displayName = 'StandingsTable';

export const DataNode = memo(({ value, color }: { value: number; color: string }) => {
    if (value === 0) return (
        <div className="flex justify-center items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        </div>
    );

    return (
        <div className="flex justify-center items-center">
            <div className="group/node relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 hover:scale-110 hover:bg-white/5 active:scale-95"
                style={{ border: `1px solid ${color}44` }}>
                {/* Node Glow */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover/node:opacity-100 transition-opacity duration-300 blur-md pointer-events-none"
                    style={{ background: `${color}22` }} />

                <span className="text-sm font-black text-white italic leading-none relative z-10 group-hover/node:text-white transition-colors"
                    style={{ textShadow: `0 0 10px ${color}66` }}>{value}</span>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l opacity-40 group-hover/node:opacity-100 transition-opacity" style={{ borderColor: color }} />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r opacity-40 group-hover/node:opacity-100 transition-opacity" style={{ borderColor: color }} />
            </div>
        </div>
    );
});
DataNode.displayName = 'DataNode';
