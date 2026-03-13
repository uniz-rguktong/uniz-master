"use client"

import { useEffect, useState, useCallback, type ReactNode } from "react"
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Zap, Users, Building2, MapPin,
  Calendar, Users2, ChevronRight, CreditCard, Unlock,
  ChevronLeft as ChevronLeftIcon,
} from "lucide-react"



export interface CardData {
  id: string
  title: string
  description: string
  icon?: ReactNode
  color?: string
  date?: string
  venue?: string
  subCategory?: string
  eventCategory?: string
  isTeam?: boolean
  teamSize?: number
  registered?: number
  totalSlots?: number
  isPaid?: boolean
  mission?: any
}

export interface MorphingCardStackProps {
  cards?: CardData[]
  className?: string
  onCardClick?: (card: CardData) => void
  autoSwipeIntervalMs?: number
}



const SWIPE_THRESHOLD = 80      // px offset to commit swipe
const SWIPE_VELOCITY = 400      // px/s velocity threshold

const CAT_CFG: Record<string, any> = {
  BRANCHES: {
    icon: <Building2 className="w-4 h-4" />, label: "Branches",
    color: "text-[var(--color-neon)]", bg: "bg-[var(--color-neon)]/10",
    border: "border-[var(--color-neon)]/40", glow: "var(--color-neon)",
    image: "/images/events/branches.svg", scanColor: "rgba(57,255,20,0.07)",
  },
  CLUBS: {
    icon: <Users className="w-4 h-4" />, label: "Clubs",
    color: "text-cyan-400", bg: "bg-cyan-400/10",
    border: "border-cyan-400/40", glow: "#22d3ee",
    image: "/images/events/clubs.svg", scanColor: "rgba(34,211,238,0.07)",
  },
  HHO: {
    icon: <Zap className="w-4 h-4" />, label: "HHo",
    color: "text-amber-400", bg: "bg-amber-400/10",
    border: "border-amber-400/40", glow: "#fbbf24",
    image: "/images/events/hho.svg", scanColor: "rgba(251,191,36,0.07)",
  },
}

