'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RightPanelSVG } from './HomeHUD';
import { PLANETS } from '../planetary-system/planets';

const PlanetaryScanner = dynamic(() => import('@/components/PlanetaryScanner'), {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-[var(--color-neon)]/5 rounded-full" />
});

interface ScannerPanelProps {
    isDesktop: boolean;
    isVisible: boolean;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onClose: () => void;
    selectedPlanet: string | null;
    setSelectedPlanet: (id: string | null) => void;
}

export const ScannerPanel: React.FC<ScannerPanelProps> = React.memo(({
    isDesktop,
    isVisible,
    activeTab,
    setActiveTab,
    onClose,
    selectedPlanet,
    setSelectedPlanet
}) => {
    const router = useRouter();
    const planetData = React.useMemo(() =>
        PLANETS.find(p => p.id === selectedPlanet) || PLANETS[0]
        , [selectedPlanet]);
    return (
        <motion.div
            id="scanner-right-panel"
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
                    x: isDesktop ? "100vw" : "-50%",
                    y: isDesktop ? 0 : "-30%",
                    filter: "blur(10px)",
                    transition: {
                        duration: 0.4,
                        ease: [0.19, 1, 0.22, 1]
                    }
                }
            }}
            className={`absolute z-[70] will-change-transform ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'} ${isDesktop ? 'bottom-1 right-1 w-[20rem] lg:w-[28rem] h-[16rem] lg:h-[22rem] scale-100 origin-bottom-right' : 'top-1/2 left-1/2 w-[95vw] aspect-[85/55] max-h-[50vh] origin-center'}`}
        >
            {isDesktop ? (
                <>
                    <RightPanelSVG />
                    <div className={`absolute inset-0 flex flex-row z-10 overflow-hidden pt-3 pr-2 pl-4 pb-10 lg:pt-5 lg:pr-4 lg:pl-10 lg:pb-[4rem]`}>
                        <div id="radar-display-section" className="flex-1 flex flex-col border-r border-[var(--color-neon)]/40 pr-1 overflow-hidden">
                            <div className="flex flex-col justify-center items-center h-[40px] shrink-0 uppercase mb-1">
                                <div className="font-bold tracking-widest text-white text-[10px] sm:text-[12px]">
                                    PLANETARY SCANNER
                                </div>
                                <div className="text-[7px] text-[var(--color-neon)]/60 tracking-[0.3em] font-black animate-pulse">
                                    SELECT NODE TO SCAN
                                </div>
                            </div>
                            <div className="flex-1 relative flex justify-center items-center overflow-hidden scale-[0.95] lg:scale-[1.15] origin-center">
                                <PlanetaryScanner
                                    onSelectPlanet={(p) => setSelectedPlanet(p.id)}
                                    selectedPlanetId={selectedPlanet}
                                    activeTab={activeTab}
                                />
                            </div>
                        </div>
                        <div id="scanner-tabs-navigation" className="w-[70px] lg:w-[120px] flex flex-col text-[8px] lg:text-[11px] font-bold tracking-[0.05em] text-center ml-1 gap-1">
                            <div className="flex-1 flex flex-col gap-1 py-1">
                                {['BRANCHES', 'CLUBS', 'SPECIAL PLANETS'].map((tab) => (
                                    <button key={tab}
                                        className={`flex-1 border border-[var(--color-neon)]/20 flex justify-center items-center px-1 hover:bg-[var(--color-neon)]/20 transition-colors uppercase ${activeTab === tab.toLowerCase() ? 'text-[var(--color-neon)] text-glow bg-[var(--color-neon)]/10' : 'text-gray-400'}`}
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab(tab.toLowerCase()); }}>
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center font-orbitron">
                    <svg className="absolute inset-0 w-full h-full opacity-95 pointer-events-none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" width="854" height="550" viewBox="0 0 854 550" fill="none">
                        <foreignObject x="-10" y="-10" width="873.5" height="570">
                            <div style={{ backdropFilter: 'blur(5px)', clipPath: 'url(#bgblur_0_45_14_clip_path)', height: '100%', width: '100%' }}></div>
                        </foreignObject>
                        <g data-figma-bg-blur-radius="10">
                            <path d="M6.49947 516L32.4995 550L473.5 550L515.999 526L798.499 526L853.499 476.5L853.499 63L798.499 29L580.499 29L555.5 -1.39167e-08L27.0001 -1.0523e-07L2.42116e-05 29L6.49947 516Z" fill="#C4C4C4" fillOpacity="0.08" />
                            <path d="M554.125 2.99932L578.227 30.9578L579.126 31.9998L580.501 32.0001L797.648 31.9995L850.499 64.6705L850.499 475.161L797.346 523L515.997 523L515.209 523L514.522 523.388L472.707 547L33.9794 547L9.48577 514.969L3.01545 30.1645L28.3073 2.9996L554.125 2.99932Z" stroke="url(#paint0_linear_45_14)" strokeOpacity="0.8" strokeWidth="6" />
                            <path d="M554.125 2.99932L578.227 30.9578L579.126 31.9998L580.501 32.0001L797.648 31.9995L850.499 64.6705L850.499 475.161L797.346 523L515.997 523L515.209 523L514.522 523.388L472.707 547L33.9794 547L9.48577 514.969L3.01545 30.1645L28.3073 2.9996L554.125 2.99932Z" stroke="url(#paint1_linear_45_14)" strokeOpacity="0.8" strokeWidth="6" />
                        </g>
                        <defs>
                            <clipPath id="bgblur_0_45_14_clip_path" transform="translate(10 10)">
                                <path d="M6.49947 516L32.4995 550L473.5 550L515.999 526L798.499 526L853.499 476.5L853.499 63L798.499 29L580.499 29L555.5 -1.39167e-08L27.0001 -1.0523e-07L2.42116e-05 29L6.49947 516Z" />
                            </clipPath>
                            <linearGradient id="paint0_linear_45_14" x1="355.194" y1="151.697" x2="356.645" y2="-31.1325" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#231E1E" />
                                <stop offset="0.325058" stopColor="var(--color-neon)" />
                            </linearGradient>
                            <linearGradient id="paint1_linear_45_14" x1="363.136" y1="-24.3707" x2="368.703" y2="389.66" gradientUnits="userSpaceOnUse">
                                <stop offset="0.532521" stopColor="#231E1E" stopOpacity="0" />
                                <stop offset="1" stopColor="var(--color-neon)" stopOpacity="0.8" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 z-10 flex flex-col px-[5%] py-[3%]">
                        <div className="flex w-full h-[12%] items-center justify-start px-1 relative">

                            <div className="flex flex-col items-start mb-1">
                                <div className="text-[3.5vw] lg:text-[16px] font-bold tracking-widest text-[#a3ff12] text-glow uppercase">
                                    PLANETARY SCANNER
                                </div>
                                <div className="text-[1.8vw] lg:text-[8px] text-[#a3ff12]/50 tracking-[0.3em] font-black animate-pulse uppercase">
                                    SELECT NODE TO SCAN
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full flex flex-row items-stretch justify-center relative mt-[1%] pb-[4%]">
                            <div id="radar-display-section" className="flex-[2.2] flex flex-col border-r border-[#a3ff12]/30 pr-1 overflow-hidden items-center justify-center pb-2">
                                <div className="flex-1 relative w-full flex justify-center items-center scale-[0.99] origin-center translate-y-[0%] translate-x-[-2%]">
                                    <PlanetaryScanner
                                        onSelectPlanet={(p) => setSelectedPlanet(p.id)}
                                        selectedPlanetId={selectedPlanet}
                                        activeTab={activeTab}
                                    />
                                </div>
                            </div>
                            <div id="scanner-tabs-navigation" className="flex-1 flex flex-col text-[2.5vw] lg:text-[10px] font-bold tracking-[0.05em] text-center ml-2 justify-center gap-1.5 px-1 py-4">
                                <div className="flex flex-col gap-1.5 flex-1">
                                    {['BRANCHES', 'CLUBS', 'SPECIAL PLANETS'].map((tab) => (
                                        <button key={tab}
                                            className={`flex-1 border border-[#a3ff12]/20 flex justify-center items-center px-1 py-1 hover:bg-[#a3ff12]/20 transition-colors rounded backdrop-blur-sm ${activeTab === tab.toLowerCase() ? 'text-[#a3ff12] text-glow bg-[#a3ff12]/10 border-[#a3ff12]/60' : 'text-gray-400/80 bg-black/40'}`}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTab(tab.toLowerCase()); }}>
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
});
ScannerPanel.displayName = 'ScannerPanel';
