"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Settings, Menu as MenuIcon, X } from 'lucide-react';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import ScrollIndicator from '@/components/ui/ScrollIndicator';

import './clubs.css';

const CLUB_PLANETS = ['icro', 'khelsaathi', 'pixelro', 'techxcel', 'artix', 'kaladharani', 'sarvasrijana'].reverse();

export default function ClubsPage() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(CLUB_PLANETS.indexOf('icro'));
    const [isRadialOpen, setIsRadialOpen] = useState(false);

    const handlePlanetClick = (name: string) => {
        window.location.hash = name.toLowerCase();
        router.push(`/home/clubs/${name.toLowerCase()}`);
    };

    // Lock to landscape on mobile
    useEffect(() => {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
            (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
        if (isMobile && screen.orientation && typeof (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock === 'function') {
            (screen.orientation as ScreenOrientation & { lock: (o: string) => Promise<void> })
                .lock('landscape')
                .catch(() => { /* not supported or denied — silent */ });
        }
        return () => {
            if (screen.orientation && typeof screen.orientation.unlock === 'function') {
                screen.orientation.unlock();
            }
        };
    }, []);

    useEffect(() => {
        const planets = CLUB_PLANETS;

        // Check hash to maintain state if returning from a specific club
        if (window.location.hash) {
            const hash = window.location.hash.substring(1);
            if (planets.includes(hash)) {
                const input = document.getElementById(hash) as HTMLInputElement;
                if (input) {
                    input.checked = true;
                    setCurrentIndex(planets.indexOf(hash));
                }
            }
        }

        let lastScrollTime = 0;
        const scrollDelay = 800; // Allow 800ms for CSS transitions to play before next scroll

        const handleWheel = (e: WheelEvent) => {
            const currentTime = new Date().getTime();
            if (currentTime - lastScrollTime < scrollDelay) return;

            const checkedInput = document.querySelector('.page-clubs input[name="planet"]:checked') as HTMLInputElement | null;
            if (!checkedInput) return;

            const currentIndex = planets.indexOf(checkedInput.id);
            let nextIndex = currentIndex;

            if (e.deltaY < 0) {
                // scroll up -> zoom out (next planet)
                nextIndex = Math.min(currentIndex + 1, planets.length - 1);
            } else if (e.deltaY > 0) {
                // scroll down -> zoom in (previous planet)
                nextIndex = Math.max(currentIndex - 1, 0);
            }

            if (nextIndex !== currentIndex) {
                const nextInput = document.getElementById(planets[nextIndex]) as HTMLInputElement;
                if (nextInput) {
                    nextInput.checked = true;
                    setCurrentIndex(nextIndex);
                    lastScrollTime = currentTime;
                }
            }
        };

        const handleRadioChange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.name === 'planet') {
                const idx = planets.indexOf(target.id);
                if (idx !== -1) setCurrentIndex(idx);
                // Note: user requested to NOT close menu on selection in branches, 
                // assuming same preference here. If they want auto-close, add setIsRadialOpen(false) here.
            }
        };

        let touchStartX = 0;
        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };
        const handleTouchEnd = (e: TouchEvent) => {
            const currentTime = new Date().getTime();
            if (currentTime - lastScrollTime < scrollDelay) return;
            const deltaX = touchStartX - e.changedTouches[0].clientX;
            const deltaY = touchStartY - e.changedTouches[0].clientY;

            // Use the dominant axis for the delta calculation
            const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

            // Tap (not a swipe) — navigate to current planet if tap was on planet
            if (Math.abs(delta) < 15) {
                const touch = e.changedTouches[0];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                if (el && el.closest('.planet')) {
                    const checkedInput = document.querySelector('.page-clubs input[name="planet"]:checked') as HTMLInputElement | null;
                    if (checkedInput) handlePlanetClick(checkedInput.id);
                }
                return;
            }

            const checkedInput = document.querySelector('.page-clubs input[name="planet"]:checked') as HTMLInputElement | null;
            if (!checkedInput) return;
            const currentIndex = planets.indexOf(checkedInput.id);
            let nextIndex = currentIndex;
            if (delta > 0) nextIndex = Math.min(currentIndex + 1, planets.length - 1);
            else nextIndex = Math.max(currentIndex - 1, 0);
            if (nextIndex !== currentIndex) {
                const nextInput = document.getElementById(planets[nextIndex]) as HTMLInputElement;
                if (nextInput) { nextInput.checked = true; setCurrentIndex(nextIndex); lastScrollTime = currentTime; }
            }
        };

        window.addEventListener('wheel', handleWheel);
        window.addEventListener('change', handleRadioChange);
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('change', handleRadioChange);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);


    const handleSvgClick = () => {
        const checkedInput = document.querySelector('.page-clubs input[name="planet"]:checked') as HTMLInputElement | null;
        if (checkedInput && checkedInput.id) {
            window.location.hash = checkedInput.id;
            router.push(`/home/clubs/${checkedInput.id}`);
        }
    };

    return (
        <div className={`page-clubs ${isRadialOpen ? 'radial-open' : ''}`}>
            {/* Tablet Radial Toggle */}
            <button
                className={`radial-menu-btn fixed right-5 top-1/2 -translate-y-1/2 z-[9999] w-[60px] h-[60px] rounded-full border-2 text-[var(--color-neon)] hidden sm:hidden md:flex lg:hidden items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(0,255,202,0.4),inset_0_0_10px_rgba(0,255,202,0.3)] transition-all duration-300 ${isRadialOpen ? 'border-[var(--color-neon)] shadow-[0_0_30px_rgba(0,255,202,0.6),inset_0_0_15px_rgba(0,255,202,0.4)]' : 'border-[#555]'}`}
                style={{ background: 'radial-gradient(circle, #2a2a2a 0%, #111 80%)' }}
                onClick={() => setIsRadialOpen(!isRadialOpen)}
            >
                <div className={`transition-transform duration-400 flex items-center justify-center ${isRadialOpen ? 'rotate-90' : ''}`}>
                    {isRadialOpen ? <Settings className="w-8 h-8 animate-[spin_3s_linear_infinite]" /> : <MenuIcon className="w-8 h-8" />}
                </div>
            </button>
            <header className="fixed top-0 left-0 w-full z-[100] px-4 sm:px-10 py-3 flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-3 sm:gap-6 pointer-events-auto flex-1 justify-start">
                    <Link href="/home/branches" className="flex items-center gap-2 group text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] px-4 sm:px-6 py-2 border border-white/20 hover:border-[var(--color-neon)] hover:text-[var(--color-neon)] hover:shadow-[0_0_15px_rgba(0,255,202,0.3)] rounded-full transition-all bg-black/50 backdrop-blur-md">
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--color-neon)]" />
                        <span className="hidden sm:inline text-gray-400 group-hover:text-white">To</span> Branches
                    </Link>
                </div>

                <div className="hidden sm:flex flex-col items-center pointer-events-auto flex-1 text-center">
                    <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-[0.2em] drop-shadow-[0_0_10px_#FF00E5]">Cultural Sector</h1>
                    <p className="text-[8px] sm:text-[10px] text-[#FF00E5] tracking-[0.4em] uppercase font-bold">Planetary Explorer</p>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto flex-1 justify-end">
                    <Link href="/home" className="p-2 -mr-2 text-gray-400 hover:text-[#FF00E5] transition-colors bg-black/50 rounded-full backdrop-blur-md border border-white/10">
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Link>
                </div>
            </header>

            <div className="read-info-container">
                <LiquidButton size="sm" onClick={handleSvgClick} className="text-[var(--color-neon)] font-black uppercase tracking-[0.3em] overflow-visible text-[8.5px]">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5 explore-arrow transition-transform duration-300" />
                    Explore {CLUB_PLANETS[currentIndex].toUpperCase()}
                </LiquidButton>
            </div>

            {/* Bottom SVG element */}
            <div
                className="bottom-svg-container"
                style={{
                    position: 'absolute',
                    bottom: '55px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    transformOrigin: 'bottom center',
                    zIndex: 5,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}>
                <svg width="800" height="250" viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M 0 500 A 500 500 0 0 1 1000 500 Z" fill="transparent" onClick={handleSvgClick} style={{ pointerEvents: 'auto', cursor: 'pointer' }} />
                    <defs>
                        <clipPath id="semi-circle-clip">
                            <path d="M 0 500 A 500 500 0 0 1 1000 500 Z" />
                        </clipPath>
                    </defs>
                </svg>
            </div>

            <input className='planet7' id='sarvasrijana' type='radio' name='planet' />
            <label className='menu sarvasrijana' htmlFor='sarvasrijana'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        sarvasrijana
                    </h2>
                    <h3>19.18 AU</h3>
                </div>
            </label>
            <input className='planet6' id='kaladharani' type='radio' name='planet' />
            <label className='menu kaladharani' htmlFor='kaladharani'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        kaladharani
                    </h2>
                    <h3>9.539 AU</h3>
                </div>
            </label>
            <input className='planet5' id='artix' type='radio' name='planet' />
            <label className='artix menu' htmlFor='artix'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        artix
                    </h2>
                    <h3>5.203 AU</h3>
                </div>
            </label>
            <input className='planet4' id='techxcel' type='radio' name='planet' />
            <label className='techxcel menu' htmlFor='techxcel'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        TechXcel
                    </h2>
                    <h3>1.524 AU</h3>
                </div>
            </label>
            <input className='planet3' id='pixelro' type='radio' name='planet' />
            <label className='pixelro menu' htmlFor='pixelro'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        PixelRo
                    </h2>
                    <h3>1 AU</h3>
                </div>
            </label>
            <input className='planet2' id='khelsaathi' type='radio' name='planet' />
            <label className='menu khelsaathi' htmlFor='khelsaathi'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        Khelsaathi
                    </h2>
                    <h3>0.723 AU</h3>
                </div>
            </label>
            <input className='planet1' id='icro' type='radio' name='planet' defaultChecked />
            <label className='menu icro' htmlFor='icro'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        ICRO
                    </h2>
                    <h3>0.39 AU</h3>
                </div>
            </label>
            <div className='solar'>
                <div className='solar_systm'>
                    <div className='icro planet'>
                        <div className='icro planet_description'>
                            <h2>Club</h2>
                            <h1 onClick={() => handlePlanetClick('ICRO')} style={{ cursor: 'pointer' }}>ICRO</h1>
                            <p> A planet where learning never stops. Its explorers focus on studying, solving problems, and preparing for intellectual challenges.
</p>
                        </div>
                        <div className='overlay' onClick={() => handlePlanetClick('ICRO')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='planet khelsaathi'>
                        <div className='planet_description khelsaathi'>
                            <h2>Club</h2>
                            <h1 onClick={() => handlePlanetClick('Khelsaathi')} style={{ cursor: 'pointer' }}>Khelsaathi</h1>
                            <p> A planet full of energy and competition. People here believe in teamwork, discipline, and enjoying the spirit of sports.</p>
                        </div>
                        <div className='overlay' onClick={() => handlePlanetClick('Khelsaathi')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='pixelro planet'>
                        <div className='moon moon'>
                            <h3>Moon</h3>
                            <h2>Moon</h2>
                        </div>
                        <div className='m trajectory'></div>
                        <div className='pixelro planet_description'>
                            <h2>Club</h2>
                            <h1 onClick={() => handlePlanetClick('PixelRo')} style={{ cursor: 'pointer' }}>PixelRo</h1>
                            <p> A world of cameras and creativity. People here love capturing moments through photography and videography.
</p>
                        </div>
                        <div className='overlay' onClick={() => handlePlanetClick('PixelRo')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='techxcel planet'>
                        <div className='deimos moon'>
                            <h3>Moon</h3>
                            <h2>Deimos</h2>
                        </div>
                        <div className='d trajectory'></div>
                        <div className='moon phoebos'>
                            <h3>Moon</h3>
                            <h2>Phoebos</h2>
                        </div>
                        <div className='p trajectory'></div>
                        <div className='techxcel planet_description'>
                            <h2>Club</h2>
                            <h1 onClick={() => handlePlanetClick('TechXcel')} style={{ cursor: 'pointer' }}>TechXcel</h1>
                            <p> A playground for tech enthusiasts. People here enjoy experimenting with new technologies and turning creative ideas into real projects.
</p>
                        </div>
                        <div className='overlay' onClick={() => handlePlanetClick('TechXcel')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='artix planet'>
                        <div className='lo moon'>
                            <h3>Moon</h3>
                            <h2>Io</h2>
                        </div>
                        <div className='europa moon'>
                            <h3>Moon</h3>
                            <h2>Europa</h2>
                        </div>
                        <div className='ganymede moon'>
                            <h3>Moon</h3>
                            <h2>Ganymede</h2>
                        </div>
                        <div className='lop trajectory'></div>
                        <div className='eu trajectory'></div>
                        <div className='ga trajectory'></div>
                        <div className='artix planet_description'>
                            <h2>Club</h2>
                            <h1 onClick={() => handlePlanetClick('artix')} style={{ cursor: 'pointer' }}>artix</h1>
                            <p> A place for confident speakers and thinkers. People here enjoy debates, discussions, and expressing ideas clearly through language.
 </p>
                        </div>
                        <div className='overlay' onClick={() => handlePlanetClick('artix')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='planet kaladharani'>
                        <div className='moon titan'>
                            <h3>Moon</h3>
                            <h2>Titan</h2>
                        </div>
                        <div className='dione moon'>
                            <h3>Moon</h3>
                            <h2>Dione</h2>
                        </div>
                        <div className='enceladus moon'>
                            <h3>Moon</h3>
                            <h2>Enceladus</h2>
                        </div>
                        <div className='ti trajectory'></div>
                        <div className='di trajectory'></div>
                        <div className='enc trajectory'></div>
                        <div className='planet_description kaladharani'>
                            <h2>Club</h2>
                            <h1 onClick={() => handlePlanetClick('kaladharani')} style={{ cursor: 'pointer' }}>kaladharani</h1>
                            <p>
 A vibrant world of music, dance, and theatre. Its explorers love performing, entertaining, and bringing creativity to life on stage.
</p>
                        </div>
                        <div className='overlay' onClick={() => handlePlanetClick('kaladharani')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='planet sarvasrijana'>
                        <div className='miranda moon'>
                            <h3>Moon</h3>
                            <h2>Miranda</h2>
                        </div>
                        <div className='ariel moon'>
                            <h3>Moon</h3>
                            <h2>Ariel</h2>
                        </div>
                        <div className='moon umbriel'>
                            <h3>Moon</h3>
                            <h2>Umbriel</h2>
                        </div>
                        <div className='mir trajectory'></div>
                        <div className='ari trajectory'></div>
                        <div className='trajectory umb'></div>
                        <div className='planet_description sarvasrijana'>
                            <h2>Club</h2>
                            <h1 onClick={() => handlePlanetClick('sarvasrijana')} style={{ cursor: 'pointer' }}>sarvasrijana</h1>
                            <p> A colorful world full of imagination. Its explorers love art, crafts, and creating things that express their ideas and emotions.
</p>
                        </div>
                        <div className='overlay' onClick={() => handlePlanetClick('sarvasrijana')}></div>
                    </div>
                </div>
            </div>
            <ScrollIndicator color="#FF00E5" align="left" />
        </div >
    );
}
