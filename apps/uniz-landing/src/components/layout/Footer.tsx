export const Footer = () => (
    <footer className="py-24 px-10 bg-white">
        <div className="max-w-[1200px] mx-auto border-t border-slate-100 pt-16 flex flex-col md:flex-row justify-between items-start gap-16">
            {/* Brand */}
            <div className="max-w-xs">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">
                        U
                    </div>
                    <span className="font-black text-xl tracking-tighter uppercase">
                        UniZ <span className="text-accent">Systems</span>
                    </span>
                </div>
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                    Official administration framework for RGUKT Ongole Campus. Powered by
                    high-availability cloud cluster.
                </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-20">
                <div className="flex flex-col gap-6 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-300">Platforms</span>
                    <a href="https://uniz.rguktong.in" className="hover:text-accent transition-colors">
                        Student Portal
                    </a>
                    <a href="https://ornate-core.rguktong.in" className="hover:text-accent transition-colors">
                        Staff EMS
                    </a>
                    <a href="#" className="hover:text-accent transition-colors">
                        Admin Hub
                    </a>
                </div>
                <div className="flex flex-col gap-6 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-300">Explore</span>
                    <a href="#notifications" className="hover:text-accent transition-colors">
                        News &amp; Tenders
                    </a>
                    <a href="#about" className="hover:text-accent transition-colors">
                        About RGUKT
                    </a>
                    <a href="#departments" className="hover:text-accent transition-colors">
                        Faculty
                    </a>
                </div>
                <div className="flex flex-col gap-6 text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-300">Resources</span>
                    <a href="#" className="hover:text-accent transition-colors">
                        Infrastructure
                    </a>
                    <a href="#" className="hover:text-accent transition-colors">
                        Security
                    </a>
                    <a href="#" className="hover:text-accent transition-colors">
                        Compliance
                    </a>
                </div>
            </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-[1200px] mx-auto mt-24 flex flex-col md:flex-row justify-between gap-8 pt-8 border-t border-slate-50 items-center">
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">
                © 2026 UNIVERSITY SYSTEM • AP • INDIA
            </span>
            <div className="flex gap-8 items-center opacity-20 hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-slate-200 rounded-full" />
                <div className="w-6 h-6 bg-slate-200 rounded-full" />
                <div className="w-6 h-6 bg-slate-200 rounded-full" />
            </div>
        </div>
    </footer>
);
