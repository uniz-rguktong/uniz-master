'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    User, Shield, Camera, Gamepad2, Diamond, Trophy, Target,
    Edit2, Save, X, Loader2, Zap
} from 'lucide-react';
import ShipInterface from './ShipInterface';
import MissionSection from './MissionSection';
import { updateProfile } from '@/lib/actions/profile';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

/* ─── Section Header (matches Culturals/Sports pattern) ───────────────────── */
function SectionHeader({ subtitle, title }: { subtitle: string; title: string }) {
    const { accentColor: themeAccent } = useTheme();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center mb-10 md:mb-14"
        >
            <div className="flex items-center gap-4 mb-3">
                <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent" style={{ backgroundColor: `${themeAccent}60` }} />
                <span className="text-[10px] sm:text-[11px] tracking-[0.6em] font-black uppercase" style={{ color: themeAccent }}>{subtitle}</span>
                <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent" style={{ backgroundColor: `${themeAccent}60` }} />
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-wider sm:tracking-widest text-white uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                {title}
            </h2>
        </motion.div>
    );
}

export default function ProfileCard({ profile }: { profile?: any }) {
    const [profileImage, setProfileImage] = useState(profile?.avatarUrl || '/cybernetic_astronaut_profile.png');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState({
        fullName: profile?.name || '',
        idNumber: profile?.stdid || profile?.id?.slice(0, 8) || 'ORN-XXXX',
        department: profile?.branch || '',
        studyYear: profile?.currentYear || '',
        communication: profile?.email || '',
        phone: profile?.phone || '',
        status: 'OPERATIONAL'
    });

    // All stats from real database values — no mocks
    const stats = profile?.stats ?? { missions: 0, achievements: 0, skills: 0, followers: 0, following: 0 };
    const energy = profile?.gamification?.totalEnergy ?? 0;
    const badgeCount = profile?.gamification?.badgeIds?.length ?? 0;
    const cadetLevel = profile?.gamification?.level ?? { level: 1, name: 'EXPLORER', min: 0, max: 100 };
    const nextLevel = [{ level:1,name:'EXPLORER',min:0,max:100 },{ level:2,name:'NAVIGATOR',min:101,max:300 },
      { level:3,name:'COMMANDER',min:301,max:700 },{ level:4,name:'GUARDIAN',min:701,max:1200 },
      { level:5,name:'LEGEND',min:1201,max:Infinity }].find(l => l.level === cadetLevel.level + 1);
    const levelProgress = nextLevel
      ? Math.min(100, Math.round(((energy - cadetLevel.min) / (nextLevel.min - cadetLevel.min)) * 100))
      : cadetLevel.name === 'LEGEND' ? 100 : 0;
    const LEVEL_COLORS: Record<string, string> = {
      EXPLORER: '#94a3b8', NAVIGATOR: '#22d3ee', COMMANDER: '#a78bfa', GUARDIAN: '#f59e0b', LEGEND: '#D6FF00',
    };
    const levelColor = LEVEL_COLORS[cadetLevel.name] ?? '#D6FF00';

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await updateProfile({
                name: userData.fullName,
                phone: userData.phone,
                branch: userData.department,
                currentYear: userData.studyYear
            });
            if (res.success) {
                toast.success('Profile Updated Successfully');
                setIsEditing(false);
            } else {
                toast.error(res.error || 'Update Failed');
            }
        } catch {
            toast.error('System Error');
        } finally {
            setIsLoading(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setProfileImage(imageUrl);
        }
    };

    const statItems = [
        { icon: <Gamepad2 size={18} />, value: stats.missions, label: 'MISSIONS', color: '#D6FF00', border: '#D6FF00' },
        { icon: <Trophy size={18} />, value: stats.achievements, label: 'ACHIEVEMENTS', color: '#fbbf24', border: '#fbbf24' },
        { icon: <Diamond size={18} />, value: badgeCount, label: 'BADGES', color: '#22d3ee', border: '#22d3ee' },
        { icon: <Zap size={18} />, value: `${energy.toLocaleString()} NEU`, label: 'NEON ENERGY', color: levelColor, border: levelColor },
    ];

    const { accentColor: themeAccent, accentIndex } = useTheme();

    return (
        <div className="w-full font-orbitron">

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 1 — HERO: Banner + Avatar + Name + Stats
            ═══════════════════════════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 mb-16 md:mb-24">

                {/* Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative h-40 sm:h-48 md:h-56 w-full overflow-hidden bg-[#050510]"
                    style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)',
                        border: `1.5px solid ${themeAccent}30`
                    }}
                >
                    <div className="absolute inset-0 opacity-[0.1]"
                        style={{
                            backgroundImage: `linear-gradient(45deg, ${themeAccent}40 1px, transparent 1px), linear-gradient(-45deg, ${themeAccent}40 1px, transparent 1px)`,
                            backgroundSize: '40px 40px'
                        }}
                    />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.25] pointer-events-none select-none">
                        <span className="text-[60px] sm:text-[90px] md:text-[130px] font-black tracking-tighter whitespace-nowrap uppercase drop-shadow-[0_0_50px_currentColor]"
                                style={{ color: themeAccent }}>
                            PROFILE PAGE
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030308] via-transparent to-transparent" />
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D6FF00]/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D6FF00]/20 to-transparent" />
                </motion.div>

                {/* Avatar + Identity Block */}
                <div className="flex flex-col items-center -mt-14 sm:-mt-16 md:-mt-20 relative z-10">

                    {/* Avatar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative group cursor-pointer mb-5"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div
                            className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 border-[3px] border-[#D6FF00] bg-black flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(214,255,0,0.3)] relative z-10"
                            style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                        >
                            <img src={profileImage} alt="Avatar" className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-7 h-7 text-[#D6FF00]" />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                        <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#D6FF00]/60 pointer-events-none" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#D6FF00]/60 pointer-events-none" />
                    </motion.div>

                    {/* Name */}
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-[0.2em] uppercase mb-2 text-center"
                        style={{ textShadow: `0 0 30px ${levelColor}80` }}
                    >
                        {userData.fullName || 'OPERATIVE'}
                    </motion.h1>

                    {/* ID + Class */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 px-4 text-center"
                    >
                        <span className="text-sm sm:text-base text-[#D6FF00] tracking-[0.4em] uppercase font-black drop-shadow-[0_0_10px_#D6FF0050]">{userData.idNumber}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D6FF00]/60 hidden sm:block" />
                        <span className="text-sm sm:text-base text-white/80 tracking-[0.3em] uppercase font-bold">CLASS-A OPERATIVE</span>
                    </motion.div>

                    {/* Level + Neon Energy */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col items-center gap-3 mt-4"
                    >
                        {/* Cadet Level Badge */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="relative w-14 h-15 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                                    <div className="absolute inset-0 border-2 bg-black/80" style={{ borderColor: levelColor, boxShadow: `0 0 20px ${levelColor}40` }} />
                                    <span className="text-2xl font-black text-white relative z-10" style={{ textShadow: `0 0 8px ${levelColor}80` }}>{cadetLevel.level}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black tracking-[0.4em] uppercase" style={{ color: levelColor }}>CADET LVL {cadetLevel.level}</span>
                                    <span className="text-base font-black text-white tracking-widest uppercase drop-shadow-md">{cadetLevel.name}</span>
                                </div>
                            </div>
                        </div>
                        {/* Energy bar */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-48 sm:w-64 h-2 bg-white/5 border relative overflow-hidden" style={{ borderColor: `${levelColor}20`, clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}>
                                <motion.div
                                    className="absolute inset-y-0 left-0"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${levelProgress}%` }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                    style={{ background: `linear-gradient(90deg, ${levelColor}, ${levelColor}80)`, boxShadow: `0 0 10px ${levelColor}60` }}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4" style={{ color: levelColor }} />
                                <span className="text-xs text-white/70 font-black tracking-widest">
                                    <strong className="text-lg" style={{ color: levelColor, textShadow: `0_0_10px_${levelColor}40` }}>{energy.toLocaleString()}</strong>
                                    {nextLevel ? ` / ${nextLevel.min.toLocaleString()} NEU → ${nextLevel.name}` : ' NEU (MAX)'}
                                </span>
                                {badgeCount > 0 && <span className="text-xs text-[#D6FF00] font-black tracking-tighter drop-shadow-sm">{badgeCount} BADGES</span>}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap justify-center gap-3 mt-10 md:grid md:grid-cols-4 md:max-w-4xl md:mx-auto lg:flex lg:flex-nowrap lg:max-w-none"
                >
                    {statItems.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + i * 0.08 }}
                            className="relative group overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
                            style={{
                                background: 'rgba(10, 10, 20, 0.7)',
                                border: `1.5px solid ${stat.border}25`,
                                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
                                backdropFilter: 'blur(16px)'
                            }}
                        >
                            <div className="p-3 sm:p-4 flex items-center gap-3">
                                <div
                                    className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 border flex items-center justify-center"
                                    style={{ borderColor: `${stat.border}40`, color: stat.color, background: `${stat.border}10` }}
                                >
                                    {stat.icon}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xl sm:text-2xl font-black text-white mb-0.5">{stat.value}</span>
                                    <span className="text-[9px] sm:text-[10px] text-white/80 tracking-widest uppercase font-black truncate drop-shadow-sm">{stat.label}</span>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40" style={{ background: `linear-gradient(to right, transparent, ${stat.color}, transparent)` }} />
                            <div className="absolute -inset-2 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" style={{ background: `${stat.color}08` }} />
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 2 — PERSONAL DOSSIER + QR Code
            ═══════════════════════════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 mb-16 md:mb-24">
                <SectionHeader subtitle="Operative Data" title="PERSONAL INFORMATION" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left — Dossier Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-2"
                    >
                        <div
                            className="relative p-6 md:p-8 overflow-hidden"
                            style={{
                                background: 'rgba(10, 10, 20, 0.7)',
                                border: '1.5px solid rgba(214, 255, 0, 0.2)',
                                clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
                                backdropFilter: 'blur(16px)'
                            }}
                        >
                            {/* Corner decorations */}
                            <div className="absolute top-0 right-0 w-12 h-[1px] bg-[#D6FF00]/30" />
                            <div className="absolute top-0 right-0 w-[1px] h-12 bg-[#D6FF00]/30" />
                            <div className="absolute bottom-0 left-0 w-12 h-[1px] bg-[#D6FF00]/30" />
                            <div className="absolute bottom-0 left-0 w-[1px] h-12 bg-[#D6FF00]/30" />

                            {/* Header with Edit / Save / Cancel */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-[#D6FF00]" />
                                    <span className="text-sm font-black text-white tracking-[0.3em] uppercase">PERSONAL INFORMATION</span>
                                </div>
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={isLoading}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-[#D6FF00]/15 border border-[#D6FF00]/40 text-[#D6FF00] text-[9px] font-black tracking-widest uppercase hover:bg-[#D6FF00]/25 transition-all disabled:opacity-50"
                                            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                                        >
                                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                            {isLoading ? 'SAVING' : 'SAVE'}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/20 text-white/60 text-[9px] font-black tracking-widest uppercase hover:bg-white/10 transition-all"
                                            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                                        >
                                            <X className="w-3 h-3" /> CANCEL
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#D6FF00]/10 border border-[#D6FF00]/30 text-[#D6FF00] text-[9px] font-black tracking-widest uppercase hover:bg-[#D6FF00]/20 transition-all"
                                        style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                                    >
                                        <Edit2 className="w-3 h-3" /> EDIT
                                    </button>
                                )}
                            </div>

                            {/* Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <span className="text-[10px] text-[#D6FF00]/60 font-black tracking-[0.3em] uppercase block">FULL NAME</span>
                                    {isEditing ? (
                                        <input type="text" value={userData.fullName} onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                                            suppressHydrationWarning
                                            className="w-full bg-[#D6FF00]/5 border border-[#D6FF00]/20 focus:border-[#D6FF00]/60 text-white font-bold tracking-wider text-sm uppercase px-4 py-3 outline-none transition-colors" />
                                    ) : (
                                        <p className="text-white font-bold tracking-wider text-base sm:text-lg uppercase py-1">{userData.fullName || '—'}</p>
                                    )}
                                </div>

                                {/* ID Number */}
                                <div className="space-y-2">
                                    <span className="text-[10px] text-[#D6FF00]/60 font-black tracking-[0.3em] uppercase block">ID NUMBER</span>
                                    <p className="text-white font-bold tracking-wider text-base sm:text-lg uppercase italic py-1">{userData.idNumber}</p>
                                </div>

                                {/* Department */}
                                <div className="space-y-2">
                                    <span className="text-[10px] text-[#D6FF00]/60 font-black tracking-[0.3em] uppercase block">DEPARTMENT / BRANCH</span>
                                    {isEditing ? (
                                        <input type="text" value={userData.department} onChange={(e) => setUserData({ ...userData, department: e.target.value })}
                                            suppressHydrationWarning
                                            className="w-full bg-[#D6FF00]/5 border border-[#D6FF00]/20 focus:border-[#D6FF00]/60 text-white font-bold tracking-wider text-sm uppercase px-4 py-3 outline-none transition-colors" />
                                    ) : (
                                        <p className="text-white font-bold tracking-wider text-base sm:text-lg uppercase py-1">{userData.department || '—'}</p>
                                    )}
                                </div>

                                {/* Study Year */}
                                <div className="space-y-2">
                                    <span className="text-[10px] text-[#D6FF00]/60 font-black tracking-[0.3em] uppercase block">STUDY YEAR</span>
                                    {isEditing ? (
                                        <input type="text" value={userData.studyYear} onChange={(e) => setUserData({ ...userData, studyYear: e.target.value })}
                                            suppressHydrationWarning
                                            className="w-full bg-[#D6FF00]/5 border border-[#D6FF00]/20 focus:border-[#D6FF00]/60 text-white font-bold tracking-wider text-sm uppercase px-4 py-3 outline-none transition-colors" />
                                    ) : (
                                        <p className="text-white font-bold tracking-wider text-base sm:text-lg uppercase py-1">{userData.studyYear || '—'}</p>
                                    )}
                                </div>

                                {/* Communication */}
                                <div className="space-y-2">
                                    <span className="text-[10px] text-[#D6FF00]/60 font-black tracking-[0.3em] uppercase block">COMMUNICATION</span>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2">
                                            <input type="email" value={userData.communication} disabled suppressHydrationWarning
                                                className="w-full bg-white/5 border border-white/10 text-white/40 font-bold tracking-wider text-sm lowercase px-4 py-3 outline-none" />
                                            <input type="text" placeholder="PHONE (10 DIGITS)" value={userData.phone} suppressHydrationWarning
                                                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                                className="w-full bg-[#D6FF00]/5 border border-[#D6FF00]/20 focus:border-[#D6FF00]/60 text-white font-bold tracking-wider text-sm uppercase px-4 py-3 outline-none transition-colors" />
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-white font-bold tracking-wider text-base sm:text-lg lowercase">{userData.communication}</p>
                                            <p className="text-[#D6FF00]/50 font-mono text-[11px] tracking-widest mt-1">{userData.phone || 'NO PHONE LINKED'}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <span className="text-[10px] text-[#D6FF00]/60 font-black tracking-[0.3em] uppercase block">STATUS</span>
                                    {isEditing ? (
                                        <select value={userData.status} onChange={(e) => setUserData({ ...userData, status: e.target.value })}
                                            suppressHydrationWarning
                                            className="w-full bg-[#0A0A14] border border-[#D6FF00]/20 text-emerald-400 font-black tracking-widest text-sm uppercase px-4 py-3 outline-none focus:border-[#D6FF00]/60">
                                            <option value="OPERATIONAL">OPERATIONAL</option>
                                            <option value="OFFLINE">OFFLINE</option>
                                            <option value="MIA">MIA</option>
                                            <option value="REDEPLOYED">REDEPLOYED</option>
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-3 py-1">
                                            <div className={`w-2.5 h-2.5 rounded-full ${userData.status === 'OPERATIONAL' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]'}`} />
                                            <p className={`${userData.status === 'OPERATIONAL' ? 'text-emerald-400' : 'text-rose-500'} font-black tracking-widest text-sm uppercase`}>
                                                {userData.status}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right — QR + Quick Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >


                        {/* Clearance Card */}
                        <div
                            className="relative p-6"
                            style={{
                                background: 'rgba(10, 10, 20, 0.7)',
                                border: '1.5px solid rgba(214, 255, 0, 0.2)',
                                clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
                                backdropFilter: 'blur(16px)'
                            }}
                        >
                            <div className="flex items-center gap-2 mb-5">
                                <Shield className="w-4 h-4 text-[#D6FF00]" />
                                <span className="text-[10px] text-white font-black tracking-[0.2em] uppercase">CLEARANCE INFO</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-[10px] text-white/40 tracking-widest uppercase">Branch</span>
                                    <span className="text-sm text-white font-bold tracking-wider uppercase">{userData.department || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <span className="text-[10px] text-white/40 tracking-widest uppercase">Year</span>
                                    <span className="text-sm text-white font-bold tracking-wider uppercase">{userData.studyYear || '—'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-white/40 tracking-widest uppercase">Level</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black tracking-wider" style={{ color: levelColor }}>LVL {cadetLevel.level}</span>
                                        <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: levelColor }}>{cadetLevel.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 3 — MISSIONS
            ═══════════════════════════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 mb-16 md:mb-24">
                <SectionHeader subtitle="Operations Log" title="ACTIVE MISSIONS" />
                <MissionSection profile={profile} />
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 4 — SHIP CONFIG
            ═══════════════════════════════════════════════════════════════════ */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 mb-16 md:mb-24">
                <SectionHeader subtitle="Fleet Management" title="CUSTOMIZE YOUR STARSHIP" />
                <div className="h-[500px] lg:h-[600px] w-full">
                    <ShipInterface />
                </div>
            </section>
        </div>
    );
}
