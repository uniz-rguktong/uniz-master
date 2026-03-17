'use client';

import { useRef, memo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Github, Linkedin, Globe, ChevronRight, Star, Users, GraduationCap, Award, Building, Rocket, Target, Eye, Sparkles, Layout, DraftingCompass, Cpu, Layers, Database, ShieldCheck, Terminal } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import MissionsFooter from '@/components/missions/MissionsFooter';
import SectorHeader from '@/components/layout/SectorHeader';
import { TEAM_DATA, TeamMember } from '@/lib/data/team';

/* ─── Animated Counter Component ─── */
const AnimatedCounter = ({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!isInView) return;

        const interval = setInterval(() => {
            setDisplay(prev => {
                const next = Math.min(prev + Math.ceil(value / 40), value);
                if (next >= value) {
                    clearInterval(interval);
                }
                return next;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [isInView, value]);

    return <span ref={ref}>{prefix}{isInView ? display.toLocaleString() : '0'}{suffix}</span>;
};

/* ─── Section Header ─── */
const SectionHeader = memo(({ subtitle, title }: { subtitle: string; title: string }) => {
    const words = title.split(' ');
    const lastWord = words.pop();
    const mainTitle = words.join(' ');

    return (
        <div className="w-full max-w-[1400px] mx-auto mb-16 md:mb-24 flex flex-col items-start px-4 md:px-0">
            <div className="flex items-center gap-3 mb-4">
                <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-[#D4AF37] font-mono text-[10px] sm:text-xs tracking-[0.5em] uppercase flex items-center gap-2">
                    <Sparkles className="w-3 h-3 sm:w-4 h-4" /> {subtitle}
                </span>
            </div>
            <div className="flex items-center gap-6">
                <div className="w-2 h-10 md:w-3 md:h-14 bg-[#D4AF37]" />
                <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-white italic">
                    {mainTitle} <span className="text-[#D4AF37]">{lastWord}</span>
                </h2>
            </div>
        </div>
    );
});
SectionHeader.displayName = 'SectionHeader';


/* ─── Team Member Card (Identity Badge / Sports Style) ─── */
/* ─── Team Member Card (Modern Square Style) ─── */
const TeamMemberCard = memo(({ dev, i }: { dev: any; i: number }) => {
    const roleIcons: Record<string, any> = {
        'UI/UX Designing': DraftingCompass,
        'Frontend Engineering': Layout,
        'Backend & Database': Database,
        'Full Stack Development': Terminal, 
        'Production': Cpu,
        'Testing & QA': ShieldCheck
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="group relative"
        >
            {/* Minimalist Team Lead Indicator */}
            {dev.isTeamLead && (
                <div className="absolute -top-2 left-6 z-50">
                    <div className="px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#BF953F] rounded-md shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                        <span className="text-[8px] font-black tracking-[0.2em] text-black uppercase">TEAM_LEAD</span>
                    </div>
                </div>
            )}

            <div 
                className={`relative bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all duration-500 hover:bg-white/[0.05] hover:border-[#D4AF37]/30 group-hover:-translate-y-1`}
            >
                {/* Compact Image Container */}
                <div className="relative w-full aspect-[1.1/1] rounded-xl overflow-hidden mb-4 border border-white/5">
                    <Image
                        src={dev.image}
                        alt={dev.name}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    
                    {/* Minimal LinkedIn Icon */}
                    <Link 
                        href={dev.linkedin || "#"} 
                        target="_blank" 
                        className="absolute bottom-3 right-3 z-30 flex items-center justify-center w-7 h-7 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
                    >
                        <Linkedin className="w-3 h-3" />
                    </Link>
                </div>

                {/* Name - Single Line & Smaller */}
                <div className="mb-3">
                    <h4 className="text-lg font-black tracking-tight text-white uppercase italic truncate group-hover:text-[#D4AF37] transition-colors">
                        {dev.name}
                    </h4>
                </div>

                {/* Categories - Extra Compact List */}
                <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                    {dev.categories.slice(0, 2).map((cat: string, idx: number) => {
                        const Icon = roleIcons[cat] || Star;
                        return (
                            <div key={idx} className="flex items-center gap-3 group/item">
                                <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center border border-white/5 group-hover/item:border-[#D4AF37]/30 transition-all">
                                    <Icon className="w-3 h-3 text-white/50 group-hover/item:text-[#D4AF37]" />
                                </div>
                                <span className="text-[9px] font-bold tracking-[0.1em] text-white/40 uppercase truncate group-hover/item:text-white/80">
                                    {cat}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Subtle Decorative Badge */}
                <div className="mt-4 flex justify-between items-center opacity-30">
                    <span className="text-[7px] font-mono tracking-tighter text-white/40">SEC_ID: {i + 104}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                </div>
            </div>
        </motion.div>
    );
});
TeamMemberCard.displayName = 'TeamMemberCard';

/* ─── Partner Logo ─── */
const PartnerLogo = memo(({ name, i }: { name: string; i: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: i * 0.1 }}
        className="group relative px-8 py-6 border border-white/5 rounded-2xl hover:border-[#D4AF37]/30 transition-all duration-500 cursor-pointer hover:bg-[#D4AF37]/[0.03]"
    >
        <span className="text-2xl sm:text-3xl font-black uppercase tracking-[0.15em] text-white/30 group-hover:text-white/80 transition-all duration-500">{name}</span>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#D4AF37] group-hover:w-full transition-all duration-500" />
    </motion.div>
));
PartnerLogo.displayName = 'PartnerLogo';

/* ═════════════════════════ MAIN PAGE ═════════════════════════ */
export default function AboutPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
    const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
    const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);
    const heroBorderRadius = useTransform(scrollYProgress, [0, 1], ["0px", "60px"]);
    const textScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
    const textY = useTransform(scrollYProgress, [0, 0.5, 1], ["0%", "5%", "25%"]);
    const { scrollY } = useScroll();
    const zoomScale = useTransform(scrollY, [0, 1000], [1, 2.5]);
    const smoothScale = useSpring(zoomScale, { stiffness: 100, damping: 30, restDelta: 0.001 });

    const { scrollYProgress: timelineProgress } = useScroll({ target: timelineRef, offset: ["start 70%", "end 50%"] });
    const scaleY = useSpring(timelineProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    const timelineData = [
        { year: '2016', text: 'RGUKT Ongole campus established as a premier technical institution dedicated to empowering talented rural youth of Andhra Pradesh.' },
        { year: '2017', text: 'First batch of students admitted into the unique 6-year integrated B.Tech program, combining Pre-University and Engineering education.' },
        { year: '2018', text: 'Student communities, technical clubs, and creative organizations began forming across the campus.' },
        { year: '2019', text: 'Expansion of academic departments and advanced laboratories across engineering branches.' },
        { year: '2020', text: 'Digital learning systems and technology-enabled education strengthened to support large-scale student learning.' },
        { year: '2021', text: 'Campus innovation culture grew with workshops, hackathons, and student-driven technical initiatives.' },
        { year: '2022', text: 'Ornate evolved into a major student-driven festival combining technology, creativity, and cultural celebrations.' },
        { year: '2023', text: 'Growth of research activities, internships, and industry collaborations for students across departments.' },
        { year: '2024', text: 'Student clubs, technical communities, and leadership initiatives expanded across campus.' },
        { year: '2025', text: 'A vibrant ecosystem of innovation, creativity, and collaboration continues shaping the next generation of engineers.' },
    ];

    const timelineSteps = timelineData.map((step, i) => {
        const start = i / timelineData.length;
        const end = (i + 1) / timelineData.length;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const stepOpacity = useTransform(timelineProgress, [start - 0.05, start, end, end + 0.05], [0.2, 1, 1, 0.2]);

        return {
            ...step,
            opacity: stepOpacity,
            // Split content left/right based on index
            left: i % 2 === 0 ? step.text : '',
            right: i % 2 !== 0 ? step.text : ''
        };
    });

    const stats = [
        { icon: <Users className="w-6 h-6" />, value: 5000, suffix: '+', label: 'CADETS ENROLLED' },
        { icon: <GraduationCap className="w-6 h-6" />, value: 200, suffix: '+', label: 'EXPERT FACULTY' },
        { icon: <Award className="w-6 h-6" />, value: 95, suffix: '%', label: 'PLACEMENT RATE' },
        { icon: <Building className="w-6 h-6" />, value: 5, suffix: '', label: 'ENGINEERING BRANCHES' },
        { icon: <Star className="w-6 h-6" />, value: 10, suffix: '+', label: 'YEARS OF EXCELLENCE' },
        { icon: <Rocket className="w-6 h-6" />, value: 50, suffix: '+', label: 'ACTIVE STUDENT CLUBS' },
    ];


    const partners = ['TCS', 'WIPRO', 'INFOSYS', 'IBM', 'COGNIZANT', 'ACCENTURE'];

    const [activeMainTab, setActiveMainTab] = useState(TEAM_DATA[0].id);
    const [activeSubTab, setActiveSubTab] = useState('ALL');

    const subTabs = [
        { name: 'ALL', icon: Layers },
        { name: 'UI/UX Designing', icon: DraftingCompass },
        { name: 'Frontend Engineering', icon: Layout },
        { name: 'Backend & Database', icon: Database },
        { name: 'Production', icon: Cpu },
        { name: 'Testing & QA', icon: ShieldCheck },
    ];

    const currentProject = TEAM_DATA.find(p => p.id === activeMainTab)!;

    const filteredMembers = currentProject.members.filter(m =>
        activeSubTab === 'ALL' ? true : m.categories.includes(activeSubTab)
    );

    return (
        <main className="relative w-screen bg-[#030308] font-orbitron text-white overflow-x-hidden">

            {/* ── Navigation ── */}
            <SectorHeader
                accentColor="#D4AF37"
                showTitle={false}
            />

            {/* ── Scroll Tracking ── */}
            <div ref={containerRef} className="absolute top-0 left-0 w-full h-[250vh] pointer-events-none" />

            {/* ══════ 1) HERO SECTION (KEPT AS-IS) ══════ */}
            <div className="relative w-full h-[150vh] pointer-events-none">
                <motion.div style={{ scale: heroScale, opacity: heroOpacity, borderRadius: heroBorderRadius, transformOrigin: "top center" }}
                    className="fixed top-0 left-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center transform-gpu bg-[#06060c] z-0 will-change-[transform,opacity,border-radius]">
                    <motion.div style={{ scale: smoothScale, x: "-50%", y: "-50%" }}
                        className="absolute top-1/2 left-1/2 w-[150vw] h-[150vh] pointer-events-none z-0 will-change-transform opacity-40">
                        <Image src="/assets/rgukt_building.jpeg" alt="RGUKT Background" fill className="object-cover select-none" priority />
                    </motion.div>
                    <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,3,8,0.95)_100%)] pointer-events-none" />
                    <motion.div style={{ scale: textScale, y: textY }} className="relative z-10 flex flex-col items-center select-none will-change-transform">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                            <span className="text-[#D4AF37] text-sm font-black tracking-[0.6em] uppercase flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Legacy Terminal
                            </span>
                            <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D4AF37]" />
                        </div>
                        <h1 className="text-7xl sm:text-[10rem] md:text-[15rem] font-black leading-[0.8] tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] drop-shadow-2xl mb-4">
                            ORNATE
                        </h1>
                        <h2 className="text-[10px] sm:text-xl md:text-4xl font-black leading-none tracking-[0.5em] sm:tracking-[1em] md:tracking-[0.8em] text-white/40 uppercase whitespace-nowrap">
                            10TH ANNIVERSARY
                        </h2>
                    </motion.div>
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-70">
                        <span className="text-[10px] tracking-[0.3em] font-bold mb-4 uppercase text-gray-400">Scroll Down</span>
                        <div className="w-[1px] h-16 bg-gradient-to-b from-[#D4AF37] to-transparent animate-pulse" />
                    </div>
                </motion.div>
            </div>

            {/* ══════ 2) ABOUT OUR INSTITUTION ══════ */}
            <div className="relative z-20 w-full min-h-screen bg-[#08080a] rounded-t-[40px] md:rounded-t-[80px] shadow-[0_-30px_60px_rgba(0,0,0,0.9)] border-t border-white/5 flex flex-col items-center px-4 md:px-12 pt-24 pb-20 overflow-hidden mt-[-2px]">
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white/20 rounded-full" />

                {/* Ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D4AF37]/[0.03] rounded-full blur-[200px] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent pointer-events-none" />

                <SectionHeader subtitle="COMMAND CENTER" title="RGUKT ONGOLE" />

                <div className="w-full max-w-[1400px] flex flex-col lg:flex-row gap-12 lg:gap-20 relative z-10">
                    {/* Left: Image + Info Cards */}
                    <div className="w-full lg:w-[55%] flex flex-col gap-8">
                        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                            className="w-full aspect-[16/10] relative rounded-2xl overflow-hidden border border-[#D4AF37]/20 shadow-[0_0_60px_rgba(212,175,55,0.08)] group">
                            <Image src="/assets/5.png" alt="RGUKT Campus" fill className="object-cover transition-transform duration-[2000ms] group-hover:scale-[1.03] opacity-80 group-hover:opacity-100" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent opacity-60" />
                            <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#D4AF37]/50 z-20" />
                            <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#D4AF37]/50 z-20" />
                            <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#D4AF37]/50 z-20" />
                            <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#D4AF37]/50 z-20" />
                            <div className="absolute bottom-6 left-6 z-20">
                                <span className="text-[#D4AF37] font-mono text-[10px] tracking-[0.4em] uppercase">EST. 2016</span>
                            </div>
                        </motion.div>

                        {/* Info cards row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { icon: <Target className="w-6 h-6" />, title: 'CAMPUS MISSION', text: 'Empowering rural youth through high-quality technical education, hands-on learning, and opportunities to innovate and lead in a technology-driven world.' },
                                { icon: <Sparkles className="w-6 h-6" />, title: 'WHAT MAKES RGUKT UNIQUE', text: 'A fully residential six-year integrated program combining Pre-University and B.Tech education, designed to provide free and accessible learning opportunities for talented rural students.' },
                            ].map((card, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: i * 0.15 }}
                                    className="relative bg-[#0a0a0c]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 sm:p-8 group overflow-hidden"
                                >
                                    {/* Background decorative elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/[0.02] rounded-full blur-[60px] group-hover:bg-[#D4AF37]/[0.1] transition-all duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    {/* Corner Brackets */}
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37]/20 group-hover:border-[#D4AF37]/60 transition-colors duration-500" />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37]/20 group-hover:border-[#D4AF37]/60 transition-colors duration-500" />

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                                                {card.icon}
                                            </div>
                                            <span className="font-black text-sm sm:text-base tracking-[0.2em] text-white/90 group-hover:text-[#D4AF37] transition-colors duration-500">{card.title}</span>
                                        </div>
                                        <p className="text-gray-400 font-medium text-sm sm:text-base leading-relaxed group-hover:text-gray-200 transition-colors duration-500">{card.text}</p>
                                    </div>

                                    {/* Hover scanline effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1500ms] pointer-events-none" />
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Description + Stats */}
                    <div className="w-full lg:w-[45%] flex flex-col justify-center">
                        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                            className="mb-12">
                            <h3 className="text-2xl font-black text-white mb-6 tracking-tight uppercase">
                                Rajiv Gandhi University of Knowledge Technologies – Ongole
                            </h3>
                            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                                RGUKT Ongole is a premier state university dedicated to empowering talented rural students through world-class technical education. Established to nurture innovation and opportunity, the university provides a unique six-year integrated B.Tech program that begins immediately after Class X.
                            </p>
                            <p className="text-gray-500 font-mono text-sm leading-relaxed">
                                The campus combines strong academics with modern infrastructure, advanced laboratories, and a vibrant student community. By integrating technology-driven learning, practical experimentation, and interdisciplinary education, RGUKT prepares students to become engineers, innovators, and leaders of the future.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stats.map((stat, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                                    className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 group hover:border-[#D4AF37]/40 transition-all duration-500 hover:bg-black cursor-default text-left relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                        {stat.icon}
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                                            {stat.icon}
                                        </div>
                                        <div className="text-3xl font-black text-white tracking-tighter">
                                            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                        </div>
                                    </div>
                                    <div className="text-[9px] font-black tracking-[0.3em] text-gray-500 group-hover:text-[#D4AF37] uppercase transition-colors">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 3) VISION & MISSION ─── */}
            <div className="relative z-20 w-full bg-[#050506] border-t border-white/5 py-24 md:py-32 px-4 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#D4AF37 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }} />
                <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {[
                        { icon: <Eye className="w-10 h-10" />, title: 'OUR VISION', text: 'To transform rural youth into global leaders and innovators in Science, Technology, and multidisciplinary areas, and contribute to the maximisation of welfare of humanity.' },
                        { icon: <Target className="w-10 h-10" />, title: 'OUR MISSION', text: 'To provide quality technical education with the goal of inclusiveness in terms of access to the meritorious rural youth, who are perennially deprived of opportunities, through an innovative blend of modern computer-assisted, learner-centric instructional methodology along with rigorous traditional teaching in a world-class ambience.' },
                    ].map((item, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -10 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: i * 0.2 }}
                            className="relative bg-[#0a0a0c]/40 backdrop-blur-2xl border border-[#D4AF37]/10 rounded-[2.5rem] p-10 md:p-14 group overflow-hidden"
                        >
                            {/* Decorative aura */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#D4AF37]/[0.05] rounded-full blur-[100px] group-hover:bg-[#D4AF37]/[0.15] transition-all duration-1000" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />

                            <div className="relative z-10">
                                <div className="mb-10 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.05)] group-hover:scale-110 transition-transform duration-700">
                                    {item.icon}
                                </div>

                                <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-8 group-hover:text-[#D4AF37] transition-colors duration-500">{item.title}</h3>

                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-[2px] w-16 bg-[#D4AF37]/40 group-hover:w-24 group-hover:bg-[#D4AF37] transition-all duration-700" />
                                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]/40 group-hover:bg-[#D4AF37] animate-pulse" />
                                </div>

                                <p className="text-gray-300 text-lg md:text-xl leading-relaxed font-medium group-hover:text-white transition-colors duration-500">
                                    {item.text}
                                </p>
                            </div>

                            {/* Border highlights */}
                            <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-[#D4AF37]/20" />
                            <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-[#D4AF37]/20" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ══════ 4) 10-YEAR JOURNEY PATH ══════ */}
            <div className="relative z-20 w-full bg-[#040405] overflow-hidden flex flex-col items-center py-24 md:py-32 border-t border-white/5">
                <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <SectionHeader subtitle="A DECADE OF INNOVATION" title="OUR 10-YEAR JOURNEY" />

                <div ref={timelineRef} className="w-full max-w-[1200px] relative z-10 px-4">
                    {/* Central Line */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2 overflow-hidden">
                        <motion.div style={{ scaleY, originY: 0 }} className="w-full h-full bg-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.6)]" />
                    </div>

                    {timelineSteps.map((step, i) => (
                        <motion.div key={i} style={{ opacity: step.opacity }}
                            className="relative grid grid-cols-1 md:grid-cols-[1fr_80px_1fr] gap-4 md:gap-0 mb-16 md:mb-0 md:min-h-[250px]">

                            {/* Left content - Even index (2016, 2018...) */}
                            <div className="p-6 md:p-10 flex flex-col items-start md:items-end text-left md:text-right group">
                                {i % 2 === 0 && (
                                    <>
                                        <span className="text-[#D4AF37] font-mono text-xs tracking-[0.3em] mb-3 md:hidden">{step.year}</span>
                                        <p className="text-gray-300 text-lg md:text-xl font-medium tracking-wide leading-relaxed group-hover:text-white transition-all duration-500">
                                            {step.text}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Center dot + year (Always visible on desktop) */}
                            <div className="hidden md:flex flex-col items-center justify-center relative">
                                <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border-2 border-[#D4AF37]/50 flex items-center justify-center z-10 shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                                    <span className="text-[#D4AF37] font-black text-xs tracking-wider">{step.year}</span>
                                </div>
                            </div>

                            {/* Right content - Odd index (2017, 2019...) */}
                            <div className="p-6 md:p-10 flex flex-col items-start text-left group">
                                {i % 2 !== 0 && (
                                    <>
                                        <span className="text-[#D4AF37] font-mono text-xs tracking-[0.3em] mb-3 md:hidden">{step.year}</span>
                                        <p className="text-gray-300 text-lg md:text-xl font-medium tracking-wide leading-relaxed group-hover:text-white transition-all duration-500">
                                            {step.text}
                                        </p>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>


            {/* ══════ 6) WEB TEAM (RE-ENGINEERED SHOWCASE) ══════ */}
            <div className="relative z-20 w-full bg-[#030308] text-white flex flex-col px-4 md:px-12 py-16 md:py-20 border-t border-white/5 overflow-hidden">
                {/* Space Atmosphere */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] bg-blue-500/[0.03] rounded-full blur-[200px] pointer-events-none" />
                <div className="absolute inset-0 opacity-10 bg-[url('/assets/stars_bg.png')] pointer-events-none bg-repeat" />

                <div className="max-w-[1400px] mx-auto w-full mb-12 text-center">
                    <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center gap-4">
                        <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white uppercase italic">
                            CREW BEHIND <span className="text-[#D4AF37]">ORNATE</span> UNIVERSE
                        </h2>
                        <p className="text-xs sm:text-sm font-medium tracking-widest text-white/40 max-w-2xl px-4">
                            A cross-functional team that designed, engineered, and launched a narrative-driven fest ecosystem
                        </p>
                    </motion.div>
                </div>

                {/* Main Tabs (Centered Slanted Style) */}
                <div className="max-w-[1000px] mx-auto w-full mb-12">
                    <div className="flex justify-center gap-4 border-b border-white/5 relative">
                        {TEAM_DATA.map(project => (
                            <button
                                key={project.id}
                                onClick={() => setActiveMainTab(project.id)}
                                className={`relative px-12 py-5 text-xs font-black tracking-[0.4em] uppercase transition-all duration-500 overflow-hidden
                                    ${activeMainTab === project.id ? 'text-[#D4AF37]' : 'text-white/20 hover:text-white/40'}`}
                                style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0 100%)' }}
                            >
                                <span className="relative z-10">{project.title}</span>
                                {activeMainTab === project.id && (
                                    <motion.div layoutId="mainTabGlow" className="absolute inset-0 bg-[#D4AF37]/5 blur-xl z-0" />
                                )}
                                {activeMainTab === project.id && (
                                    <motion.div layoutId="mainTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_15px_#D4AF37]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-w-[1400px] mx-auto w-full">
                    <div className="mb-16">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeMainTab}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="flex items-center gap-6 mb-16 px-4">
                                     <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
                                        {TEAM_DATA.find(p => p.id === activeMainTab)?.title}
                                     </h3>
                                     <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                     <span className="text-[10px] font-mono tracking-[0.5em] text-white/20 uppercase">{activeMainTab.replace('-', '_')}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-12">
                                     {TEAM_DATA.find(p => p.id === activeMainTab)?.members.map((dev, i) => (
                                         <TeamMemberCard key={dev.name} dev={dev} i={i} />
                                     ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Decorative Tech Banner */}
                <div className="mt-12 w-full max-w-[1400px] mx-auto opacity-10 border-y border-white/10 py-10 flex justify-around items-center grayscale pointer-events-none">
                    <span className="font-mono text-[10px] tracking-[1.2em]">ACCESS_CONTROL_V10.2</span>
                    <span className="font-mono text-[10px] tracking-[1.2em]">SECURE_PERSONNEL_HUB</span>
                    <span className="font-mono text-[10px] tracking-[1.2em]">SYSTEM_STABLE</span>
                </div>
            </div>

            {/* ══════ 7) PARTNERS ══════ */}
            <div className="relative z-20 w-full bg-[#0a0a0d] border-t border-white/5 py-24 md:py-32 flex flex-col items-center px-4 overflow-hidden">
                <SectionHeader subtitle="TRUSTED BY THE BEST" title="OUR PARTNERS" />

                <div className="w-full relative overflow-hidden group">
                    {/* Gradient Fades for Marquee */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0a0a0d] to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#0a0a0d] to-transparent z-10 pointer-events-none" />

                    <motion.div
                        className="flex gap-12 w-max py-4"
                        animate={{ x: [0, -1000] }}
                        transition={{
                            repeat: Infinity,
                            duration: 30,
                            ease: "linear"
                        }}
                    >
                        {[...partners, ...partners, ...partners].map((name, i) => (
                            <PartnerLogo key={`${name}-${i}`} name={name} i={i} />
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* ══════ 8) HIGHLIGHT QUOTE ══════ */}
            <div className="relative z-20 w-full min-h-[70vh] flex flex-col items-center justify-center p-8 md:p-16 overflow-hidden border-t border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a1300] via-[#D4AF37]/5 to-[#030308] -z-10" />
                <motion.h2 initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
                    className="text-4xl sm:text-6xl md:text-7xl lg:text-[6.5rem] font-black text-white uppercase text-center leading-[0.9] tracking-tighter max-w-[1400px]">
                    WHERE STUDENTS<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] to-[#FCF6BA]">BUILD SKILLS</span><br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] to-[#B38728]">CHASE PASSION</span><br />
                    AND BECOME<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FCF6BA] to-[#BF953F]">VISIONARIES</span>
                </motion.h2>
            </div>

            {/* ══════ 9) PHOTO STRIP + ORNATE SIGNOFF ══════ */}
            <div className="relative z-20 w-full bg-[#030304] border-t border-white/5 overflow-hidden">
                {/* Photo strip */}
                <div className="w-full relative overflow-hidden py-4">
                    <motion.div className="flex gap-4 w-max" animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, ease: "linear", duration: 60 }}>
                        {[
                            "/assets/5.png", "/assets/6.png", "/assets/4.png",
                            "/assets/5.png", "/assets/6.png", "/assets/4.png",
                            "/assets/5.png", "/assets/6.png", "/assets/4.png",
                            "/assets/5.png", "/assets/6.png", "/assets/4.png",
                        ].map((src, i) => (
                            <div key={i} className="relative flex-none w-[300px] sm:w-[400px] aspect-[16/9] rounded-xl overflow-hidden border border-white/5 opacity-60 hover:opacity-100 transition-opacity duration-500">
                                <Image src={src} alt="Campus" fill className={`${src.includes('falcon') ? 'object-contain p-8' : 'object-cover'} grayscale hover:grayscale-0 transition-all duration-700`} />
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Big ORNATE text */}
                <div className="flex flex-col items-center py-20 md:py-32">
                    <h2 className="text-[15vw] sm:text-[12vw] md:text-[10vw] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent uppercase leading-none font-astra select-none">
                        ORNATE
                    </h2>
                    <p className="text-gray-600 font-mono text-[10px] sm:text-xs tracking-[0.5em] uppercase mt-4">
                        A FEST BEYOND EARTH — 10TH ANNIVERSARY EDITION
                    </p>
                    <p className="text-gray-700 font-mono text-[8px] sm:text-[10px] tracking-[0.3em] uppercase mt-2">
                        RGUKT IIIT ONGOLE • PRAKASAM DISTRICT • AP 523225
                    </p>
                </div>
            </div>

            {/* ══════ FOOTER ══════ */}
            <MissionsFooter />

            <div className="relative z-20 w-full bg-black flex flex-col px-6 md:px-16 pt-32 pb-12 border-t border-white/5 overflow-hidden">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#D4AF37 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 w-full flex flex-col lg:flex-row justify-between items-start lg:items-end gap-16 lg:gap-24 border-b border-white/10 pb-20">
                    {/* Left: Branding/Campus Name */}
                    <div className="flex flex-col items-start text-left max-w-4xl">
                        <span className="text-[#D4AF37] font-mono text-[10px] sm:text-xs tracking-[0.5em] uppercase mb-6 font-black opacity-80 flex items-center gap-3">
                            <span className="w-8 h-[1px] bg-[#D4AF37]/50" /> OUR HEADQUARTERS
                        </span>
                        <h2 className="text-[12vw] sm:text-[10vw] lg:text-[7.5rem] font-black uppercase leading-[0.8] tracking-tighter text-white/95 transition-all duration-700 hover:text-[#D4AF37] cursor-default">
                            RGUKT <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] to-[#FCF6BA]">ONGOLE</span>
                            <br />
                            {  /*  <span className="text-[8vw] sm:text-[6vw] lg:text-[4.5rem] opacity-40">CAMPUS</span> */}
                        </h2>
                    </div>

                    {/* Right: Info & Links */}
                    <div className="flex flex-col md:flex-row lg:flex-col gap-12 md:gap-20 lg:gap-8 w-full lg:w-auto lg:text-right">
                        {/* Location Group */}
                        <div className="flex flex-col gap-3 group">
                            <p className="text-[#D4AF37] font-black tracking-[0.3em] uppercase text-[10px] opacity-60 group-hover:opacity-100 transition-opacity flex items-center lg:justify-end gap-2">
                                <span className="w-4 h-[1px] bg-[#D4AF37]" /> LOCATION_SECTOR
                            </p>
                            <p className="text-gray-200 font-medium text-sm md:text-base leading-relaxed tracking-wide italic">
                                IIIT ONGOLE, PRAKASAM DISTRICT<br />
                                ANDHRA PRADESH, INDIA 523225
                            </p>
                        </div>

                        {/* Navigation Group */}
                        <div className="flex flex-col gap-4 lg:items-end">
                            <p className="text-[#D4AF37] font-black tracking-[0.3em] uppercase text-[10px] opacity-60 mb-2 flex items-center lg:justify-end gap-2">
                                <span className="w-4 h-[1px] bg-[#D4AF37]" /> QUICK_LINKS
                            </p>
                            <div className="flex flex-col gap-4">
                                <Link href="/home/fest" className="text-white font-black tracking-[0.2em] uppercase hover:text-[#D4AF37] transition-all flex items-center justify-start lg:justify-end gap-3 group/link text-xs">
                                    EXPLORE_FEST <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                                <Link href="/home" className="text-white font-black tracking-[0.2em] uppercase hover:text-[#D4AF37] transition-all flex items-center justify-start lg:justify-end gap-3 group/link text-xs">
                                    CENTRAL_CONSOLE <ChevronRight className="w-4 h-4 text-[#D4AF37] group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Footer Copyright */}
                <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-center mt-10 gap-6 text-[10px] font-mono text-gray-500 font-bold tracking-[0.2em] uppercase">
                    <div className="flex items-center gap-4">
                        <span className="bg-white/5 px-3 py-1 rounded-md">© ORNATE_SYSTEMS_2026</span>
                        <span className="hidden md:block opacity-30">|</span>
                        <span>ALL RIGHTS RESERVED</span>
                    </div>
                    <div className="flex items-center gap-2 group cursor-pointer hover:text-white transition-colors">
                        ENGINEERED WITH <span className="text-[#D4AF37] animate-pulse">✦</span> BY <span className="underline decoration-[#D4AF37]/30 underline-offset-4">ORNATE WEB TEAM</span>
                    </div>
                </div>
            </div>
        </main>
    );
}
