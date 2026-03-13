'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Planet } from './planets';

interface PlanetHologramSphereProps {
    planet: Planet;
    isHovered: boolean;
    setIsHovered: (h: boolean) => void;
}

export function PlanetHologramSphere({ planet, isHovered, setIsHovered }: PlanetHologramSphereProps) {
    return (
        <motion.div
            key={planet.id}
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
            transition={{
                scale: { duration: 0.5, ease: "backOut" },
                opacity: { duration: 0.5 },
                y: { duration: 5, ease: "easeInOut", repeat: Infinity }
            }}
            className="absolute bottom-8 sm:bottom-24 flex items-center justify-center z-30 cursor-pointer pointer-events-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={planet.href || '/'} className="block">
                <div
                    className={`w-48 h-48 relative z-20 transition-all duration-500 flex items-center justify-center ${planet.id === 'sun' ? '' : 'rounded-full overflow-hidden'}`}
                    style={{
                        boxShadow: planet.id === 'sun' ? 'none' : `0 0 ${isHovered ? '80px' : '50px'} ${planet.glow}`,
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                        filter: planet.id === 'sun' ? `drop-shadow(0 0 ${isHovered ? '40px' : '20px'} ${planet.glow})` : 'none'
                    }}
                >
                    {planet.id === 'sun' ? (
                        <motion.div
                            className="relative w-full h-full flex items-center justify-center cursor-pointer pointer-events-auto"
                            style={{ transformStyle: 'preserve-3d' }}
                            animate={{ rotateY: [0, 360] }}
                            transition={{ duration: isHovered ? 4 : 8, repeat: Infinity, ease: 'linear' }}
                        >
                            <div className="absolute w-[90%] h-[90%] backface-hidden" style={{ filter: `drop-shadow(0 0 15px ${planet.glow})`, backfaceVisibility: 'hidden' }}>
                                <Image src={planet.texture} alt={planet.name} fill className="object-contain" sizes="180px" />
                            </div>
                            <div className="absolute w-[90%] h-[90%] backface-hidden" style={{ filter: `drop-shadow(0 0 15px ${planet.glow})`, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}>
                                <Image src={planet.texture} alt={planet.name} fill className="object-contain" sizes="180px" />
                            </div>
                        </motion.div>
                    ) : (
                        <>
                            <div className="w-full h-full relative" style={{ transform: 'scale(1.1)' }}>
                                <motion.div
                                    className="w-full h-full absolute inset-0"
                                    style={{
                                        backgroundImage: `url('${planet.texture}')`,
                                        backgroundSize: '200% 100%',
                                        backgroundRepeat: 'repeat-x',
                                        filter: 'brightness(1.2) contrast(1.1)'
                                    }}
                                    animate={{ backgroundPositionX: ['100%', '0%'] }}
                                    transition={{ duration: isHovered ? 10 : 20, repeat: Infinity, ease: 'linear' }}
                                />
                            </div>
                            <div className="absolute inset-0 rounded-full shadow-[inset_20px_0_50px_rgba(0,0,0,0.9)] pointer-events-none" />
                            <div className="absolute inset-0 rounded-full" style={{ boxShadow: `inset -5px 0 20px ${planet.glow}` }} />
                            <div className="absolute top-2 left-10 w-24 h-12 bg-white/20 blur-xl rounded-[50%] skew-x-12 pointer-events-none" />
                            {isHovered && (
                                <div className="absolute inset-0 z-50 pointer-events-none bg-black/20">
                                    <div className="absolute top-0 w-full h-[2px] bg-white/50 shadow-[0_0_10px_white] animate-[scan_2s_linear_infinite]" />
                                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.1)_50%)] bg-[size:100%_4px]" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Link>
        </motion.div>
    );
}

export function HologramLightBeam({ color }: { color: string }) {
    return (
        <>
            <div className="hidden sm:block absolute bottom-4 w-[500px] h-80 bg-gradient-to-t to-transparent blur-md transition-colors duration-1000"
                style={{ clipPath: 'polygon(38% 100%, 62% 100%, 100% 0, 0 0)', backgroundImage: `linear-gradient(to top, ${color} 0%, transparent 80%)` }} />
            <div className="block sm:hidden absolute top-[-15px] left-[51%] -translate-x-1/2 w-[500px] h-[350px] bg-gradient-to-t to-transparent blur-md transition-colors duration-1000 origin-bottom"
                style={{ clipPath: 'polygon(49.5% 100%, 50.5% 100%, 100% 0, 0 0)', backgroundImage: `linear-gradient(to top, ${color} 0%, transparent 80%)` }} />
        </>
    );
}
