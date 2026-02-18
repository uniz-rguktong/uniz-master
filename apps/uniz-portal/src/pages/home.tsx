import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useIsAuth } from "../hooks/is_authenticated";
import {
  ChevronRight,
  ChevronLeft,
  Users,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

import { NotificationPanel } from "../components/NotificationPanel";

const CAROUSEL_IMAGES = [
  "/assets/ornate image.png",
  "/assets/republic Day ssn.png",
  "/assets/ssn.png",
  "/assets/ssnview.png",
];

export default function Home() {
  useIsAuth();
  const navigate = useNavigate();

  // Secret Admin Access (Easter Egg)
  useEffect(() => {
    let keyBuffer = "";
    const targetSequence = "admin";
    const handleKeyPress = (event: KeyboardEvent) => {
      keyBuffer += event.key.toLowerCase();
      if (keyBuffer.length > targetSequence.length)
        keyBuffer = keyBuffer.slice(1);
      if (keyBuffer === targetSequence) {
        navigate("/admin/signin");
        keyBuffer = "";
      }
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#800000] selection:text-white flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[600px] lg:h-[700px] overflow-hidden group">
        {/* Carousel */}
        <Carousel />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none"></div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center text-white pb-20 pointer-events-none">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 flex flex-col items-center">
            <div className="mb-6 animate-pulse">
              <span className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400 shadow-sm">
                EST. 2018
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-bold tracking-[0.2em] uppercase text-white/90 mb-2 drop-shadow-md font-serif">
              Welcome to RGUKT
            </h2>
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter mb-8 drop-shadow-2xl leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Ongole
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-100 max-w-2xl mx-auto font-medium mb-10 leading-relaxed drop-shadow-lg text-shadow-sm">
              Catering to the Educational Needs of Gifted Rural Youth of Andhra
              Pradesh through world-class education and innovation.
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block z-20 pointer-events-none">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
            <div className="w-1 h-3 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Director's Message Section */}
      <section className="bg-white py-16 md:py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#800000]/5 rounded-bl-full -mr-16 -mt-16 z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-100 rounded-tr-full -ml-12 -mb-12 z-0 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 text-center mb-16 uppercase tracking-tight flex flex-col items-center">
            Message from the Director
            <span className="w-24 h-1.5 bg-[#800000] mt-4 rounded-full"></span>
          </h2>

          <div className="flex flex-col md:flex-row gap-12 lg:gap-24 items-center">
            {/* Content Column */}
            <div className="md:w-7/12 space-y-8 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 font-serif italic relative inline-block">
                "Directing towards Bigger Goals"
                <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-yellow-400 rounded-full opacity-50"></span>
              </h3>
              <div className="space-y-4 text-slate-600 leading-relaxed text-base md:text-lg font-medium">
                <p>Greetings to the vibrant community of RGUKT Ongole!</p>
                <p>
                  It is my privilege to be directing the students of{" "}
                  <span className="font-bold text-[#800000]">RGUKT Ongole</span>{" "}
                  to achieve the bigger goals in their lives. Education is the
                  foundation upon which great nations are built, and here, we
                  are committed to nurturing not just skilled professionals, but
                  visionary leaders.
                </p>
                <p>
                  I urge every student to look beyond the horizon, to dream big,
                  and to work with unwavering dedication. Let your time here be
                  defined by curiosity, innovation, and a relentless pursuit of
                  excellence.
                </p>
              </div>
            </div>

            {/* Image Column */}
            <div className="md:w-4/12 flex flex-col items-center relative group">
              <div className="absolute top-0 left-0 w-full h-full bg-[#800000] rounded-tl-[3rem] rounded-br-[3rem] translate-x-3 translate-y-3 -z-10 transition-transform group-hover:translate-x-5 group-hover:translate-y-5"></div>
              <div className="w-full aspect-square overflow-hidden rounded-tl-[3rem] rounded-br-[3rem] shadow-xl bg-slate-200 border-4 border-white">
                <img
                  src="/assets/director_ji.png"
                  alt="Dr. A V S S Kumara Swami Gupta"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="mt-8 text-center relative z-10 w-4/5 bg-white p-6 shadow-xl -mt-12 mx-auto rounded border-l-4 border-[#800000]">
                <h3 className="text-lg font-bold text-[#800000] uppercase tracking-wide leading-tight">
                  Dr. A V S S Kumara Swami Gupta
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                  Director, RGUKT Ongole
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-white py-12 px-6">
        <NotificationPanel />
      </section>

      {/* Statistics Section */}

      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-[#800000] py-10 text-white relative overflow-hidden rounded-2xl mx-4 md:mx-6 mb-8 shadow-xl"
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute right-0 top-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <StatItem icon={GraduationCap} count={6000} label="Students" />
            <StatItem icon={Users} count={250} label="Faculty" />
            <StatItem icon={Briefcase} count={1200} label="Placements" />
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function StatItem({
  icon: Icon,
  count,
  label,
}: {
  icon: any;
  count: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group hover:-translate-y-1">
      <div className="mb-3 p-3 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg border border-white/20">
        <Icon className="w-6 h-6 text-yellow-400" />
      </div>
      <div className="text-2xl md:text-3xl flex items-center justify-center gap-1 font-black mb-1 tracking-tight font-serif">
        <Counter value={count} />
        <span className="text-xl text-yellow-400 font-bold">+</span>
      </div>
      <div className="h-0.5 w-8 bg-white/30 rounded-full mb-2 group-hover:w-12 transition-all duration-300"></div>
      <p className="text-xs font-bold text-white/90 uppercase tracking-[0.2em]">
        {label}
      </p>
    </div>
  );
}

function Counter({ value }: { value: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const spring = useSpring(0, { mass: 1, stiffness: 50, damping: 15 });
  const display = useTransform(spring, (current: number) =>
    Math.round(current),
  );

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length,
    );
  };

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(nextSlide, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      {CAROUSEL_IMAGES.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={src}
            alt={`Slide ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Arrows */}
      <div className="absolute inset-0 flex justify-between items-center px-4 md:px-8 z-20 pointer-events-auto">
        <button
          onClick={prevSlide}
          className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/20 hover:bg-[#800000] text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/20 hover:border-[#800000] group"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={nextSlide}
          className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/20 hover:bg-[#800000] text-white/70 hover:text-white transition-all backdrop-blur-sm border border-white/20 hover:border-[#800000] group"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
