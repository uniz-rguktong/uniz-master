'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X, User, Search, LayoutGrid, Rocket, Calendar, Store, Music, Globe, Home as HomeIcon, Zap, Info, Heart, Image as ImageIcon, Code, Phone, Shield, BookOpen } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// UI Components
import { HeaderSVG, FooterDesktopSVG, FooterMobileSVG } from '@/components/home/HomeHUD';
import { HomeSidebar } from '@/components/home/HomeSidebar';
import { MissionsPanel } from '@/components/home/MissionsPanel';
import { ScannerPanel } from '@/components/home/ScannerPanel';

// Lazy loaded heavy components
const CentralConsole = dynamic(() => import('@/components/CentralConsole'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full animate-pulse bg-blue-500/10 rounded-full blur-xl" />
});
const SolarSystem3D = dynamic(() => import('@/components/SolarSystem3D'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black animate-pulse" />
});
const NeonCoreWidget = dynamic(() => import('@/components/gamification/NeonCore'), { ssr: false });

// Static Configuration
const NAV_LINKS = [
  { label: 'STORIES', href: '/home/stories' },
  { label: 'ABOUT US', href: '/home/about' },
  { label: 'SPONSORS', href: '/home/sponsors' },
  { label: 'GALLERY', href: '/home/gallery' },
  { label: 'CADET HUB', href: '/home/cadet-hub' },
  { label: 'PROFILE', href: '/home/profile' },
];

const SIDEBAR_LINKS = {
  core: [
    { label: 'STORIES', icon: <BookOpen size={18} />, url: '/home/stories' },
    { label: 'ABOUT US', icon: <Info size={18} />, url: '/home/about' },
    { label: 'SPONSORS', icon: <Heart size={18} />, url: '/home/sponsors' },
    { label: 'GALLERY', icon: <ImageIcon size={18} />, url: '/home/gallery' },
    { label: 'CADET HUB', icon: <LayoutGrid size={18} />, url: '/home/cadet-hub' },
    { label: 'PROFILE', icon: <User size={18} />, url: '/home/profile' },
  ],
  events: [
    { label: 'STALLS', icon: <Store size={18} />, url: '/home/stalls' },
    { label: 'MISSIONS', icon: <Rocket size={18} />, url: '/home/missions' },
    { label: 'SCHEDULE', icon: <Calendar size={18} />, url: '/home/roadmap' },
    { label: 'PLANETARY VIEW', icon: <Globe size={18} />, url: '/home/planet-view' },
    { label: 'FEST', icon: <Music size={18} />, url: '/home/fest' },
  ],
  system: [
    { label: 'DEVELOPERS', icon: <Code size={18} />, url: '/developers' },
    { label: 'CONTACT', icon: <Phone size={18} />, url: '#contact' },
    { label: 'TERMS', icon: <Shield size={18} />, url: '/terms' },
  ]
};

const SEARCH_INDEX = [
  ...SIDEBAR_LINKS.core.map(item => ({ label: item.label, url: item.url, terms: [item.label] })),
  ...SIDEBAR_LINKS.events.map(item => ({ label: item.label, url: item.url, terms: [item.label] })),
  ...SIDEBAR_LINKS.system.map(item => ({ label: item.label, url: item.url, terms: [item.label] })),
  { label: 'ABOUT US', url: '/home/about', terms: ['ABOUT', 'ABOUT US'] },
  { label: 'SPONSORS', url: '/home/sponsors', terms: ['SPONSORS'] },
  { label: 'GALLERY', url: '/home/gallery', terms: ['GALLERY'] },
  { label: 'PROFILE', url: '/home/profile', terms: ['PROFILE'] },
  { label: 'BRANCHES', url: '/home/branches', terms: ['BRANCHES', 'BRANCH'] },
  { label: 'CLUBS', url: '/home/clubs', terms: ['CLUBS', 'CLUB'] },
  { label: 'UPDATES', url: '/home/updates', terms: ['UPDATES', 'UPDATE'] },
  { label: 'CADET HUB', url: '/home/cadet-hub', terms: ['CADET', 'HUB', 'GAMIFICATION', 'ENERGY', 'LEADERBOARD'] },
  { label: 'LOGIN', url: '/login', terms: ['LOGIN', 'SIGN IN'] },
];

