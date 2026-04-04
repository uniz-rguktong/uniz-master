import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { Facebook, Twitter, Linkedin, Instagram, Youtube, ArrowUp, MapPin, Mail } from "lucide-react";

// ── Flickering Grid ──────────────────────────────────────────────────
function FlickeringGrid({ text = "", fontSize = 90, color = "#4B5563", maxOpacity = 0.3, flickerChance = 0.08, squareSize = 2, gridGap = 3 }: {
  text?: string; fontSize?: number; color?: string; maxOpacity?: number; flickerChance?: number; squareSize?: number; gridGap?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const squares = useRef<Float32Array | null>(null);
  const [r, g, b] = color.replace("#", "").match(/.{2}/g)!.map(h => parseInt(h, 16));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth, h = container.clientHeight;
    if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = `${w}px`; canvas.style.height = `${h}px`; squares.current = null; }
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const cols = Math.ceil(w / (squareSize + gridGap)), rows = Math.ceil(h / (squareSize + gridGap));
    if (!squares.current || squares.current.length !== cols * rows) squares.current = new Float32Array(cols * rows).map(() => Math.random() * maxOpacity);
    const sq = squares.current;
    const mk = document.createElement("canvas"); mk.width = w * dpr; mk.height = h * dpr;
    const mc = mk.getContext("2d", { willReadFrequently: true })!;
    if (text) { mc.save(); mc.scale(dpr, dpr); mc.fillStyle = "white"; mc.font = `700 ${fontSize}px "Google Sans",sans-serif`; mc.textAlign = "center"; mc.textBaseline = "middle"; mc.fillText(text, w / 2, h / 2); mc.restore(); }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (Math.random() < flickerChance) sq[i * rows + j] = Math.random() * maxOpacity;
      const x = i * (squareSize + gridGap) * dpr, y = j * (squareSize + gridGap) * dpr, s = squareSize * dpr;
      const inText = mc.getImageData(x, y, s, s).data.some((v, k) => k % 4 === 0 && v > 0);
      const op = inText ? Math.min(1, sq[i * rows + j] * 3.5 + 0.55) : sq[i * rows + j];
      ctx.fillStyle = `rgba(${r},${g},${b},${op})`; ctx.fillRect(x, y, s, s);
    }
  }, [text, fontSize, r, g, b, maxOpacity, flickerChance, squareSize, gridGap]);

  useEffect(() => {
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    const ro = new ResizeObserver(draw);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [draw]);

  return <div ref={containerRef} className="h-full w-full"><canvas ref={canvasRef} className="pointer-events-none" /></div>;
}

// ── Data ─────────────────────────────────────────────────────────────
const columns = [
  { title: "Academics", links: [{ n: "Programs", p: "/academics/AcademicPrograms" }, { n: "Calendar", p: "/academics/AcademicCalender" }, { n: "Regulations", p: "/academics/AcademicRegulations" }, { n: "Curricula", p: "/academics/curicula" }] },
  { title: "Departments", links: [{ n: "Computer Science", p: "/departments/CSE" }, { n: "Electronics", p: "/departments/ECE" }, { n: "Civil Engg", p: "/departments/CIVIL" }, { n: "Mechanical", p: "/departments/ME" }, { n: "Mathematics", p: "/departments/MATHEMATICS" }] },
  { title: "Institute", links: [{ n: "About RGUKT", p: "/institute/aboutrgukt" }, { n: "Campus Life", p: "/institute/campuslife" }, { n: "Governing Council", p: "/institute/govcouncil" }, { n: "RTI Info", p: "/institute/rtiinfo" }, { n: "SC/ST Cell", p: "/institute/scst" }] },
  { title: "Notifications", links: [{ n: "News & Notifications", p: "/notifications/news" }, { n: "Careers", p: "/notifications/careers" }, { n: "Tenders", p: "/notifications/tenders" }] },
];

export function Footer() {
  const [narrow, setNarrow] = useState(window.innerWidth < 1024);
  useEffect(() => { const mq = window.matchMedia("(max-width:1024px)"); const fn = (e: MediaQueryListEvent) => setNarrow(e.matches); mq.addEventListener("change", fn); return () => mq.removeEventListener("change", fn); }, []);

  return (
    <footer className="relative w-full overflow-hidden bg-[#07091280]"
      style={{ background: "linear-gradient(180deg,#0a0f1e 0%,#06091a 100%)" }}>

      {/* ── Single combined row: brand + links ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 border-b border-white/5">

        {/* Brand col */}
        <div className="col-span-2 flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/rgukt-logo.png" alt="RGUKT" className="w-9 h-9 object-contain mix-blend-lighten" />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-white text-base tracking-tight">RGUKT</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#800000]">Ongole Campus</span>
            </div>
          </Link>
          <p className="text-slate-500 text-sm leading-relaxed">
            Empowering gifted rural youth through world-class technical education in Andhra Pradesh.
          </p>
          <div className="flex flex-col gap-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#800000]" />Prakasam District, AP – 523225</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#800000]" />info@rguktong.ac.in</span>
          </div>
          <div className="flex gap-2 mt-1">
            {[Facebook, Twitter, Linkedin, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/8 bg-white/4 text-slate-500 hover:text-white hover:bg-[#800000] hover:border-[#800000] transition-all duration-200">
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {columns.map((col, idx) => (
          <div key={idx}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-4">{col.title}</p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((lk, li) => (
                <li key={li}>
                  <Link to={lk.p} className="text-sm text-slate-500 hover:text-white transition-colors duration-150">{lk.n}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
          © {new Date().getFullYear()} RGUKT Ongole. All rights reserved.
        </p>
        <div className="flex gap-5 text-[10px] font-medium uppercase tracking-widest text-slate-600">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
        </div>
      </div>

      {/* ── Flickering wordmark ── */}
      <div className="relative w-full h-28 sm:h-36">
        <div className="absolute inset-0 bg-gradient-to-t from-[#06091a] via-transparent to-[#06091a] z-10 pointer-events-none" />
        <div className="absolute inset-x-4 inset-y-0">
          <FlickeringGrid text={narrow ? "RGUKT" : "RGUKT Ongole"} fontSize={narrow ? 60 : 88} color="#6B7280" maxOpacity={0.3} flickerChance={0.07} squareSize={2} gridGap={3} />
        </div>
      </div>

      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top"
        className="fixed bottom-8 right-8 z-50 w-10 h-10 rounded-xl bg-[#800000] hover:bg-[#a00000] text-white flex items-center justify-center shadow-lg shadow-[#800000]/30 transition-all duration-300 hover:-translate-y-1">
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
