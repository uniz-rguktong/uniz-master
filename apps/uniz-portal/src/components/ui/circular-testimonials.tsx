import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { FaArrowLeft, FaArrowRight, FaLinkedin } from "react-icons/fa";
import { motion, AnimatePresence, useInView } from "framer-motion";

interface Testimonial {
  quote: string;
  name: string;
  designation: string;
  src: string;
  linkedin?: string;
  /** Larger avatar and slightly longer carousel time when active. */
  featured?: boolean;
  /** Ms to show this slide before autoplay advances (default 5000). */
  displayDuration?: number;
}

const DEFAULT_DISPLAY_DURATION = 5000;

interface Colors {
  name?: string;
  designation?: string;
  testimony?: string;
  arrowBackground?: string;
  arrowForeground?: string;
  arrowHoverBackground?: string;
}

interface FontSizes {
  name?: string;
  designation?: string;
  quote?: string;
}

interface CircularTestimonialsProps {
  testimonials: Testimonial[];
  autoplay?: boolean;
  /** Smaller avatar, type, and spacing for mobile-first single-screen layouts. */
  dense?: boolean;
  colors?: Colors;
  fontSizes?: FontSizes;
}

export const CircularTestimonials = ({
  testimonials,
  autoplay = true,
  dense = false,
  colors = {},
  fontSizes = {},
}: CircularTestimonialsProps) => {
  const colorName = colors.name ?? "#000";
  const colorDesignation = colors.designation ?? "#6b7280";
  const colorTestimony = colors.testimony ?? "#4b5563";
  const colorArrowBg = colors.arrowBackground ?? "#141414";
  const colorArrowFg = colors.arrowForeground ?? "#f1f1f7";
  const colorArrowHoverBg = colors.arrowHoverBackground ?? "#00a6fb";
  const fontSizeName = fontSizes.name ?? "1.5rem";
  const fontSizeDesignation = fontSizes.designation ?? "0.925rem";
  const fontSizeQuote = fontSizes.quote ?? "1.125rem";

  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);

  const autoplayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const testimonialsLength = useMemo(() => testimonials.length, [testimonials]);
  const activeTestimonial = useMemo(
    () => testimonials[activeIndex],
    [activeIndex, testimonials],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.5 });

  useEffect(() => {
    if (!autoplay || !isInView) return;

    const duration =
      testimonials[activeIndex]?.displayDuration ?? DEFAULT_DISPLAY_DURATION;
    autoplayTimeoutRef.current = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % testimonialsLength);
    }, duration);

    return () => {
      if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
    };
  }, [autoplay, isInView, activeIndex, testimonialsLength, testimonials]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonialsLength);
    if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
  }, [testimonialsLength]);

  const handlePrev = useCallback(() => {
    setActiveIndex(
      (prev) => (prev - 1 + testimonialsLength) % testimonialsLength,
    );
    if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
  }, [testimonialsLength]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleNext, handlePrev]);

  const featuredActive = Boolean(activeTestimonial.featured);

  function getImageStyle(index: number): React.CSSProperties {
    const isActive = index === activeIndex;
    if (isActive) {
      return {
        zIndex: 3,
        opacity: 1,
        visibility: "visible",
        pointerEvents: "auto",
        transform: "translateX(0px) translateY(0px) scale(1) rotateY(0deg)",
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    }
    return {
      zIndex: 1,
      opacity: 0,
      visibility: "hidden",
      pointerEvents: "none",
      transform: "translateX(0px) translateY(0px) scale(0.95) rotateY(0deg)",
      transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
    };
  }

  const quoteVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <div
      className={`testimonial-container${dense ? " testimonial-container--dense" : ""}`}
      ref={containerRef}
    >
      <div className="testimonial-grid">
        <div
          className={`image-container${featuredActive ? " image-container--featured" : ""}`}
        >
          {testimonials.map((testimonial, index) => (
            <img
              key={testimonial.src}
              src={testimonial.src}
              alt={testimonial.name}
              className="testimonial-image"
              data-index={index}
              style={getImageStyle(index)}
            />
          ))}
        </div>
        <div className="testimonial-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={quoteVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h3
                className="name flex items-center gap-3"
                style={{ color: colorName, fontSize: fontSizeName }}
              >
                {activeTestimonial.name}
                <a
                  href={activeTestimonial.linkedin || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0077b5] hover:opacity-80 transition-opacity"
                  aria-label={`LinkedIn profile of ${activeTestimonial.name}`}
                >
                  <FaLinkedin className="testimonial-linkedin" size={24} />
                </a>
              </h3>
              <p
                className="designation"
                style={{
                  color: colorDesignation,
                  fontSize: fontSizeDesignation,
                }}
              >
                {activeTestimonial.designation}
              </p>
              <motion.p
                className="quote"
                style={{ color: colorTestimony, fontSize: fontSizeQuote }}
              >
                {activeTestimonial.quote.split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{
                      filter: "blur(10px)",
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      filter: "blur(0px)",
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.22,
                      ease: "easeInOut",
                      delay: 0.025 * i,
                    }}
                    style={{ display: "inline-block" }}
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          <div className="arrow-buttons">
            <button
              type="button"
              className="arrow-button prev-button"
              onClick={handlePrev}
              style={{
                backgroundColor: hoverPrev ? colorArrowHoverBg : colorArrowBg,
              }}
              onMouseEnter={() => setHoverPrev(true)}
              onMouseLeave={() => setHoverPrev(false)}
              aria-label="Previous testimonial"
            >
              <FaArrowLeft className="testimonial-arrow-icon" size={28} color={colorArrowFg} />
            </button>
            <button
              type="button"
              className="arrow-button next-button"
              onClick={handleNext}
              style={{
                backgroundColor: hoverNext ? colorArrowHoverBg : colorArrowBg,
              }}
              onMouseEnter={() => setHoverNext(true)}
              onMouseLeave={() => setHoverNext(false)}
              aria-label="Next testimonial"
            >
              <FaArrowRight className="testimonial-arrow-icon" size={28} color={colorArrowFg} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .testimonial-container {
          width: 100%;
          max-width: 56rem;
          padding: 2rem;
        }
        .testimonial-grid {
          display: grid;
          gap: 5rem;
        }
        .image-container {
          position: relative;
          width: 12rem;
          height: 12rem;
          margin: 0 auto;
          perspective: 1000px;
          transition: width 0.8s cubic-bezier(.4,2,.3,1), height 0.8s cubic-bezier(.4,2,.3,1);
        }
        .image-container--featured {
          width: 14.5rem;
          height: 14.5rem;
        }
        .testimonial-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border: 3px solid #fff;
          outline: 1px solid rgba(228, 228, 231, 0.9);
        }
        .testimonial-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .name {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        .designation {
          margin-bottom: 2rem;
        }
        .quote {
          line-height: 1.75;
        }
        .arrow-buttons {
          display: flex;
          gap: 1.5rem;
          padding-top: 3rem;
        }
        .arrow-button {
          width: 2.7rem;
          height: 2.7rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.3s;
          border: none;
        }
        @media (min-width: 768px) {
          .testimonial-grid {
            grid-template-columns: 1fr 1fr;
            align-items: center;
          }
          .image-container {
            width: 14rem;
            height: 14rem;
            margin: 0;
          }
          .image-container--featured {
            width: 17.5rem;
            height: 17.5rem;
          }
          .arrow-buttons {
            padding-top: 0;
          }
        }
        .testimonial-container--dense {
          padding: 0.25rem 0;
          max-width: 100%;
        }
        .testimonial-container--dense .testimonial-grid {
          gap: 0.75rem;
        }
        .testimonial-container--dense .image-container {
          width: 5.25rem;
          height: 5.25rem;
        }
        .testimonial-container--dense .image-container--featured {
          width: 6rem;
          height: 6rem;
        }
        .testimonial-container--dense .designation {
          margin-bottom: 0.5rem;
        }
        .testimonial-container--dense .quote {
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .testimonial-container--dense .arrow-buttons {
          padding-top: 0.5rem;
          gap: 0.65rem;
          justify-content: center;
        }
        .testimonial-container--dense .arrow-button {
          width: 2.15rem;
          height: 2.15rem;
        }
        .testimonial-container--dense .testimonial-arrow-icon {
          width: 14px;
          height: 14px;
        }
        .testimonial-container--dense .testimonial-linkedin {
          width: 18px;
          height: 18px;
        }
        .testimonial-container--dense .name {
          font-size: 1.05rem !important;
          justify-content: center;
        }
        .testimonial-container--dense .designation {
          font-size: 0.8rem !important;
          text-align: center;
        }
        .testimonial-container--dense .quote {
          font-size: 0.8125rem !important;
          text-align: center;
        }
        .testimonial-container--dense .testimonial-content {
          text-align: center;
        }
        @media (min-width: 768px) {
          .testimonial-container--dense {
            padding: 2rem;
          }
          .testimonial-container--dense .testimonial-grid {
            gap: 5rem;
          }
          .testimonial-container--dense .image-container {
            width: 14rem;
            height: 14rem;
            margin: 0;
          }
          .testimonial-container--dense .image-container--featured {
            width: 17.5rem;
            height: 17.5rem;
          }
          .testimonial-container--dense .quote {
            display: block;
            -webkit-line-clamp: unset;
            overflow: visible;
            text-align: left;
            font-size: 1.25rem !important;
            line-height: 1.75;
          }
          .testimonial-container--dense .name {
            font-size: 1.75rem !important;
            justify-content: flex-start;
          }
          .testimonial-container--dense .designation {
            font-size: 1.25rem !important;
            text-align: left;
            margin-bottom: 2rem;
          }
          .testimonial-container--dense .testimonial-content {
            text-align: left;
          }
          .testimonial-container--dense .testimonial-linkedin {
            width: 24px;
            height: 24px;
          }
          .testimonial-container--dense .testimonial-arrow-icon {
            width: 28px;
            height: 28px;
          }
          .testimonial-container--dense .arrow-buttons {
            padding-top: 0;
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default CircularTestimonials;