// Internal Component for Bottom Nav Buttons
const FooterNavItem = ({ label, href, showMenu, setShowMenu }: { label: string, href: string, showMenu?: boolean, setShowMenu?: (v: boolean) => void }) => (
  <Link
    href={href}
    className="group relative cursor-pointer px-[1vw] py-[0.5vw] transition-all duration-300 outline-none flex shrink-0 flex-col items-center justify-center whitespace-nowrap"
    onMouseEnter={() => setShowMenu?.(true)}
    onMouseLeave={() => setShowMenu?.(false)}
  >
    <div className="absolute top-0 left-0 w-[0.5vw] h-[0.5vw] border-t-[2px] border-l-[2px] border-transparent group-hover:border-[var(--color-neon)] transition-colors duration-300 shadow-[0_0_5px_var(--color-neon)]/0 group-hover:shadow-[0_0_5px_var(--color-neon)]/50" />
    <div className="absolute bottom-0 right-0 w-[0.5vw] h-[0.5vw] border-b-[2px] border-r-[2px] border-transparent group-hover:border-[var(--color-neon)] transition-colors duration-300 shadow-[0_0_5px_var(--color-neon)]/0 group-hover:shadow-[0_0_5px_var(--color-neon)]/50" />
    <div className="absolute top-0 right-0 w-[0.5vw] h-[0.5vw] border-t-[2px] border-r-[2px] border-transparent group-hover:border-[var(--color-neon)]/40 transition-colors duration-300" />
    <div className="absolute bottom-0 left-0 w-[0.5vw] h-[0.5vw] border-b-[2px] border-l-[2px] border-transparent group-hover:border-[var(--color-neon)]/40 transition-colors duration-300" />
    <div className="absolute -bottom-[0.2vw] left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-neon)] to-transparent shadow-[0_0_15px_var(--color-neon)] opacity-0 group-hover:w-full group-hover:opacity-100 transition-all duration-300 ease-out" />
    <span className="relative z-10 text-white/40 group-hover:text-[var(--color-neon)] group-hover:text-glow transition-all duration-300 uppercase text-[0.8vw] tracking-[0.2vw]">
      {label}
    </span>
  </Link>
);

