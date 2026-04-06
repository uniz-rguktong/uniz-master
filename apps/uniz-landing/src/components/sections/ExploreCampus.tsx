import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const campusAreas = [
  {
    title: "Central Library",
    description:
      "A well-equipped central library housing over 20,000 books and 10,000 periodicals, providing students with a rich academic ecosystem to explore knowledge, pursue research, and study in a focused, serene environment.",
    imageUrl:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop",
    accentFrom: "#0ea5e9",
    accentTo: "#6366f1",
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    numColor: "#bae6fd",
    badge: "Knowledge",
    link: "/departments/LIB",
  },
  {
    title: "Internships & Placements",
    description:
      "RGUKT Ongole's dedicated Career Development and Placement Cell (CDPC) bridges academics and industry. It actively facilitates campus placements, internship drives, and career guidance to prepare students for a competitive world.",
    imageUrl:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=2126&auto=format&fit=crop",
    accentFrom: "#8b5cf6",
    accentTo: "#a855f7",
    badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
    numColor: "#ddd6fe",
    badge: "Careers",
    link: "/notifications/news",
  },
  {
    title: "Resources & Facilities",
    description:
      "State-of-the-art infrastructure set amidst pristine greenery makes RGUKT Ongole an ideal destination for learning and continuous growth. Modern labs, seminar halls, and residential facilities ensure comfort and excellence at every step.",
    imageUrl:
      "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop",
    accentFrom: "#10b981",
    accentTo: "#14b8a6",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    numColor: "#a7f3d0",
    badge: "Infrastructure",
    link: "/institute/campuslife",
  },
  {
    title: "Extra-Curricular Activities",
    description:
      "At RGUKT, we believe in holistic development. Sports and cultural activities foster physical coordination, mental strength, teamwork, and character — shaping well-rounded individuals ready to lead with confidence beyond the classroom.",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop",
    accentFrom: "#f59e0b",
    accentTo: "#f97316",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    numColor: "#fde68a",
    badge: "Campus Life",
    link: "/institute/campuslife",
  },
];

// Each card is a separate component owning its own IntersectionObserver
function CampusCard({
  area,
  index,
}: {
  area: (typeof campusAreas)[number];
  index: number;
}) {
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      // ← KEY: sticky with incrementing top so cards stack behind each other
      className="sticky w-full h-auto md:h-[460px] rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row"
      style={{
        top: `${80 + index * 32}px`,       // Each card sticks a bit lower than the previous
        zIndex: index + 1,                  // Later cards render on top of earlier ones
        // Slide-up reveal on first intersection
        transform: revealed ? "translateY(0)" : "translateY(60px)",
        opacity: revealed ? 1 : 0,
        transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 80}ms, opacity 0.7s ease ${index * 80}ms`,
        flexDirection: isEven ? "row" : "row-reverse",
      }}
    >
      {/* ── Image Side ── */}
      <div className="flex-shrink-0 w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden">
        <img
          src={area.imageUrl}
          alt={area.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Colour overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${area.accentFrom}33, ${area.accentTo}44)`,
          }}
        />
      </div>

      {/* ── Content Side ── */}
      <div className="flex-1 bg-white p-10 md:p-14 flex flex-col justify-center">
        <span
          className={`inline-flex items-center self-start px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border mb-5 ${area.badgeBg}`}
        >
          {area.badge}
        </span>
        <h3 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-snug mb-5">
          {area.title}
        </h3>
        <p className="text-lg text-slate-600 leading-relaxed">
          {area.description}
        </p>
      </div>
    </div>
  );
}

// Header uses its own simple observer
function RevealDiv({
  className,
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: visible ? "translateY(0)" : "translateY(24px)",
        opacity: visible ? 1 : 0,
        transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, opacity 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function ExploreCampus() {
  return (
    <section id="explore" className="relative bg-white pt-20 pb-16">
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <RevealDiv>
            <span className="inline-flex items-center gap-2 mb-5 px-4 py-2 text-sm font-bold tracking-widest text-[#000035] bg-[#000035]/5 rounded-full border border-[#000035]/10">
              Campus Life
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mt-4">
              Explore Our Campus
            </h2>
          </RevealDiv>
          <RevealDiv delay={180}>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
              From cutting-edge labs to world-class sports — discover the spaces that shape our students into leaders.
            </p>
          </RevealDiv>
        </div>
      </div>

      {/*
        ── Sticky stack container ──
        Must NOT have overflow:hidden — sticky children won't work inside it.
        It needs enough vertical space so the browser lets you scroll through all cards.
        We add padding-bottom equal to roughly the height of all cards stacked.
      */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10"
        style={{
          paddingBottom: `${campusAreas.length * 32}px`,
        }}
      >
        {campusAreas.map((area, index) => (
          <CampusCard key={index} area={area} index={index} />
        ))}
      </div>

      {/* ── CTA ── */}
      <div className="text-center mt-12">
        <Link
          to="/institute/campuslife"
          className="inline-flex items-center gap-2 px-9 py-4 bg-[#000035] text-white font-bold rounded-full shadow-xl shadow-[#000035]/20 hover:bg-slate-900 hover:-translate-y-1 transition-all duration-300"
        >
          Explore Campus Life
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
