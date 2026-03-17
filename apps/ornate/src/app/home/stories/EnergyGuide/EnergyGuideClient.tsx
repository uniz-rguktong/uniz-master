'use client';

import { motion } from 'framer-motion';
import { 
    Zap, Rocket, Target, Trophy, Award, Crown, 
    Star, Shield, User, ChevronRight, Globe,
    ChevronLeft, Info, Activity, Flame
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ACCENT_COLOR = '#00E5FF';
const GLOW_COLOR = 'rgba(0, 229, 255, 0.4)';

// --- Support Components ---
function SectionTitle({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) {
    return (
        <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#00E5FF]" />
                </div>
                <h3 className="text-[10px] font-black tracking-[0.4em] uppercase text-[#00E5FF]/60 font-mono">
                    {subtitle}
                </h3>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white italic uppercase tracking-tight">
                {title}
            </h2>
        </div>
    );
}

function ProtocolCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative p-6 sm:p-8 rounded-2xl bg-[#0A0C0A]/60 backdrop-blur-xl border border-white/5 overflow-hidden group ${className}`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-24 h-24 text-[#00E5FF]" />
            </div>
            {children}
        </motion.div>
    );
}

// --- Main Page ---
export default function EnergyGuideClient() {
    const router = useRouter();

    const levels = [
        { l: 'L1', name: 'EXPLORER', range: '0 - 150', color: '#94a3b8', icon: Rocket, info: 'Initial orientation and discovery phase.' },
        { l: 'L2', name: 'NAVIGATOR', range: '151 - 400', color: '#22d3ee', icon: Globe, info: 'Mapping the system and participating in missions.' },
        { l: 'L3', name: 'COMMANDER', range: '401 - 900', color: '#a78bfa', icon: Shield, info: 'Leading efforts and mastering specialized skills.' },
        { l: 'L4', name: 'GUARDIAN', range: '901 - 1728', color: '#f59e0b', icon: Crown, icon2: Flame, info: 'Protecting the Neon Core and mentoring others.' },
        { l: 'L5', name: 'LEGEND', range: '1729+', color: '#D6FF00', icon: Star, info: 'Immortal status in the Ornate Solar System.' }
    ];

    const badges = [
        { name: 'FIRST MISSION', reward: '+50', icon: Rocket, desc: 'Completed your first official mission.' },
        { name: 'PLANET EXPLORER', reward: '+50', icon: Globe, desc: 'Visited all major sectors of the Ornate system.' },
        { name: 'ORNATE VETERAN', reward: '+75', icon: Award, desc: 'Long-standing commitment to the colony.' },
        { name: 'LEGEND CADET', reward: '+200', icon: Crown, desc: 'Highest honor awarded for energy excellence.' }
    ];

    return (
        <div className="min-h-screen bg-[#020402] text-white font-rajdhani selection:bg-[#00E5FF]/30">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,255,0.08)_0%,transparent_70%)]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </div>

            {/* Top Navigation */}
            <header className="fixed top-0 left-0 right-0 z-50 p-6 flex items-center justify-between">
                <button 
                    onClick={() => router.push('/home/stories')}
                    className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 transition-all group backdrop-blur-md"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black tracking-[0.2em] uppercase font-orbitron">Archive Vault</span>
                </button>

                <div className="hidden sm:flex items-center gap-4">
                    <div className="px-4 py-2 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse shadow-[0_0_8px_#00E5FF]" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-[#00E5FF] font-orbitron uppercase">Protocol :: Active</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-40">
                {/* Hero Header */}
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-3 mb-6"
                    >
                        <Zap className="w-4 h-4 text-[#00E5FF]" />
                        <span className="text-sm font-black tracking-[0.5em] text-[#00E5FF] uppercase font-orbitron">Galactic Operations</span>
                    </motion.div>
                    <h1 className="text-5xl sm:text-8xl font-black italic uppercase tracking-tighter leading-none mb-6">
                        Energy <span className="text-[#00E5FF]">Guide</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-lg sm:text-xl text-white/50 leading-relaxed font-medium">
                        Welcome to the official manual for Neon Energy generation. Learn to harness the power of creativity and teamwork to ascend the Ornate ranks.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column - Points & Rewards */}
                    <div className="lg:col-span-12 space-y-10">
                        
                        <SectionTitle icon={Zap} title="Energy Generation" subtitle="Protocol :: EARNING" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Initialization Section */}
                            <ProtocolCard>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <User className="w-5 h-5 text-white/60" />
                                    </div>
                                    <h4 className="text-xl font-bold uppercase italic">Identity Init</h4>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Register Account', pts: 25 },
                                        { label: 'Complete Profile', pts: 10 },
                                        { label: 'Upload Avatar', pts: 5 }
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between items-center group/item">
                                            <span className="text-base text-white/40 group-hover/item:text-white transition-colors">{item.label}</span>
                                            <span className="text-lg font-black text-[#00E5FF] tabular-nums">+{item.pts} NEU</span>
                                        </div>
                                    ))}
                                </div>
                            </ProtocolCard>

                            {/* Missions Section */}
                            <ProtocolCard className="border-[#00E5FF]/20">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-[#00E5FF]/10 flex items-center justify-center">
                                        <Target className="w-5 h-5 text-[#00E5FF]" />
                                    </div>
                                    <h4 className="text-xl font-bold uppercase italic text-[#00E5FF]">Mission Field</h4>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Attend Event', pts: 25 },
                                        { label: 'Bronze Rank', pts: 50 },
                                        { label: 'Silver Rank', pts: 80 },
                                        { label: 'Gold Rank', pts: 150 }
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between items-center group/item">
                                            <span className="text-base text-white/40 group-hover/item:text-white transition-colors">{item.label}</span>
                                            <span className="text-lg font-black text-[#00E5FF] tabular-nums">+{item.pts} NEU</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/5 text-[10px] uppercase tracking-widest text-white/20 font-bold">
                                    Strategic Achievement Matrix
                                </div>
                            </ProtocolCard>

                            {/* Sports Section */}
                            <ProtocolCard>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <Trophy className="w-5 h-5 text-white/60" />
                                    </div>
                                    <h4 className="text-xl font-bold uppercase italic">Athletic Surge</h4>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Registration', pts: 20 },
                                        { label: 'Participation', pts: 35 },
                                        { label: 'Bronze Tier', pts: 75 },
                                        { label: 'Silver Tier', pts: 100 },
                                        { label: 'Gold Tier', pts: 150 }
                                    ].map(item => (
                                        <div key={item.label} className="flex justify-between items-center group/item">
                                            <span className="text-base text-white/40 group-hover/item:text-white transition-colors">{item.label}</span>
                                            <span className="text-lg font-black text-[#00E5FF] tabular-nums">+{item.pts} NEU</span>
                                        </div>
                                    ))}
                                </div>
                            </ProtocolCard>
                        </div>
                    </div>

                    {/* Full Width - Level Progression */}
                    <div className="lg:col-span-12 mt-20">
                        <SectionTitle icon={Award} title="The Level Ladder" subtitle="Protocol :: ASCENSION" />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                            {levels.map((lvl, i) => (
                                <motion.div 
                                    key={lvl.name}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="relative p-6 rounded-2xl border border-white/5 bg-[#0A0C0A]/40 overflow-hidden flex flex-col items-center text-center group"
                                >
                                    <div 
                                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" 
                                        style={{ background: lvl.color }}
                                    />
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500" style={{ background: `${lvl.color}20`, border: `1px solid ${lvl.color}40`, boxShadow: `0 0 20px ${lvl.color}20` }}>
                                        <lvl.icon className="w-7 h-7" style={{ color: lvl.color }} />
                                    </div>
                                    <span className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: lvl.color }}>{lvl.l}</span>
                                    <h5 className="text-xl font-black text-white mb-2">{lvl.name}</h5>
                                    <div className="px-3 py-1 rounded-full text-[11px] font-black tracking-widest bg-white/5 border border-white/10 mb-4">
                                        {lvl.range} NEU
                                    </div>
                                    <p className="text-xs text-white/40 font-medium leading-relaxed">
                                        {lvl.info}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Achievement Badges */}
                    <div className="lg:col-span-12 mt-20">
                        <SectionTitle icon={Crown} title="Honorary Badges" subtitle="Protocol :: CITATION" />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            {badges.map((badge, i) => (
                                <ProtocolCard key={badge.name} className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#00E5FF]/40 group-hover:bg-[#00E5FF]/10 transition-all duration-500">
                                        <badge.icon className="w-8 h-8 text-white/30 group-hover:text-[#00E5FF] transition-colors" />
                                    </div>
                                    <h4 className="text-lg font-black text-white mb-2 uppercase italic">{badge.name}</h4>
                                    <p className="text-sm text-white/40 mb-6 flex-1 font-medium">{badge.desc}</p>
                                    <div className="flex items-center gap-2 text-[#00E5FF] font-black text-xl italic tabular-nums">
                                        <Zap className="w-4 h-4 fill-[#00E5FF]" />
                                        {badge.reward} NEU
                                    </div>
                                </ProtocolCard>
                            ))}
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="lg:col-span-12 mt-32 text-center border-t border-white/5 pt-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-white/20" />
                                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/20">Official Ornate System Protocol v4.2</span>
                            </div>
                            <p className="text-xs text-white/30 max-w-lg leading-relaxed font-medium">
                                Neon Energy is calculated in real-time. Performance multipliers are applied based on galactic event synchronization. Level up to unlock restricted sectors and high-tier mission parameters.
                            </p>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/home/cadet-hub')}
                                className="mt-6 px-10 py-4 bg-[#00E5FF] text-black font-black italic uppercase tracking-widest rounded-sm shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:shadow-[0_0_50px_rgba(0,229,255,0.6)] transition-all"
                            >
                                Check My Rank
                            </motion.button>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @font-face {
                    font-family: 'Apex';
                    src: local('Orbitron');
                }
                body {
                    background-color: #020402;
                    color: white;
                }
            `}</style>
        </div>
    );
}