export default function HomeClient({ festSettings, announcements, todaysMissions, neonStats }: any) {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const [activeMissionTab, setActiveMissionTab] = useState('missions');
  const [activeScannerTab, setActiveScannerTab] = useState('branches');
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>('sun');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isDesktop, setIsDesktop] = useState(true);
  const [isHoloVisibleMobile, setIsHoloVisibleMobile] = useState(true);
  const [isHoloVisibleDesktop, setIsHoloVisibleDesktop] = useState(true);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Responsive State Management
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = setTimeout(() => {
        setIsDesktop(window.innerWidth >= 640);
      }, 150);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
    };
  }, []);

  // Sidebar Search Logic
  const handleSidebarSearch = useCallback(() => {
    const query = sidebarSearch.trim().toUpperCase();
    if (!query) return;

    const match = SEARCH_INDEX.find((item) =>
      item.label.toUpperCase().includes(query) ||
      item.terms.some((term) => term.toUpperCase().includes(query) || query.includes(term.toUpperCase()))
    );

    if (!match) return;

    setIsSidebarOpen(false);
    setSidebarSearch('');
    router.push(match.url);
  }, [sidebarSearch, router]);

  const panelVisibleLeft = useMemo(() => isDesktop ? isHoloVisibleDesktop : showLeftPanel, [isDesktop, isHoloVisibleDesktop, showLeftPanel]);
  const panelVisibleRight = useMemo(() => isDesktop ? isHoloVisibleDesktop : showRightPanel, [isDesktop, isHoloVisibleDesktop, showRightPanel]);

  return (
    <main className="relative w-screen h-screen text-white overflow-hidden font-orbitron">
      <SolarSystem3D />

      {/* Corner HUD Accents */}
      <div className="fixed top-4 left-4 w-12 h-12 border-t-[1px] border-l-[1px] border-[var(--color-neon)]/30 z-[60] pointer-events-none" />
      <div className="fixed top-4 right-4 w-12 h-12 border-t-[1px] border-r-[1px] border-[var(--color-neon)]/30 z-[60] pointer-events-none" />

      {/* Top Navigation Overlay */}
      <header className="absolute top-0 left-0 z-[120] flex justify-center w-full pointer-events-none">
        {/* Top Accent Line - ULTRA BRIGHT */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-[var(--color-neon)] to-transparent shadow-[0_0_25px_var(--color-neon)] z-[130] opacity-100" />
        <HeaderSVG>
          <div className="hidden sm:flex justify-center items-center gap-[0.8vw] pointer-events-auto z-10 w-full max-w-[90vw] px-0 opacity-100">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative group cursor-pointer flex shrink-0 items-center justify-center px-[1.5vw] py-[0.6vw]"
              >
                <div className="absolute inset-0 bg-transparent border border-[var(--color-neon)]/60 opacity-20 group-hover:opacity-100 transition-all duration-300 [clip-path:polygon(1vw_0,100%_0,calc(100%-1vw)_100%,0_100%)] group-hover:bg-[var(--color-neon)]/20 scale-95 group-hover:scale-100" />
                <div className="absolute top-0 left-0 w-[0.3vw] h-[0.3vw] border-t-[2px] border-l-[2px] border-[var(--color-neon)] opacity-30 -translate-x-[0.3vw] -translate-y-[0.3vw] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 drop-shadow-[0_0_8px_var(--color-neon)]" />
                <div className="absolute bottom-0 right-0 w-[0.3vw] h-[0.3vw] border-b-[2px] border-r-[2px] border-[var(--color-neon)] opacity-30 translate-x-[0.3vw] translate-y-[0.3vw] group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 drop-shadow-[0_0_8px_var(--color-neon)]" />
                <span className="relative z-10 text-[0.8vw] font-black tracking-[0.25vw] text-white/80 transition-all duration-300 whitespace-nowrap group-hover:text-white group-hover:text-glow">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </HeaderSVG>

        {/* Mobile Header Icons */}
        <div className="flex sm:hidden absolute top-[5vw] left-1/2 -translate-x-1/2 w-[88%] items-start justify-between pointer-events-auto z-[130]">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="text-[var(--color-neon)] hover:scale-110 active:scale-90 transition-all drop-shadow-[0_0_15px_var(--color-neon)] p-3 bg-[var(--color-neon)]/5 rounded-xl border border-[var(--color-neon)]/20"
            aria-label="Open Navigation Sidebar"
          >
            <Menu size={28} strokeWidth={2.5} />
          </button>
          <Link 
            href={isAuthenticated ? '/home/profile' : '/login'} 
            className="text-[var(--color-neon)] hover:scale-110 active:scale-90 transition-all drop-shadow-[0_0_15px_var(--color-neon)] p-2.5 bg-[var(--color-neon)]/5 rounded-xl border border-[var(--color-neon)]/20 shadow-[0_0_20px_rgba(var(--color-neon-rgb),0.05)]"
            aria-label="User Profile"
          >
            <User size={30} strokeWidth={2} />
          </Link>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {isSidebarOpen && (
          <HomeSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            sidebarSearch={sidebarSearch}
            setSidebarSearch={setSidebarSearch}
            handleSidebarSearch={handleSidebarSearch}
            sidebarCoreLinks={SIDEBAR_LINKS.core}
            sidebarEventsLinks={SIDEBAR_LINKS.events}
            sidebarSystemLinks={SIDEBAR_LINKS.system}
          />
        )}
      </AnimatePresence>

      {/* Main Center Area */}
      <div className="absolute inset-0 flex flex-col items-center pt-24 z-10 pointer-events-none">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-[var(--color-neon)] tracking-[0.2em] text-glow mb-2 animate-pulse font-astra whitespace-nowrap"
          style={{ animationDuration: '4s' }}
        >
          {festSettings?.name || "ORNATE '26"}
        </motion.h1>
        <p className="text-xs sm:text-sm tracking-[0.3em] sm:tracking-[0.5em] text-gray-500 font-bold uppercase text-center px-4 mb-4">{festSettings?.tagline || "A Fest Beyond Earth"}</p>
        <div className="pointer-events-auto">
          <NeonCoreWidget totalEnergy={neonStats?.totalEnergy ?? 0} compact={true} showLink={true} />
        </div>
      </div>

      {/* Information Panels */}
      <AnimatePresence>
        {!isDesktop && (showLeftPanel || showRightPanel) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowLeftPanel(false); setShowRightPanel(false); }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-10 sm:hidden"
          />
        )}
      </AnimatePresence>

      <MissionsPanel
        isDesktop={isDesktop}
        isVisible={panelVisibleLeft}
        activeTab={activeMissionTab}
        setActiveTab={setActiveMissionTab}
        onClose={() => setShowLeftPanel(false)}
        todaysMissions={todaysMissions}
        announcements={announcements}
      />

      <ScannerPanel
        isDesktop={isDesktop}
        isVisible={panelVisibleRight}
        activeTab={activeScannerTab}
        setActiveTab={setActiveScannerTab}
        onClose={() => setShowRightPanel(false)}
        selectedPlanet={selectedPlanet}
        setSelectedPlanet={setSelectedPlanet}
      />

      {/* Footer Navigation & Console */}
      <footer className="absolute bottom-0 left-0 z-[80] flex justify-center items-end w-full pointer-events-none">
        <div className="absolute bottom-[-1vw] left-0 w-full h-[110px] sm:h-[6.0vw] pointer-events-auto flex justify-center">

          {/* Central Console Hologram */}
          <div className="absolute bottom-full left-[50.5%] sm:left-1/2 -translate-x-1/2 w-[300px] sm:w-[450px] lg:w-[35vw] h-[150px] sm:h-[225px] lg:h-[17.5vw] preserve-3d pointer-events-none mb-[-30px] sm:mb-[-40px] lg:mb-[-5.5vw] scale-[0.55] sm:scale-[0.6] lg:scale-100 origin-bottom z-[50]">
            <CentralConsole
              planetId={selectedPlanet}
              isHoloActive={isDesktop ? isHoloVisibleDesktop : isHoloVisibleMobile}
              onToggleHolo={() => isDesktop ? setIsHoloVisibleDesktop(!isHoloVisibleDesktop) : setIsHoloVisibleMobile(!isHoloVisibleMobile)}
            />
          </div>

          {/* Mobile Projector Accent */}
          <div className="flex sm:hidden absolute top-[34px] left-[50.5%] -translate-x-1/2 flex-col items-center justify-center z-[55] pointer-events-none">
            <div className={`w-[40px] h-[30px] bg-gradient-to-b from-[var(--color-neon)]/0 via-[var(--color-neon)]/10 to-[var(--color-neon)]/40 blur-[4px] -mb-2 ${isHoloVisibleMobile ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`} style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 30% 100%)' }} />
            <div className={`w-[30px] h-[8px] bg-black/90 border border-[var(--color-neon)] rounded-[50%] shadow-[0_0_20px_var(--color-neon)] flex justify-center items-center ${isHoloVisibleMobile ? 'opacity-100' : 'opacity-40'} transition-opacity duration-500 relative`}>
              <div className={`absolute w-[16px] h-[3px] bg-[var(--color-neon)] rounded-[50%] shadow-[0_0_10px_var(--color-neon)] ${isHoloVisibleMobile ? 'animate-pulse opacity-100' : 'opacity-0'}`} />
            </div>
          </div>

          <FooterDesktopSVG />
          <FooterMobileSVG
            onLeftClick={() => { setShowLeftPanel(true); setShowRightPanel(false); setActiveMissionTab('updates'); }}
            onRightClick={() => { setShowRightPanel(true); setShowLeftPanel(false); }}
          />

          {/* Nav Items Container overlaying SVG - Desktop only */}
          <div className="hidden sm:flex absolute bottom-[2.5vw] lg:bottom-[1.5vw] left-1/2 -translate-x-1/2 w-full max-w-[95vw] justify-center items-center gap-[2.5vw] font-bold z-10 pointer-events-auto">
            <FooterNavItem label="FUN" href="/home/fun" />
            <FooterNavItem label="MISSIONS" href="/home/missions" />
            <FooterNavItem label="SCHEDULE" href="/home/roadmap" />
            <FooterNavItem label="STALLS" href="/home/stalls" />

            <FooterNavItem label="FEST" href="/home/fest" />
            <FooterNavItem label="FULL PLANETS VIEW" href="/home/planet-view" />
          </div>
        </div>
      </footer>
    </main>
  );
}
