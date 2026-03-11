import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

const NAV_LINKS = [
    { label: "Academics", href: "#ecosystem" },
    { label: "Research", href: "#ecosystem" },
    { label: "Departments", href: "#departments" },
    { label: "Campus Life", href: "#about" },
    { label: "Admission", href: "https://www.admissions25.rgukt.in/" },
    { label: "About", href: "#about" },
    { label: "News & Events", href: "#notifications" },
];

const UTILITY_LINKS = [
    { label: "Students", href: "https://uniz.rguktong.in" },
    { label: "Faculty & Staff", href: "https://ornate-core.rguktong.in" },
    { label: "Families", href: "#" },
    { label: "Visitors", href: "#" },
    { label: "Alumni", href: "#" },
];

export const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[100] flex flex-col w-full transition-all duration-300 ${isScrolled ? "bg-black shadow-xl" : "bg-transparent"
                }`}
        >
            {/* Layer 1 — Black utility bar */}
            <div className={`w-full transition-all duration-300 flex justify-center ${isScrolled ? "bg-black py-1.5 shadow-md" : "bg-black/40 py-2.5"}`}>
                <div className="w-full max-w-[1440px] px-6 md:px-12 flex justify-between items-center text-[11.5px] md:text-[13px] font-medium transition-all duration-300">
                    <div className="hidden lg:flex tracking-wide font-serif text-[18px] md:text-[21px] font-medium hover:text-[#8C1515] text-white transition-colors cursor-pointer" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                        Rajiv Gandhi University of Knowledge Technologies
                    </div>

                    {/* Mobile text fallback */}
                    <div className="lg:hidden tracking-wider font-serif text-[16px] font-medium cursor-pointer text-white">
                        RGUKT Ongole
                    </div>

                    <div className="hidden lg:flex items-center gap-5">
                        <span className="font-bold mr-1 text-white/80">Information for:</span>
                        {UTILITY_LINKS.map((l) => (
                            <a
                                key={l.label}
                                href={l.href}
                                className="text-white hover:text-[#8C1515] hover:underline underline-offset-4 decoration-[#8C1515] transition-all duration-200 tracking-wide"
                            >
                                {l.label}
                            </a>
                        ))}
                    </div>

                    {/* Mobile Hamburger */}
                    <div className="lg:hidden flex items-center cursor-pointer">
                        <Menu size={22} className="text-white" />
                    </div>
                </div>
            </div>

            {/* Layer 2 — Transparent main nav changing to glass on scroll */}
            <div className={`w-full transition-all duration-300 border-t border-white/5 flex justify-center ${isScrolled ? "bg-black/90 backdrop-blur-md py-3 shadow-xl" : "py-6 bg-transparent"}`}>
                <div className="w-full max-w-[1440px] px-6 md:px-12 flex justify-center lg:justify-end">
                    <nav className="flex items-center gap-[38px] relative z-20">
                        {NAV_LINKS.map((item) => (
                            <a
                                key={item.label}
                                href={item.href}
                                className="text-white text-[15.5px] font-bold hover:text-[#8C1515] transition-all tracking-tight font-sans uppercase"
                                style={{ textShadow: isScrolled ? "none" : "0px 1px 4px rgba(0,0,0,0.8)" }}
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    );
};
