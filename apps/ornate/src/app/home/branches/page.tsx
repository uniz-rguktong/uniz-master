"use client";

import './branches.css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Settings, Menu as MenuIcon } from 'lucide-react';
import { LiquidButton } from '@/components/ui/liquid-glass-button';


const BRANCH_PLANETS = ['hho', 'cse', 'ece', 'eee', 'civil', 'mech'].reverse();

export default function BranchesPage() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(BRANCH_PLANETS.indexOf('hho'));
    const [isRadialOpen, setIsRadialOpen] = useState(false);

    const handlePlanetClick = (id: string) => {
        const slug = id === 'mech' ? 'mechanical' : id;
        window.location.hash = id;
        router.push(`/home/branches/${slug}`);
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
        const planets = BRANCH_PLANETS;

        // Check hash to maintain state if returning from a specific branch
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
        const scrollDelay = 800;

        const handleWheel = (e: WheelEvent) => {
            const currentTime = new Date().getTime();
            if (currentTime - lastScrollTime < scrollDelay) return;

            const checkedInput = document.querySelector('input[name="planet"]:checked') as HTMLInputElement | null;
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

        // Touch support for mobile swipe
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
            const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

            // Tap (not a swipe) — navigate to current planet if tap was on planet
            if (Math.abs(delta) < 15) {
                const touch = e.changedTouches[0];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                if (el && el.closest('.planet')) {
                    const checkedInput = document.querySelector('input[name="planet"]:checked') as HTMLInputElement | null;
                    if (checkedInput) handlePlanetClick(checkedInput.id);
                }
                return;
            }

            const checkedInput = document.querySelector('input[name="planet"]:checked') as HTMLInputElement | null;
            if (!checkedInput) return;
            const currentIndex = planets.indexOf(checkedInput.id);
            let nextIndex = currentIndex;
            if (delta > 0) nextIndex = Math.min(currentIndex + 1, planets.length - 1);
            else nextIndex = Math.max(currentIndex - 1, 0);
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
        const checkedInput = document.querySelector('input[name="planet"]:checked') as HTMLInputElement | null;
        if (checkedInput && checkedInput.id) {
            window.location.hash = checkedInput.id;
            handlePlanetClick(checkedInput.id);
        }
    };

    return (
        <div className={`page-branches ${isRadialOpen ? 'radial-open' : ''}`}>
            {/* Tablet Radial Toggle */}
            <button
                className={`radial-menu-btn fixed left-5 top-1/2 -translate-y-1/2 z-[9999] w-[60px] h-[60px] rounded-full border-2 text-[var(--color-neon)] hidden sm:hidden md:flex lg:hidden items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(0,255,202,0.4),inset_0_0_10px_rgba(0,255,202,0.3)] transition-all duration-300 ${isRadialOpen ? 'border-[var(--color-neon)] shadow-[0_0_30px_rgba(0,255,202,0.6),inset_0_0_15px_rgba(0,255,202,0.4)]' : 'border-[#555]'}`}
                style={{ background: 'radial-gradient(circle, #2a2a2a 0%, #111 80%)' }}
                onClick={() => setIsRadialOpen(!isRadialOpen)}
            >
                <div className={`transition-transform duration-400 flex items-center justify-center ${isRadialOpen ? 'rotate-90' : ''}`}>
                    {isRadialOpen ? <Settings className="w-8 h-8 animate-[spin_3s_linear_infinite]" /> : <MenuIcon className="w-8 h-8" />}
                </div>
            </button>
            <header className="fixed top-0 left-0 w-full z-[100] px-4 sm:px-10 py-3 flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto flex-1 justify-start">
                    <Link href="/home" className="p-2 -ml-2 text-gray-400 hover:text-[var(--color-neon)] transition-colors bg-black/50 rounded-full backdrop-blur-md border border-white/10">
                        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Link>
                </div>

                <div className="hidden sm:flex flex-col items-center pointer-events-auto flex-1 text-center">
                    <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-[0.2em]">Technical Sector</h1>
                    <p className="text-[8px] sm:text-[10px] text-[var(--color-neon)] tracking-[0.4em] uppercase font-bold">Planetary Explorer</p>
                </div>

                <div className="flex items-center gap-3 sm:gap-6 pointer-events-auto flex-1 justify-end">
                    <Link href="/home/clubs" className="flex items-center gap-2 group text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] px-4 sm:px-6 py-2 border border-white/20 hover:border-[#FF00E5] hover:text-[#FF00E5] hover:shadow-[0_0_15px_rgba(255,0,229,0.3)] rounded-full transition-all bg-black/50 backdrop-blur-md">
                        <span className="hidden sm:inline text-gray-400 group-hover:text-white">To</span> Clubs
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF00E5]" />
                    </Link>
                </div>
            </header>


            <div className="read-info-container">
                <LiquidButton size="sm" onClick={handleSvgClick} className="text-[var(--color-neon)] font-black uppercase tracking-[0.3em] overflow-visible text-[8.5px]">
                    Explore {BRANCH_PLANETS[currentIndex].toUpperCase()}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 explore-arrow transition-transform duration-300" />
                </LiquidButton>
            </div>

            {/* Bottom SVG element */}
            <div
                className="bottom-svg-container"
                style={{
                    position: 'absolute',
                    bottom: '70px',
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



            <input className='planet6' id='mech' type='radio' name='planet' />
            <label className='menu mech' htmlFor='mech'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        Yanthrika
                    </h2>
                    <h3>9.539 AU</h3>
                </div>
            </label>
            <input className='planet5' id='civil' type='radio' name='planet' />
            <label className='civil menu' htmlFor='civil'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        Nirman
                    </h2>
                    <h3>5.203 AU</h3>
                </div>
            </label>
            <input className='planet4' id='eee' type='radio' name='planet' />
            <label className='eee menu' htmlFor='eee'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        Power Mania
                    </h2>
                    <h3>1.524 AU</h3>
                </div>
            </label>
            <input className='planet3' id='ece' type='radio' name='planet' />
            <label className='ece menu' htmlFor='ece'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        ElecSpire
                    </h2>
                    <h3>1 AU</h3>
                </div>
            </label>
            <input className='planet2' id='cse' type='radio' name='planet' />
            <label className='menu cse' htmlFor='cse'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        Techzeon
                    </h2>
                    <h3>0.723 AU</h3>
                </div>
            </label>
            <input className='planet1' id='hho' type='radio' name='planet' defaultChecked />
            <label className='menu hho' htmlFor='hho'>
                <div className='preview'></div>
                <div className='info'>
                    <h2>
                        <div className='pip'></div>
                        HHO
                    </h2>
                    <h3>0.39 AU</h3>
                </div>
            </label>
            <div className='solar'>
                <div className='solar_systm'>
                    <div className='hho planet'>
                        <div className='hho planet_description'>
                            <h2>Branch</h2>
                            <h1 style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('hho')}>HHO</h1>
                            <p> A planet built on helping others. Its explorers work together to support students and create a stronger community.
                            </p>
                        </div>
                        <div className='overlay' style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('hho')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='planet cse'>
                        <div className='planet_description cse'>
                            <h2>CSE as</h2>
                            <h1 style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('cse')}>TECHZEON</h1>
                            <p>Home of coders and problem-solvers. People from this planet love building software, solving complex problems, and turning ideas into digital reality.</p>
                        </div>
                        <div className='overlay' style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('cse')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='ece planet'>
                        <div className='moon moon'>
                            <h3>Moon</h3>
                            <h2>Moon</h2>
                        </div>
                        <div className='m trajectory'></div>
                        <div className='ece planet_description'>
                            <h2>ECE as</h2>
                            <h1 style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('ece')}>ElecSpire</h1>
                            <p>A planet where signals travel everywhere. Its people work with electronics and communication systems to keep the world connected.</p>
                        </div>
                        <div className='overlay' style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('ece')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='eee planet'>
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
                        <div className='eee planet_description'>
                            <h2>EEE as</h2>
                            <h1 style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('eee')}>Power Mania</h1>
                            <p>This planet runs on energy and circuits. Its explorers enjoy understanding electricity, designing electronics, and powering the technologies around us.</p>
                        </div>
                        <div className='overlay' style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('eee')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='civil planet'>
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
                        <div className='civil planet_description'>
                            <h2>CIVIL as</h2>
                            <h1 style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('civil')}>Nirman</h1>
                            <p>This planet is built by planners and creators. Its explorers design roads, bridges, and structures that help cities and communities grow.</p>
                        </div>
                        <div className='overlay' style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('civil')}></div>
                    </div>
                </div>
                <div className='solar_systm'>
                    <div className='planet mech'>
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
                        <div className='planet_description mech'>
                            <h2>MECH as</h2>
                            <h1 style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('mech')}>Yanthrika</h1>
                            <p>A world of machines and moving parts. The people here enjoy building engines, designing robots, and turning ideas into working mechanical systems.</p>
                        </div>
                        <div className='overlay' style={{ cursor: 'pointer' }} onClick={() => handlePlanetClick('mech')}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
