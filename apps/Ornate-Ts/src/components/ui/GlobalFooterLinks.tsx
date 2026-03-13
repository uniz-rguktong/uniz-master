import React from 'react';
import Link from 'next/link';
import { Rocket, GitBranch, Users, Globe, ChevronRight } from 'lucide-react';

export default function GlobalFooterLinks({ className = "" }: { className?: string }) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-12 ${className}`}>
            {/* Brand + Description */}
            <div className="lg:col-span-1 flex flex-col items-center md:items-start gap-5 text-center md:text-left">
                <div className="flex items-center gap-3">
                    <Rocket className="w-6 h-6 text-[var(--color-neon)]" />
                    <span className="text-xl font-black tracking-[0.3em] uppercase text-white drop-shadow-[0_0_10px_rgba(var(--color-neon-rgb, 57, 255, 20), 0.5)]">
                        ORNATE <span className="text-[var(--color-neon)]">2K26</span>
                    </span>
                </div>
                <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase leading-relaxed font-orbitron">
                    Galactic command center for all major tech, cultural, and sports Protocols & Navigation. Explore the universe.
                </p>
            </div>

            {/* Main Navigation — beside the description */}
            <div className="lg:col-span-1 flex flex-col items-center md:items-start gap-4 text-center md:text-left">
                <span className="text-[9px] font-black tracking-[0.2em] text-[var(--color-neon)] uppercase">Main Navigation</span>
                <ul className="flex flex-col gap-2 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                    <li><Link href="/home" className="hover:text-white hover:pl-2 transition-all flex items-center gap-1 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-[var(--color-neon)]" /> Home</Link></li>
                    <li><Link href="/home/about" className="hover:text-white hover:pl-2 transition-all flex items-center gap-1 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-[var(--color-neon)]" /> About Us</Link></li>
                    <li><Link href="/home/sponsors" className="hover:text-white hover:pl-2 transition-all flex items-center gap-1 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-[var(--color-neon)]" /> Sponsors</Link></li>
                    <li><Link href="/home/gallery" className="hover:text-white hover:pl-2 transition-all flex items-center gap-1 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-[var(--color-neon)]" /> Gallery</Link></li>
                    <li><Link href="/home/missions" className="hover:text-white hover:pl-2 transition-all flex items-center gap-1 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-[var(--color-neon)]" /> Missions</Link></li>
                    <li><Link href="/home/profile" className="hover:text-white hover:pl-2 transition-all flex items-center gap-1 group"><ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-[var(--color-neon)]" /> Profile</Link></li>
                </ul>
            </div>

            {/* Branches */}
            <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
                <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="w-4 h-4 text-[var(--color-neon)]" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-[var(--color-neon)] uppercase">Branches</span>
                </div>
                <ul className="flex flex-col gap-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                    <li><Link href="/home/branches/cse" className="hover:text-cyan-300 hover:pl-1 transition-all">CSE (Techzeon)</Link></li>
                    <li><Link href="/home/branches/ece" className="hover:text-cyan-300 hover:pl-1 transition-all">ELECSPIRE</Link></li>
                    <li><Link href="/home/branches/mechanical" className="hover:text-cyan-300 hover:pl-1 transition-all">MECH (Yantrika)</Link></li>
                    <li><Link href="/home/branches/civil" className="hover:text-cyan-300 hover:pl-1 transition-all">CIVIL (Nirman)</Link></li>
                    <li><Link href="/home/branches/eee" className="hover:text-cyan-300 hover:pl-1 transition-all">EEE (Powermania)</Link></li>
                    <li className="mt-2"><Link href="/home/branches" className="text-cyan-500 hover:text-[var(--color-neon)] inline-flex items-center gap-1 font-black">ALL BRANCHES <ChevronRight className="w-3 h-3" /></Link></li>
                </ul>
            </div>

            {/* Clubs */}
            <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
                <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-[var(--color-neon)]" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-[var(--color-neon)] uppercase">Clubs</span>
                </div>
                <ul className="flex flex-col gap-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                    <li><Link href="/home/clubs/pixelro" className="hover:text-purple-300 hover:pl-1 transition-all">PixelRo</Link></li>
                    <li><Link href="/home/clubs/sarvasrijana" className="hover:text-purple-300 hover:pl-1 transition-all">SarvaSrijana</Link></li>
                    <li><Link href="/home/clubs/icro" className="hover:text-purple-300 hover:pl-1 transition-all">ICRO</Link></li>
                    <li><Link href="/home/clubs/techxcel" className="hover:text-purple-300 hover:pl-1 transition-all">TechXcel</Link></li>
                    <li><Link href="/home/clubs/artix" className="hover:text-purple-300 hover:pl-1 transition-all">ArtiX</Link></li>
                    <li><Link href="/home/clubs/kaladharani" className="hover:text-purple-300 hover:pl-1 transition-all">Kaladharani</Link></li>
                    <li><Link href="/home/clubs/khelsaathi" className="hover:text-purple-300 hover:pl-1 transition-all">Khelsaathi</Link></li>
                    <li className="mt-2"><Link href="/home/clubs" className="text-purple-500 hover:text-[var(--color-neon)] inline-flex items-center gap-1 font-black">ALL CLUBS <ChevronRight className="w-3 h-3" /></Link></li>
                </ul>
            </div>

            {/* Special Planets */}
            <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
                <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-amber-400 uppercase">Special Planets</span>
                </div>
                <ul className="flex flex-col gap-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                    <li><Link href="/home/branches/hho" className="hover:text-amber-300 hover:pl-1 transition-all">HHO (Humanitarian)</Link></li>
                    <li><Link href="/home/fest/sports" className="hover:text-amber-300 hover:pl-1 transition-all">Sports Arena</Link></li>
                    <li><Link href="/home/fest/culturals" className="hover:text-amber-300 hover:pl-1 transition-all">Cultural Galaxy</Link></li>
                    <li><Link href="/home/fun" className="hover:text-amber-300 hover:pl-1 transition-all">Fun Zone</Link></li>
                    <li className="mt-4"><Link href="/home/planet-view" className="text-amber-500 hover:text-amber-400 inline-flex items-center gap-1 font-black">ALL SECTORS <ChevronRight className="w-3 h-3" /></Link></li>
                </ul>
            </div>

            {/* Other Pages */}
            <div className="flex flex-col items-center md:items-start gap-4 text-center md:text-left">
                <div className="flex items-center gap-2 mb-2">
                    <Rocket className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-rose-400 uppercase">Other Pages</span>
                </div>
                <ul className="flex flex-col gap-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                    <li><Link href="/home/missions" className="hover:text-rose-300 hover:pl-1 transition-all">Today's Mission</Link></li>
                    <li><Link href="/home/updates" className="hover:text-rose-300 hover:pl-1 transition-all">Live Updates</Link></li>
                    <li><Link href="/home/stalls" className="hover:text-rose-300 hover:pl-1 transition-all">Festival Stalls</Link></li>
                    <li><Link href="/home/fun" className="hover:text-rose-300 hover:pl-1 transition-all">Best Outgoing Students</Link></li>
                    <li><Link href="/home/roadmap" className="hover:text-rose-300 hover:pl-1 transition-all">Festival Roadmap</Link></li>
                    <li><Link href="/home/fest/sports/results" className="hover:text-rose-300 hover:pl-1 transition-all">Leaderboards</Link></li>
                </ul>
            </div>
        </div>
    );
}
