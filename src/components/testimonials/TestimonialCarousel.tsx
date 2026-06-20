"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import SectionLabel from "@/components/icons/SectionLabel";
import { StarIcon } from "@/components/icons/Icons";

const REVIEWS_COUNT = 5;

export default function TestimonialCarousel() {
  const t = useTranslations("Testimonials");
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % REVIEWS_COUNT);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + REVIEWS_COUNT) % REVIEWS_COUNT);
  };

  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(nextSlide, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      nextSlide();
    } else if (info.offset.x > swipeThreshold) {
      prevSlide();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const [[, direction], setSlideDirection] = useState([0, 0]);

  useEffect(() => {
    setSlideDirection([index, 1]);
  }, [index]);

  return (
    <section
      className="testimonials-noise relative w-full bg-obsidian py-20 md:py-32 flex flex-col items-center justify-center overflow-hidden border-b border-gold-glow/10"
      id="testimonials"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute w-[320px] h-[320px] rounded-full bg-gold-glow filter blur-[60px] pointer-events-none opacity-15 z-0" />

      <div
        className="container mx-auto px-6 text-center mb-12 md:mb-16 z-10"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <SectionLabel className="mb-2 text-gold font-light block justify-center">{t("title")}</SectionLabel>
        <h2 className="text-3xl md:text-4xl font-serif font-light text-ivory">
          {t("subtitle")}
        </h2>
      </div>

      <div className="relative w-full max-w-4xl min-h-[250px] md:min-h-[220px] px-6 md:px-12 flex items-center justify-center z-10">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="w-full flex flex-col items-center text-center cursor-grab active:cursor-grabbing select-none"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            <span className="font-serif text-5xl md:text-7xl text-gold-muted/30 leading-none h-6 select-none">
              “
            </span>

            <blockquote className="text-[22px] md:text-[28px] font-serif italic text-ivory max-w-2xl px-4 md:px-8 mt-2 md:mt-4 leading-relaxed text-balance">
              {t(`reviews.${index}.quote`)}
            </blockquote>

            <div className="flex gap-1 mt-6">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} size={16} className="text-gold" />
              ))}
            </div>

            <div className="mt-4 flex flex-col md:flex-row items-center gap-1 md:gap-3">
              <cite className="not-italic font-sans text-xs md:text-sm font-semibold tracking-wider text-gold">
                {t(`reviews.${index}.name`)}
              </cite>
              <span className="hidden md:inline text-ivory-faint">|</span>
              <span className="text-[10px] md:text-xs text-ivory-muted tracking-widest font-sans font-light">
                {t(`reviews.${index}.city`)}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