// —— Individual swipeable top-card ——————————————————————————————————————————
function SwipeCard({
  card,
  onSwipeLeft,
  onSwipeRight,
  onClick,
  isAutoSwiping,
}: {
  card: CardData
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onClick: () => void
  isAutoSwiping: boolean
}) {
  const m = card.mission
  const cfg = m ? (CAT_CFG[m.category] || CAT_CFG.BRANCHES) : CAT_CFG.BRANCHES
  const glow = card.color ?? cfg.glow ?? "var(--color-neon)"
  const fillPct = m ? Math.min(100, Math.round((m.registered / m.totalSlots) * 100)) : 0
  const subLabel = m ? m.subCategory.charAt(0) + m.subCategory.slice(1).toLowerCase() : ""

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20])
  const cardOpacity = useTransform(x, [-280, -120, 0, 120, 280], [0, 1, 1, 1, 0])

  // Indicator opacities
  const nopeOpacity = useTransform(x, [-160, -50, 0], [1, 0.5, 0])
  const likeOpacity = useTransform(x, [0, 50, 160], [0, 0.5, 1])

  const commitSwipe = useCallback(async (dir: "left" | "right") => {
    const target = dir === "left" ? -500 : 500
    await animate(x, target, { type: "tween", duration: 0.45, ease: [0.32, 0.72, 0, 1] })
    x.set(0)
    if (dir === "left") onSwipeLeft()
    else onSwipeRight()
  }, [x, onSwipeLeft, onSwipeRight])

  // Auto swipe trigger
  useEffect(() => {
    if (!isAutoSwiping) return
    commitSwipe("left")
  }, [isAutoSwiping]) // eslint-disable-line

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info
    const shouldSwipeLeft = offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY
    const shouldSwipeRight = offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY
    if (shouldSwipeLeft) commitSwipe("left")
    else if (shouldSwipeRight) commitSwipe("right")
    else animate(x, 0, { type: "spring", stiffness: 400, damping: 30 })
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      onDragEnd={handleDragEnd}
      onClick={() => {
        if (Math.abs(x.get()) < 8) onClick()
      }}
      whileDrag={{ scale: 1.03 }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none touch-none"
      style={{
        x, rotate, opacity: cardOpacity,
        background: "linear-gradient(160deg, #090a12 0%, #06070d 58%, #040509 100%)",
        border: `1px solid ${glow}90`,
        boxShadow: `0 8px 40px ${glow}30, 0 0 0 1px ${glow}18`,
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%)",
        filter: `drop-shadow(0 0 14px ${glow}44)`,
      } as any}
    >
      {/* NOPE / LIKE stamps */}
      <motion.div
        className="absolute top-6 left-5 z-50 px-3 py-1 border-2 border-red-400 text-red-400 text-[11px] font-black tracking-[0.25em] uppercase bg-black/60 rounded-sm pointer-events-none"
        style={{ opacity: nopeOpacity, rotate: -14 }}
      >SKIP</motion.div>
      <motion.div
        className="absolute top-6 right-5 z-50 px-3 py-1 border-2 border-emerald-400 text-emerald-400 text-[11px] font-black tracking-[0.25em] uppercase bg-black/60 rounded-sm pointer-events-none"
        style={{ opacity: likeOpacity, rotate: 14 }}
      >JOIN</motion.div>

      {/* Top glow line */}
      <div className="absolute top-0 left-0 w-full h-[2px] z-20"
        style={{ background: `linear-gradient(90deg, transparent, ${glow}, transparent)` }} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-30"
        style={{ backgroundImage: `repeating-linear-gradient(0deg, ${cfg.scanColor} 0px, ${cfg.scanColor} 1px, transparent 1px, transparent 4px)` }} />

      {/* HUD corners */}
      {[["top-0 left-0", "top-0 left-0"], ["top-0 right-0", "top-0 right-0"], ["bottom-0 left-0", "bottom-0 left-0"]].map(([pos], ci) => (
        <div key={ci} className={`absolute ${pos} w-4 h-4 z-20 pointer-events-none`}>
          <div className="absolute top-0 left-0 w-4 h-[1.5px]" style={{ backgroundColor: glow, opacity: 0.7 }} />
          <div className="absolute top-0 left-0 w-[1.5px] h-4" style={{ backgroundColor: glow, opacity: 0.7 }} />
        </div>
      ))}

      {/* FREE / PAID badge */}
      {m && (
        <div className="absolute top-3 right-3 z-30">
          <div className={`flex items-center gap-1 px-2.5 py-1 text-[8px] font-black tracking-[0.25em] uppercase backdrop-blur-sm ${m.isPaid ? "bg-amber-400/15 border border-amber-400/50 text-amber-400" : "bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/40 text-[var(--color-neon)]"}`}
            style={{ clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)", boxShadow: m.isPaid ? "0 0 10px rgba(251,191,36,0.25)" : "0 0 10px rgba(57,255,20,0.2)" }}>
            {m.isPaid ? <><CreditCard className="w-2.5 h-2.5" /> PAID</> : <><Unlock className="w-2.5 h-2.5" /> FREE</>}
          </div>
        </div>
      )}

      {/* Banner image */}
      {m && (
        <div className="relative w-full h-32 sm:h-36 overflow-hidden shrink-0">
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, #040408 0%, ${glow}22 100%)` }} />
          <img src={cfg.image} alt={m.category} className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-all duration-700" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#060608] via-[#060608]/70 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2 z-10">
            <div className={`flex items-center gap-1.5 border px-2.5 py-1 backdrop-blur-sm ${cfg.bg} ${cfg.border}`}
              style={{ clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)", boxShadow: `0 0 12px ${glow}44` }}>
              <span className={cfg.color}>{cfg.icon}</span>
              <span className={`text-[9px] font-black tracking-[0.25em] uppercase ${cfg.color}`}>{cfg.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* Card body */}
      <div className="flex flex-col flex-1 px-4 sm:px-5 pt-3 pb-4 gap-2.5 relative z-10">
        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[8px] font-bold tracking-[0.2em] text-white bg-white/5 border border-white/20 px-2 py-0.5 uppercase"
            style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}>{subLabel}</span>
          {m?.eventCategory && (
            <span className={`text-[8px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 border ${cfg.bg} ${cfg.color} ${cfg.border}`}
              style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}>
              {m.eventCategory.charAt(0) + m.eventCategory.slice(1).toLowerCase()}
            </span>
          )}
          {m && (
            <span className={`text-[8px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 border ${m.isTeam ? "border-indigo-400/40 text-indigo-400 bg-indigo-400/5" : "border-slate-400/40 text-slate-400 bg-slate-400/5"}`}
              style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}>
              {m.isTeam ? `TEAM (${m.teamSize})` : "SOLO"}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`text-sm sm:text-base font-black tracking-wider uppercase leading-snug line-clamp-2 ${cfg.color}`}
          style={{ textShadow: `0 0 16px ${glow}55` }}>
          {m ? m.title : card.title}
        </h3>

        <div className="flex-1" />

        {/* HUD Date / Venue grid */}
        {m && (
          <div className="grid grid-cols-2 gap-px mt-1" style={{ border: `1px solid ${glow}18`, background: `${glow}08` }}>
            <div className="flex flex-col gap-1 px-3 py-2 bg-black/40">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar className="w-3 h-3 text-white/60" />
                <span className="text-[7.5px] text-white/60 tracking-[0.35em] uppercase font-bold">Date</span>
              </div>
              <span className="text-xs font-black text-white tracking-wide">{m.eventDate}</span>
              <span className={`text-[10px] font-bold tracking-widest ${cfg.color}`}>{m.eventDay}</span>
            </div>
            <div className="flex flex-col gap-1 px-3 py-2 bg-black/40">
              <div className="flex items-center gap-1.5 mb-0.5">
                <MapPin className="w-3 h-3 text-white/60" />
                <span className="text-[7.5px] text-white/60 tracking-[0.35em] uppercase font-bold">Venue</span>
              </div>
              <span className="text-xs font-black text-white tracking-wide leading-snug line-clamp-2">{m.venue}</span>
            </div>
          </div>
        )}

        {/* Registration bar */}
        {m && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users2 className="w-2.5 h-2.5 text-gray-700" />
                <span className="text-[6.5px] text-white tracking-[0.35em] uppercase font-bold">Registered</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-black ${cfg.color}`}>{m.registered}</span>
                <span className="text-[9px] text-white font-bold">/ {m.totalSlots}</span>
                {fillPct >= 90 && <span className="text-[7px] text-red-400 font-black tracking-widest animate-pulse ml-1">ALMOST FULL</span>}
              </div>
            </div>
            <div className="flex gap-[2px] h-2">
              {Array.from({ length: 20 }).map((_, i) => {
                const threshold = ((i + 1) / 20) * 100
                const filled = fillPct >= threshold
                return (
                  <div key={i} className="flex-1 h-full transition-all duration-300"
                    style={{ background: filled ? glow : "#ffffff08", boxShadow: filled ? `0 0 4px ${glow}80` : "none", opacity: filled ? (0.4 + (i / 20) * 0.6) : 1 }} />
                )
              })}
            </div>
            <span className="text-[7.5px] text-white tracking-widest font-bold">{fillPct}% CAPACITY FILLED</span>
          </div>
        )}
      </div>

      {/* Hover CTA */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 h-11 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30 pointer-events-none"
        style={{ background: `linear-gradient(90deg, ${glow}ee, ${glow}cc)`, clipPath: "polygon(0 10px, 10px 0, 100% 0, 100% 100%, 0 100%)" }}>
        <span className="text-xs font-black tracking-[0.3em] uppercase text-black ml-1">INITIATE MISSION</span>
        <ChevronRight className="w-5 h-5 text-black mr-1" />
      </div>

      {/* Swipe hint */}
      <div className="absolute bottom-3 left-0 w-full text-center z-40 pointer-events-none">
        <span className="text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: `${glow}99`, textShadow: `0 0 8px ${glow}66` }}>
          SWIPE TO CYCLE
        </span>
      </div>
    </motion.div>
  )
}

// —— Background card (tilted, static) ——————————————————————————————————————
function BgCard({ card, position }: { card: CardData; position: number }) {
  const glow = card.color ?? "var(--color-neon)"
  // Each subsequent card tilts slightly and shifts down
  const rotateZ = position % 2 === 0 ? position * 2.2 : -(position * 2.2)
  const scale = 1 - position * 0.055
  const yOffset = position * 13

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1 - position * 0.22, scale, y: yOffset, rotate: rotateZ }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="absolute inset-0 pointer-events-none"
      style={{
        background: "linear-gradient(160deg, #090a12 0%, #06070d 100%)",
        border: `1px solid ${glow}55`,
        boxShadow: `0 4px 20px ${glow}18`,
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%)",
        zIndex: -position,
      }}
    >
      {/* Top glow line on bg cards */}
      <div className="absolute top-0 left-0 w-full h-[1.5px]"
        style={{ background: `linear-gradient(90deg, transparent, ${glow}60, transparent)` }} />
    </motion.div>
  )
}

// —— Main MorphingCardStack ——————————————————————————————————————————————————
export function MorphingCardStack({
  cards = [],
  className,
  onCardClick,
  autoSwipeIntervalMs,
}: MorphingCardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [swipeTick, setSwipeTick] = useState(false)
  const [isDragging] = useState(false)

  const total = cards.length

  const goNext = useCallback(() => setActiveIndex(i => (i + 1) % total), [total])
  const goPrev = useCallback(() => setActiveIndex(i => (i - 1 + total) % total), [total])

  // Auto-swipe tick
  useEffect(() => {
    if (!autoSwipeIntervalMs || autoSwipeIntervalMs <= 0 || total <= 1) return
    const t = setInterval(() => setSwipeTick(v => !v), autoSwipeIntervalMs)
    return () => clearInterval(t)
  }, [autoSwipeIntervalMs, total])

  useEffect(() => {
    if (autoSwipeIntervalMs && autoSwipeIntervalMs > 0) goNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipeTick])

  if (!cards || total === 0) return null

  // Show up to 3 bg cards + 1 active
  const bgCards = [1, 2, 3].map(offset => cards[(activeIndex + offset) % total])
  const activeCard = cards[activeIndex]

  return (
    <div className={cn("space-y-5", className)}>

      {/* Stack container — full width mobile, capped on desktop */}
      <div className="relative w-full max-w-[420px] mx-auto" style={{ height: "490px" }}>
        {/* Background tilted cards (behind) */}
        {bgCards.reverse().map((card, i) => (
          <BgCard key={`${card.id}-bg-${i}`} card={card} position={3 - i} />
        ))}

        {/* Active swipeable card */}
        <SwipeCard
          key={activeCard.id}
          card={activeCard}
          onSwipeLeft={goNext}
          onSwipeRight={goPrev}
          onClick={() => onCardClick?.(activeCard)}
          isAutoSwiping={false}
        />

        {/* Left/Right nav arrows */}
        <button
          onClick={goPrev}
          className="absolute -left-5 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all shadow-lg backdrop-blur-sm"
          aria-label="Previous"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <button
          onClick={goNext}
          className="absolute -right-5 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all shadow-lg backdrop-blur-sm"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex justify-center gap-2">
          {cards.map((card, index) => {
            const dotGlow = card.color ?? "var(--color-neon)"
            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className="h-1 rounded-full transition-all duration-300"
                style={index === activeIndex
                  ? { width: "20px", backgroundColor: dotGlow, boxShadow: `0 0 8px ${dotGlow}` }
                  : { width: "6px", backgroundColor: "#374151" }
                }
                aria-label={`Card ${index + 1}`}
              />
            )
          })}
        </div>
      )}

      {/* Swipe gesture hint row */}
      <div className="flex items-center justify-center gap-6 text-[9px] font-black tracking-[0.3em] uppercase text-white/25 select-none pointer-events-none">
        <span className="flex items-center gap-1"><ChevronLeftIcon className="w-3 h-3" /> PREV</span>
        <span className="w-px h-3 bg-white/10" />
        <span className="flex items-center gap-1">NEXT <ChevronRight className="w-3 h-3" /></span>
      </div>
    </div>
  )
}


