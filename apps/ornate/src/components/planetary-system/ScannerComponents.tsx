'use client';

import { motion } from 'framer-motion';

export function ScannerBackground() {
    // Tick mark ring
    const tickMarks = Array.from({ length: 36 }, (_, i) => i * 10);
    const cardinals: { [k: number]: string } = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

    return (
        <>
            {/* ── OUTER FRAME RING with TICK MARKS ── */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 320 320">
                <circle cx="160" cy="160" r="158" fill="none" stroke="var(--color-neon)" strokeWidth="0.5" strokeOpacity="0.25" />
                <circle cx="160" cy="160" r="154" fill="none" stroke="var(--color-neon)" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="4 3" />

                {tickMarks.map(deg => {
                    const isMajor = deg % 30 === 0;
                    const rad = (deg - 90) * Math.PI / 180;
                    const inner = isMajor ? 140 : 146;
                    const x1 = 160 + inner * Math.cos(rad);
                    const y1 = 160 + inner * Math.sin(rad);
                    const x2 = 160 + 154 * Math.cos(rad);
                    const y2 = 160 + 154 * Math.sin(rad);
                    return (
                        <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="var(--color-neon)" strokeWidth={isMajor ? 1.5 : 0.6}
                            strokeOpacity={isMajor ? 0.9 : 0.35}
                        />
                    );
                })}

                {[0, 90, 180, 270].map(deg => {
                    const rad = (deg - 90) * Math.PI / 180;
                    const tx = 160 + 128 * Math.cos(rad);
                    const ty = 160 + 128 * Math.sin(rad);
                    return (
                        <text key={deg} x={tx} y={ty + 4} textAnchor="middle" fill="var(--color-neon)" fontSize="9" fontFamily="monospace" fontWeight="bold" opacity="0.85">
                            {cardinals[deg]}
                        </text>
                    );
                })}

                {[30, 60, 120, 150, 210, 240, 300, 330].map(deg => {
                    const rad = (deg - 90) * Math.PI / 180;
                    const tx = 160 + 128 * Math.cos(rad);
                    const ty = 160 + 128 * Math.sin(rad);
                    return (
                        <text key={deg} x={tx} y={ty + 3.5} textAnchor="middle" fill="var(--color-neon)" fontSize="6" fontFamily="monospace" opacity="0.4">
                            {String(deg).padStart(3, '0')}
                        </text>
                    );
                })}
            </svg>

            {/* ── MAIN SCANNER CIRCLE ── */}
            <div className="absolute inset-[6px] rounded-full overflow-hidden bg-[#020c02] border border-[var(--color-neon)]/20" style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.9), 0 0 40px rgba(163,255,18,0.08)' }}>
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(163,255,18,0.04) 0%, transparent 65%)' }} />
                
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 308 308">
                    {[0.28, 0.5, 0.72, 0.92].map((frac, i) => (
                        <circle key={i} cx="154" cy="154" r={154 * frac} fill="none" stroke="var(--color-neon)" strokeWidth={i === 3 ? 0.5 : 0.4} strokeOpacity={i === 3 ? 0.3 : 0.15} strokeDasharray={i % 2 === 1 ? '3 4' : undefined} />
                    ))}
                    {[{ frac: 0.28, label: '25' }, { frac: 0.5, label: '50' }, { frac: 0.72, label: '75' }].map(({ frac, label }) => (
                        <text key={label} x={154 + 154 * frac - 4} y="158" fontSize="5" fill="var(--color-neon)" opacity="0.3" fontFamily="monospace">{label}</text>
                    ))}
                    {[0, 45, 90, 135].map(deg => {
                        const r = (deg - 90) * Math.PI / 180;
                        return <line key={deg} x1={154 + 154 * Math.cos(r)} y1={154 + 154 * Math.sin(r)} x2={154 - 154 * Math.cos(r)} y2={154 - 154 * Math.sin(r)} stroke="var(--color-neon)" strokeWidth="0.4" strokeOpacity="0.15" />;
                    })}
                    <line x1="154" y1="148" x2="154" y2="160" stroke="var(--color-neon)" strokeWidth="0.6" strokeOpacity="0.5" />
                    <line x1="148" y1="154" x2="160" y2="154" stroke="var(--color-neon)" strokeWidth="0.6" strokeOpacity="0.5" />
                </svg>
            </div>
        </>
    );
}

export function ScannerSweepBeam({ sweepAngle }: { sweepAngle: number }) {
    return (
        <motion.div className="absolute inset-[6px] rounded-full overflow-hidden pointer-events-none" style={{ rotate: sweepAngle }}>
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from -90deg, rgba(163,255,18,0.0) 0deg, rgba(163,255,18,0.32) 18deg, rgba(163,255,18,0.22) 40deg, rgba(163,255,18,0.10) 65deg, rgba(163,255,18,0.0) 90deg, transparent 360deg)' }} />
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from -90deg, transparent 0deg, rgba(163,255,18,0.06) 70deg, rgba(163,255,18,0.0) 120deg, transparent 360deg)' }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 origin-bottom" style={{ background: 'linear-gradient(to top, var(--color-neon), rgba(163,255,18,0.15))', boxShadow: '0 0 8px var(--color-neon), 0 0 18px rgba(163,255,18,0.5), 0 0 30px rgba(163,255,18,0.2)' }} />
        </motion.div>
    );
}
